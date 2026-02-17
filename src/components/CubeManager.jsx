import { useState } from "react";
import { getMaterialColor } from "../simulation/materials.js";
import Cube from "./Cube";
import GhostCube from "./GhostCube";

export default function CubeManager({ dispatch, state }) {
  const [ghostPosition, setGhostPosition] = useState([0, 0.5, 0]);

  const handleHover = (position) => {
    setGhostPosition(position);
  };

  const handlePlace = (position) => {
    dispatch({
      type: "PLACE_DRAFT",
      payload: {
        x: position[0],
        y: position[1],
        z: position[2],
        material: state.currentMaterial
      }
    });
  };

  const handleDelete = (cubeId, status) => {
    if (status === "draft") {
      dispatch({
        type: "DELETE_DRAFT",
        payload: { id: cubeId }
      });
    } else if (status === "confirmed") {
      dispatch({
        type: "DELETE_CONFIRMED",
        payload: { id: cubeId }
      });
    }
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
