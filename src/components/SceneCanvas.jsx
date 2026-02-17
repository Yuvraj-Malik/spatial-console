import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import CubeManager from "./CubeManager";
import GridHelper from "./GridHelper";
import GestureCursor from "./GestureCursor";

export default function SceneCanvas({ dispatch, state, gestureCursorPos, gestureMode }) {
  return (
    <Canvas
      onContextMenu={(e) => e.preventDefault()}
      camera={{ position: [6, 6, 6], fov: 50 }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <hemisphereLight args={["#3b82f6", "#0f172a", 0.6]} />

      <color attach="background" args={["#0d1324"]} />

      {/* Grid Helper */}
      <GridHelper />

      {/* Cube Manager */}
      <CubeManager dispatch={dispatch} state={state} />

      {/* Gesture Cursor */}
      <GestureCursor position={gestureCursorPos} visible={gestureMode} />

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        mouseButtons={{
          LEFT: null,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
      />
    </Canvas>
  );
}
