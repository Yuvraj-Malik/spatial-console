import { useState, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getMaterialColor } from "../simulation/materials.js";
import { dispatchAction, createPlaceAction, createDeleteAction } from "../controllers/actionController.js";
import Cube from "./Cube";
import GhostCube from "./GhostCube";

export default function CubeManager({ dispatch, state, gestureCursorPos, gestureMode }) {
  const [ghostPosition, setGhostPosition] = useState([0, 0.5, 0]);
  const groundRef = useRef();
  const { camera, raycaster } = useThree();
  const [lastGestureWorldPos, setLastGestureWorldPos] = useState(null);

  const handleHover = (position) => {
    // Only update ghost position with mouse if gesture mode is NOT active
    if (!gestureMode) {
      setGhostPosition(position);
    }
  };

  const handlePlace = (position) => {
    const action = createPlaceAction(position, state.currentMaterial);
    dispatchAction(dispatch, action.type, action.payload);
  };

  const handleDelete = (cubeId, status) => {
    const action = createDeleteAction(cubeId, status);
    dispatchAction(dispatch, action.type, action.payload);
  };

  // Raycast from screen coordinates to ground plane
  const raycastFromScreen = (screenX, screenY) => {
    // Convert screen coordinates to NDC (Normalized Device Coordinates)
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1; // Negative because screen Y is inverted

    // Set raycaster from camera through NDC point
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

    // Intersect only with ground plane
    const intersects = raycaster.intersectObject(groundRef.current);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      return {
        x: Math.round(point.x),
        y: 0.5,
        z: Math.round(point.z)
      };
    }
    
    return null; // No intersection
  };

  // Update ghost position based on gesture cursor when gesture mode is active
  useEffect(() => {
    if (gestureMode && gestureCursorPos.x && gestureCursorPos.y) {
      const worldPos = raycastFromScreen(gestureCursorPos.x, gestureCursorPos.y);
      if (worldPos) {
        setGhostPosition([worldPos.x, worldPos.y, worldPos.z]);
        setLastGestureWorldPos(worldPos); // Store for placement
      }
    }
  }, [gestureCursorPos, gestureMode, camera, raycaster]);

  // Handle gesture-based placement
  useEffect(() => {
    // Listen for custom gesture placement event
    const handleGesturePlace = (event) => {
      if (lastGestureWorldPos && gestureMode) {
        console.log("🎯 Placing cube at raycast position:", lastGestureWorldPos);
        handlePlace([lastGestureWorldPos.x, lastGestureWorldPos.y, lastGestureWorldPos.z]);
      }
    };

    window.addEventListener('gesturePlace', handleGesturePlace);
    return () => window.removeEventListener('gesturePlace', handleGesturePlace);
  }, [lastGestureWorldPos, gestureMode, state.currentMaterial]);

  return (
    <>
      {/* Ground plane for interaction */}
      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={(e) => {
          // Only handle mouse movement if gesture mode is NOT active
          if (!gestureMode) {
            const point = e.point;
            setGhostPosition([Math.round(point.x), 0.5, Math.round(point.z)]);
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          // Only handle mouse clicks if gesture mode is NOT active
          if (e.button === 0 && !gestureMode) {
            const point = e.point;
            handlePlace([Math.round(point.x), 0.5, Math.round(point.z)]);
          }
        }}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Render confirmed cubes */}
      {state.confirmedCubes.map((cube) => (
        <Cube
          key={cube.id}
          cube={cube}
          onHover={handleHover}
          onPlace={handlePlace}
          onDelete={() => handleDelete(cube.id, cube.status)}
          isUnstable={state.collapseState.unstableIds.includes(cube.id)}
        />
      ))}
      
      {/* Render draft cubes */}
      {state.draftCubes.map((cube) => (
        <Cube
          key={cube.id}
          cube={cube}
          onHover={handleHover}
          onPlace={handlePlace}
          onDelete={() => handleDelete(cube.id, cube.status)}
        />
      ))}
      
      {/* Ghost cube for preview */}
      <GhostCube 
        position={ghostPosition} 
        color={getMaterialColor(state.currentMaterial)}
      />
    </>
  );
}
