import SceneCanvas from "./components/SceneCanvas";
import UIOverlay from "./components/UIOverlay";
import { useReducer, useEffect, useRef } from "react";
import { simulationReducer, initialState } from "./simulation/reducer.js";

function App() {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const countdownRef = useRef(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Collapse countdown timer
  useEffect(() => {
    if (state.collapseState.warningActive && state.collapseState.countdown > 0) {
      countdownRef.current = setTimeout(() => {
        dispatch({ type: "UPDATE_COUNTDOWN", payload: state.collapseState.countdown - 1 });
      }, 1000);
    } else if (state.collapseState.warningActive && state.collapseState.countdown === 0) {
      // Trigger collapse
      dispatch({ type: "COLLAPSE" });
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [state.collapseState.warningActive, state.collapseState.countdown]);

  const handleMaterialChange = (material) => {
    dispatch({
      type: "SET_MATERIAL",
      payload: material
    });
  };

  const handleConfirm = () => {
    dispatch({ type: "CONFIRM_DRAFT" });
  };

  const handleUndo = () => {
    dispatch({ type: "UNDO" });
  };

  const handleCancelCollapse = () => {
    dispatch({ type: "CANCEL_COLLAPSE" });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#05070d" }}>
      <SceneCanvas dispatch={dispatch} state={state} />
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
    </div>
  );
}

export default App;
