import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import CubeManager from "./CubeManager";
import GridHelper from "./GridHelper";
import GestureCursor from "./GestureCursor";
import WalkthroughController from "./WalkthroughController";

function FreeHandMoveController({ enabled }) {
  const { camera, gl } = useThree();
  const movingForwardRef = useRef(false);
  const forwardDirection = useRef(new THREE.Vector3());

  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerDown = (event) => {
      if (!enabled || event.button !== 0) {
        return;
      }

      movingForwardRef.current = true;
    };

    const stopMoving = () => {
      movingForwardRef.current = false;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", stopMoving);
    window.addEventListener("blur", stopMoving);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", stopMoving);
      window.removeEventListener("blur", stopMoving);
    };
  }, [enabled, gl]);

  useFrame((_, delta) => {
    if (!enabled || !movingForwardRef.current) {
      return;
    }

    camera.getWorldDirection(forwardDirection.current);
    forwardDirection.current.y = 0;

    if (forwardDirection.current.lengthSq() === 0) {
      return;
    }

    forwardDirection.current.normalize();
    camera.position.addScaledVector(forwardDirection.current, delta * 6);
  });

  return null;
}

function KeyboardMoveController({ enabled, controlsRef }) {
  const { camera } = useThree();
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const forwardDirection = useRef(new THREE.Vector3());
  const rightDirection = useRef(new THREE.Vector3());
  const movement = useRef(new THREE.Vector3());
  const upAxis = useRef(new THREE.Vector3(0, 1, 0));

  useEffect(() => {
    const isTypingTarget = (target) => {
      if (!target) return false;
      const tagName = target.tagName;
      return (
        target.isContentEditable ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT"
      );
    };

    const handleKeyDown = (event) => {
      if (!enabled || isTypingTarget(event.target)) {
        return;
      }

      switch (event.code) {
        case "KeyW":
          keysRef.current.forward = true;
          event.preventDefault();
          break;
        case "KeyS":
          keysRef.current.backward = true;
          event.preventDefault();
          break;
        case "KeyA":
          keysRef.current.left = true;
          event.preventDefault();
          break;
        case "KeyD":
          keysRef.current.right = true;
          event.preventDefault();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.code) {
        case "KeyW":
          keysRef.current.forward = false;
          break;
        case "KeyS":
          keysRef.current.backward = false;
          break;
        case "KeyA":
          keysRef.current.left = false;
          break;
        case "KeyD":
          keysRef.current.right = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      return;
    }

    keysRef.current.forward = false;
    keysRef.current.backward = false;
    keysRef.current.left = false;
    keysRef.current.right = false;
  }, [enabled]);

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }

    const { forward, backward, left, right } = keysRef.current;
    if (!forward && !backward && !left && !right) {
      return;
    }

    camera.getWorldDirection(forwardDirection.current);
    forwardDirection.current.y = 0;
    if (forwardDirection.current.lengthSq() === 0) {
      return;
    }
    forwardDirection.current.normalize();

    rightDirection.current.crossVectors(forwardDirection.current, upAxis.current).normalize();

    movement.current.set(0, 0, 0);
    if (forward) movement.current.add(forwardDirection.current);
    if (backward) movement.current.sub(forwardDirection.current);
    if (left) movement.current.sub(rightDirection.current);
    if (right) movement.current.add(rightDirection.current);

    if (movement.current.lengthSq() === 0) {
      return;
    }

    movement.current.normalize().multiplyScalar(delta * 8);
    camera.position.add(movement.current);

    if (controlsRef.current?.target) {
      controlsRef.current.target.add(movement.current);
      controlsRef.current.update();
    }
  });

  return null;
}

export default function SceneCanvas({
  dispatch,
  state,
  gestureCursorPos,
  gestureMode,
  onSceneReady,
  gestureControllerRef,
}) {
  const initialCameraPosition = [14, 18, 14];
  const placementActive = state.viewSettings?.placementActive !== false;
  const walkthroughActive = state.viewSettings?.walkthroughActive;
  const orbitControlsRef = useRef(null);

  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      style={{ cursor: placementActive && !walkthroughActive ? "crosshair" : "grab" }}
      camera={{
        position: initialCameraPosition,
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
      onContextMenu={(e) => e.preventDefault()}
      onCreated={({ scene, camera, gl }) => {
        camera.lookAt(0, 0, 0);
        console.log("🎬 Three.js scene created");
        if (gestureControllerRef.current) {
          gestureControllerRef.current.setThreeRefs(scene, camera, gl);
        }
        // Trigger scene ready callback
        if (onSceneReady) {
          onSceneReady({ scene, camera, renderer: gl });
        }
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={state.viewSettings?.lightsOn !== false ? 0.6 : 0.05} />
      <directionalLight position={[5, 10, 5]} intensity={state.viewSettings?.lightsOn !== false ? 1.5 : 0.1} />
      <hemisphereLight args={["#3b82f6", "#0f172a", state.viewSettings?.lightsOn !== false ? 0.6 : 0.05]} />

      <color attach="background" args={["#0d1324"]} />

      {/* Grid Helper */}
      {state.viewSettings?.showGrid !== false && !state.viewSettings?.walkthroughActive && <GridHelper />}

      {/* Cube Manager */}
      <CubeManager dispatch={dispatch} state={state} />

      {/* Gesture Cursor */}
      <GestureCursor position={gestureCursorPos} visible={gestureMode && !state.viewSettings?.walkthroughActive} />

      <FreeHandMoveController enabled={!placementActive && !walkthroughActive} />
      <KeyboardMoveController enabled={!walkthroughActive} controlsRef={orbitControlsRef} />

      {/* Camera Controls */}
      {state.viewSettings?.walkthroughActive ? (
        <WalkthroughController state={state} dispatch={dispatch} />
      ) : (
        <OrbitControls
          ref={orbitControlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={state.viewSettings?.autoRotate || false}
          autoRotateSpeed={0.8}
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2 - 0.05}
          mouseButtons={{
            LEFT: null,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />
      )}
    </Canvas>
  );
}
