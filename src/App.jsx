import { useReducer, useRef } from "react";
import SceneCanvas from "./components/SceneCanvas";
import UIOverlay from "./components/UIOverlay";
import GestureOverlay from "./components/GestureOverlay";
import { simulationReducer, initialState } from "./simulation/reducer.js";

// Virtual Cursor Component
function VirtualCursor() {
  return (
    <div
      id="virtual-cursor"
      style={{
        position: "fixed",
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "white",
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
      }}
    />
  );
}

export default function App() {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const gestureCursorPos = { x: 0, y: 0.5, z: 0 };
  const gestureMode = false;
  const gestureControllerRef = useRef(null);

  const handleMaterialChange = (material) => {
    dispatch({
      type: "SET_MATERIAL",
      payload: { material },
    });
  };

  const handleUndo = () => {
    dispatch({ type: "UNDO" });
  };

  const handleCancelCollapse = () => {
    dispatch({ type: "CANCEL_COLLAPSE" });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#05070d" }}>
      {/* Virtual Cursor */}
      <VirtualCursor />

      <SceneCanvas
        dispatch={dispatch}
        state={state}
        gestureCursorPos={gestureCursorPos}
        gestureMode={gestureMode}
        gestureControllerRef={gestureControllerRef}
      />

      <UIOverlay
        currentMaterial={state.currentMaterial}
        onMaterialChange={handleMaterialChange}
        onConfirm={() => dispatch({ type: "CONFIRM_DRAFT" })}
        onUndo={handleUndo}
        draftCount={state.draftCubes.length}
        confirmedCount={state.confirmedCubes.length}
        collapseState={state.collapseState}
        onCancelCollapse={handleCancelCollapse}
      />

      <GestureOverlay gestureControllerRef={gestureControllerRef} />
    </div>
  );
}
