import { useCallback, useEffect, useReducer, useRef } from "react";
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

  // Collapse countdown timer loop
  useEffect(() => {
    if (!state.collapseState.warningActive) return;

    const timer = setInterval(() => {
      if (state.collapseState.countdown > 1) {
        dispatch({
          type: "UPDATE_COUNTDOWN",
          payload: { countdown: state.collapseState.countdown - 1 }
        });
      } else {
        dispatch({ type: "COLLAPSE" });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [state.collapseState.warningActive, state.collapseState.countdown]);

  // Keyboard shortcut listener (Ctrl+Z for Undo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  const handleGestureAction = useCallback(
    (action) => {
      if (action === "confirm") {
        dispatch({ type: "CONFIRM_DRAFT" });
      }
    },
    [dispatch],
  );

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
        state={state}
        dispatch={dispatch}
      />

      <GestureOverlay
        gestureControllerRef={gestureControllerRef}
        onGestureAction={handleGestureAction}
      />
    </div>
  );
}
