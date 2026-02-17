import SceneCanvas from "./components/SceneCanvas";
import UIOverlay from "./components/UIOverlay";
import GestureOverlay from "./components/GestureOverlay";
import { useReducer, useEffect, useRef, useState } from "react";
import { simulationReducer, initialState } from "./simulation/reducer.js";
import { dispatchAction, createMaterialAction } from "./controllers/actionController.js";

function App() {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const countdownRef = useRef(null);
  
  // Gesture state
  const [gestureCursorPos, setGestureCursorPos] = useState({ x: 0, y: 0.5, z: 0 });
  const [isGestureActive, setIsGestureActive] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        dispatchAction(dispatch, "UNDO");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Collapse countdown timer
  useEffect(() => {
    if (state.collapseState.warningActive && state.collapseState.countdown > 0) {
      countdownRef.current = setTimeout(() => {
        dispatchAction(dispatch, "UPDATE_COUNTDOWN", { countdown: state.collapseState.countdown - 1 });
      }, 1000);
    } else if (state.collapseState.warningActive && state.collapseState.countdown === 0) {
      // Trigger collapse
      dispatchAction(dispatch, "COLLAPSE");
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [state.collapseState.warningActive, state.collapseState.countdown]);

  const handleMaterialChange = (material) => {
    const action = createMaterialAction(material);
    dispatchAction(dispatch, action.type, action.payload);
  };

  const handleConfirm = () => {
    dispatchAction(dispatch, "CONFIRM_DRAFT");
  };

  const handleUndo = () => {
    dispatchAction(dispatch, "UNDO");
  };

  const handleCancelCollapse = () => {
    dispatchAction(dispatch, "CANCEL_COLLAPSE");
  };

  // Gesture callbacks
  const handleGestureCursorUpdate = (position) => {
    setGestureCursorPos(position);
  };

  const handleGestureDetected = (gesture) => {
    console.log("🎭 Gesture detected:", gesture);
    // Phase 2: Logging only - no actions yet
  };

  // Determine if gesture mode is active (cursor moves)
  const gestureMode = isGestureActive || (gestureCursorPos.x !== 0 || gestureCursorPos.z !== 0);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#05070d" }}>
      <SceneCanvas 
        dispatch={dispatch} 
        state={state} 
        gestureCursorPos={gestureCursorPos}
        gestureMode={gestureMode}
      />
      <UIOverlay
        currentMaterial={state.currentMaterial}
        onMaterialChange={handleMaterialChange}
        onConfirm={handleConfirm}
        onUndo={handleUndo}
        draftCount={state.draftCubes.length}
        confirmedCount={state.confirmedCubes.length}
        collapseState={state.collapseState}
        onCancelCollapse={handleCancelCollapse}
      />
      <GestureOverlay
        onCursorUpdate={handleGestureCursorUpdate}
        onGestureDetected={handleGestureDetected}
      />
    </div>
  );
}

export default App;
