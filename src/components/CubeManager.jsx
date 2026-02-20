import { useState } from "react";
import { getMaterialColor } from "../simulation/materials.js";
import {
  dispatchAction,
  createPlaceAction,
  createDeleteAction,
} from "../controllers/actionController.js";
import Cube from "./Cube";
import GhostCube from "./GhostCube";

export default function CubeManager({ dispatch, state }) {
  const [ghostPosition, setGhostPosition] = useState([0, 0.5, 0]);

  const handleHover = (position) => {
    // Update ghost position for both mouse and gesture modes
    setGhostPosition(position);
  };

  const handlePlace = (position) => {
    const action = createPlaceAction(position, state.currentMaterial);
    dispatchAction(dispatch, action.type, action.payload);
  };

  const handleDelete = (cubeId, status) => {
    const action = createDeleteAction(cubeId, status);
    dispatchAction(dispatch, action.type, action.payload);
  };

  return (
    <>
      {/* Ground plane for interaction */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={(e) => {
          const point = e.point;
          setGhostPosition([Math.round(point.x), 0.5, Math.round(point.z)]);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.button === 0) {
            const point = e.point;
            handlePlace([Math.round(point.x), 0.5, Math.round(point.z)]);
          }
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          if (window.__gestureRotateActive) return;
          const point = e.point;
          // Find cube at position and delete it
          const allCubes = [...state.draftCubes, ...state.confirmedCubes];
          const cubeToDelete = allCubes.find(
            (cube) =>
              cube.x === Math.round(point.x) &&
              cube.y === 0.5 &&
              cube.z === Math.round(point.z),
          );
          if (cubeToDelete) {
            handleDelete(cubeToDelete.id, cubeToDelete.status);
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
