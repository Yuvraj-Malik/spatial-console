import { useState, useEffect } from "react";
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
  const [lineStart, setLineStart] = useState(null);
  const [heightOffset, setHeightOffset] = useState(0);
  const activeRotation = state.rotationY || 0;

  // Reset line start when tool mode changes
  const toolMode = state.viewSettings?.toolMode || "single";
  useEffect(() => {
    setLineStart(null);
    setHeightOffset(0);
  }, [toolMode]);

  // Reset height offset when line start is cleared
  useEffect(() => {
    if (!lineStart) {
      setHeightOffset(0);
    }
  }, [lineStart]);

  // Listen to key events to cancel, adjust vertical height, or rotate
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLineStart(null);
        return;
      }
      
      if (e.key.toLowerCase() === "r") {
        dispatch({ type: "ROTATE_Y" });
        return;
      }

      if (!lineStart) return;

      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        e.preventDefault();
        setHeightOffset((prev) => prev + 1);
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        setHeightOffset((prev) => prev - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lineStart]);

  const handleHover = (position) => {
    setGhostPosition(position);
  };

  const handlePlace = (position) => {
    const action = {
      type: "PLACE_DRAFT",
      payload: {
        x: position[0],
        y: position[1],
        z: position[2],
        material: state.currentMaterial,
        shape: state.currentShape || "cube",
        rotationY: activeRotation
      }
    };
    dispatchAction(dispatch, action.type, action.payload);
  };

  const handlePlaceLine = (positions) => {
    const cubes = positions.map(pos => ({
      x: pos[0],
      y: pos[1],
      z: pos[2],
      material: state.currentMaterial,
      shape: state.currentShape || "cube",
      rotationY: activeRotation
    }));
    dispatch({
      type: "PLACE_LINE_DRAFT",
      payload: { cubes }
    });
  };

  const handleDelete = (cubeId, status) => {
    const action = createDeleteAction(cubeId, status);
    dispatchAction(dispatch, action.type, action.payload);
  };

  // Calculate coordinates along snapped dominant axis path for line tool preview
  const getGhostPath = () => {
    if (toolMode !== "line" || !lineStart) {
      return [ghostPosition];
    }

    const targetPos = [
      ghostPosition[0],
      ghostPosition[1] + heightOffset,
      ghostPosition[2]
    ];

    const dx = targetPos[0] - lineStart[0];
    const dy = targetPos[1] - lineStart[1];
    const dz = targetPos[2] - lineStart[2];
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const absZ = Math.abs(dz);

    const max = Math.max(absX, absY, absZ);
    let path = [];

    if (max > 0) {
      if (max === absX) {
        const step = Math.sign(dx);
        for (let x = 0; x <= absX; x++) {
          path.push([lineStart[0] + x * step, lineStart[1], lineStart[2]]);
        }
      } else if (max === absY) {
        const step = Math.sign(dy);
        for (let y = 0; y <= absY; y++) {
          path.push([lineStart[0], lineStart[1] + y * step, lineStart[2]]);
        }
      } else {
        const step = Math.sign(dz);
        for (let z = 0; z <= absZ; z++) {
          path.push([lineStart[0], lineStart[1], lineStart[2] + z * step]);
        }
      }
    } else {
      path = [lineStart];
    }
    return path;
  };

  const ghostPath = getGhostPath();

  const handleInteract = (position) => {
    if (toolMode === "line") {
      if (!lineStart) {
        setLineStart(position);
      } else {
        handlePlaceLine(ghostPath);
        setLineStart(null);
      }
    } else {
      handlePlace(position);
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
            handleInteract([Math.round(point.x), 0.5, Math.round(point.z)]);
          }
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          if (window.__gestureRotateActive) return;
          const point = e.point;
          
          if (toolMode === "line" && lineStart) {
            setLineStart(null);
            return;
          }

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
          onPlace={handleInteract}
          onDelete={() => handleDelete(cube.id, cube.status)}
          isUnstable={state.collapseState.unstableIds.includes(cube.id)}
          stressHeatmapEnabled={state.viewSettings?.stressHeatmap}
          stressRatio={state.structuralMetrics?.stresses?.[cube.id]?.stressRatio || 0}
        />
      ))}

      {/* Render draft cubes */}
      {state.draftCubes.map((cube) => (
        <Cube
          key={cube.id}
          cube={cube}
          onHover={handleHover}
          onPlace={handleInteract}
          onDelete={() => handleDelete(cube.id, cube.status)}
        />
      ))}

      {/* Ghost cubes for preview */}
      {ghostPath.map((pos, idx) => (
        <GhostCube
          key={`${pos[0]}-${pos[1]}-${pos[2]}-${idx}`}
          position={pos}
          color={getMaterialColor(state.currentMaterial)}
          shape={state.currentShape || "cube"}
          rotationY={activeRotation}
        />
      ))}
    </>
  );
}
