import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import CubeManager from "./CubeManager";
import GridHelper from "./GridHelper";
import GestureCursor from "./GestureCursor";
import WalkthroughController from "./WalkthroughController";

export default function SceneCanvas({
  dispatch,
  state,
  gestureCursorPos,
  gestureMode,
  onSceneReady,
  gestureControllerRef,
}) {
  const initialCameraPosition = [14, 18, 14];

  return (
    <Canvas
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

      {/* Camera Controls */}
      {state.viewSettings?.walkthroughActive ? (
        <WalkthroughController state={state} dispatch={dispatch} />
      ) : (
        <OrbitControls
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
