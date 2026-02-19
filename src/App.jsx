import SceneCanvas from "./components/SceneCanvas";
import UIOverlay from "./components/UIOverlay";
import GestureOverlay from "./components/GestureOverlay";
import { useReducer, useEffect, useRef, useState } from "react";
import { simulationReducer, initialState } from "./simulation/reducer.js";
import { dispatchAction, createMaterialAction } from "./controllers/actionController.js";

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
        transition: "transform 0.05s linear"
      }}
    />
  );
}

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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDelete = (cubeId, status) => {
    dispatch({
      type: status === "draft" ? "DELETE_DRAFT" : "DELETE_CONFIRMED",
      payload: { id: cubeId }
    });
  };

  const handleMaterialChange = (material) => {
    dispatch({
      type: "SET_MATERIAL",
      payload: { material }
    });
  };

  const handleUndo = () => {
    dispatch({ type: "UNDO" });
  };

  const handleCollapse = () => {
    dispatch({ type: "COLLAPSE" });
  };

  const handleCancelCollapse = () => {
    dispatch({ type: "CANCEL_COLLAPSE" });
  };

  // Gesture callbacks
  const handleGestureCursorUpdate = (position) => {
    setGestureCursorPos(position);
  };

  const handleGestureDetected = (gesture) => {
    console.log("🎭 Gesture detected:", gesture);
    
    // Connect gestures to actual cube operations
    switch (gesture) {
      case 'pinch':
        // Pinch is now handled by simulated mouse events in gesture controller
        console.log("🤏 Pinch handled by mouse simulation");
        break;
        
      case 'open_palm':
        // Confirm structure
        console.log("✅ Confirming structure");
        dispatch({ type: "CONFIRM_DRAFT" });
        break;
        
      case 'fist':
        // Fist is now handled by simulated right-click in gesture controller
        console.log("✊ Fist handled by right-click simulation");
        break;
        
      default:
        console.log("❓ Unknown gesture:", gesture);
    }
  };

  // Determine if gesture mode is active (cursor moves)
  const gestureMode = isGestureActive || (gestureCursorPos.x !== 0 || gestureCursorPos.z !== 0);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#05070d" }}>
      {/* Virtual Cursor */}
      <VirtualCursor />
      
      <SceneCanvas 
        dispatch={dispatch} 
        state={state} 
        gestureCursorPos={gestureCursorPos} 
        gestureMode={gestureMode}
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
      
      <GestureOverlay 
        onCursorUpdate={handleGestureCursorUpdate}
        onGestureDetected={handleGestureDetected}
      />
    </div>
  );
}

export default App;
