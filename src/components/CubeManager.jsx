import { useState, useEffect, useMemo, useCallback } from "react";
import { getMaterialColor } from "../simulation/materials.js";
import {
  dispatchAction,
  createPlaceAction,
  createDeleteAction,
} from "../controllers/actionController.js";
import Cube from "./Cube";
import GhostCube from "./GhostCube";
import CubeInstances from "./CubeInstances";

export default function CubeManager({ dispatch, state }) {
  const [ghostPosition, setGhostPosition] = useState([0, 0.5, 0]);
  const [lineStart, setLineStart] = useState(null);
  const [heightOffset, setHeightOffset] = useState(0);
  const activeRotation = state.rotationY || 0;
  const walkthroughActive = state.viewSettings?.walkthroughActive || false;
  const placementActive = state.viewSettings?.placementActive !== false;
  const openInteractiveIdSet = useMemo(
    () => new Set(state.openInteractiveIds || []),
    [state.openInteractiveIds],
  );

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
        dispatch({
          type: "SET_PLACEMENT_ACTIVE",
          payload: { active: false },
        });
        return;
      }
      
      if (e.key.toLowerCase() === "r") {
        dispatch({ type: "ROTATE_Y" });
        return;
      }

      if (!lineStart) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHeightOffset((prev) => prev + 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHeightOffset((prev) => prev - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lineStart]);

  const updateGhostPosition = useCallback((position) => {
    setGhostPosition((prev) => {
      if (
        prev[0] === position[0] &&
        prev[1] === position[1] &&
        prev[2] === position[2]
      ) {
        return prev;
      }
      return position;
    });
  }, []);

  const handleHover = useCallback(
    (position) => {
      if (!placementActive) return;
      updateGhostPosition(position);
    },
    [placementActive, updateGhostPosition],
  );

  const handlePlace = useCallback((position) => {
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
  }, [activeRotation, dispatch, state.currentMaterial, state.currentShape]);

  const handlePlaceLine = useCallback((positions) => {
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
  }, [activeRotation, dispatch, state.currentMaterial, state.currentShape]);

  const handleDelete = useCallback((cubeId, status) => {
    const action = createDeleteAction(cubeId, status);
    dispatchAction(dispatch, action.type, action.payload);
  }, [dispatch]);

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

  const ghostPath = useMemo(() => getGhostPath(), [toolMode, lineStart, ghostPosition, heightOffset]);

  const confirmedCubeBlocks = useMemo(
    () => state.confirmedCubes.filter((cube) => (cube.shape || "cube") === "cube"),
    [state.confirmedCubes],
  );
  const confirmedOtherShapes = useMemo(
    () => state.confirmedCubes.filter((cube) => (cube.shape || "cube") !== "cube"),
    [state.confirmedCubes],
  );
  const draftCubeBlocks = useMemo(
    () => state.draftCubes.filter((cube) => (cube.shape || "cube") === "cube"),
    [state.draftCubes],
  );
  const draftOtherShapes = useMemo(
    () => state.draftCubes.filter((cube) => (cube.shape || "cube") !== "cube"),
    [state.draftCubes],
  );

  const handleInteract = useCallback((position) => {
    if (!placementActive) {
      return;
    }

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
  }, [ghostPath, handlePlace, handlePlaceLine, lineStart, placementActive, toolMode]);

  const handleGroundPointerMove = useCallback((e) => {
    if (!placementActive) return;
    const point = e.point;
    updateGhostPosition([Math.round(point.x), 0.5, Math.round(point.z)]);
  }, [placementActive, updateGhostPosition]);

  return (
    <>
      {/* Ground plane for interaction */}
      {!walkthroughActive && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          onPointerMove={handleGroundPointerMove}
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
      )}

      {/* Fast path for standard cube blocks */}
      <CubeInstances
        cubes={confirmedCubeBlocks}
        onHover={handleHover}
        onPlace={handleInteract}
        onDelete={handleDelete}
        walkthroughActive={walkthroughActive}
        lightsOn={state.viewSettings?.lightsOn !== false}
      />

      {/* Render non-cube shapes with per-mesh components */}
      {confirmedOtherShapes.map((cube) => (
        <Cube
          key={cube.id}
          cube={cube}
          onHover={handleHover}
          onPlace={handleInteract}
          onDelete={handleDelete}
          isOpen={openInteractiveIdSet.has(cube.id)}
          walkthroughActive={walkthroughActive}
          lightsOn={state.viewSettings?.lightsOn !== false}
        />
      ))}

      {draftCubeBlocks.map((cube) => (
        <Cube
          key={cube.id}
          cube={cube}
          onHover={handleHover}
          onPlace={handleInteract}
          onDelete={handleDelete}
          walkthroughActive={walkthroughActive}
          lightsOn={state.viewSettings?.lightsOn !== false}
        />
      ))}

      {draftOtherShapes.map((cube) => (
        <Cube
          key={cube.id}
          cube={cube}
          onHover={handleHover}
          onPlace={handleInteract}
          onDelete={handleDelete}
          isOpen={openInteractiveIdSet.has(cube.id)}
          walkthroughActive={walkthroughActive}
          lightsOn={state.viewSettings?.lightsOn !== false}
        />
      ))}

      {/* Ghost cubes for preview */}
      {!walkthroughActive && placementActive && ghostPath.map((pos, idx) => (
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
