import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import SceneCanvas from "./components/SceneCanvas";
import UIOverlay from "./components/UIOverlay";
import GestureOverlay from "./components/GestureOverlay";
import { simulationReducer, initialState } from "./simulation/reducer.js";
import { auth, getLocalUser, loadStructureById, firebaseEnabled } from "./core/firebase.js";
import { onAuthStateChanged } from "firebase/auth";

// Virtual Cursor Component
function VirtualCursor({ visible }) {
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
        display: visible ? "block" : "none",
      }}
    />
  );
}

export default function App() {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const [gestureMode, setGestureMode] = useState(false);
  const gestureCursorPos = { x: 0, y: 0.5, z: 0 };
  const gestureControllerRef = useRef(null);

  // Listen to Auth State Changes
  useEffect(() => {
    // Check local user fallback first if firebase is not initialized
    const localUser = getLocalUser();
    if (localUser && !firebaseEnabled) {
      dispatch({ type: "SET_USER", payload: localUser });
    }

    if (firebaseEnabled && auth) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          dispatch({
            type: "SET_USER",
            payload: {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL
            }
          });
        } else {
          dispatch({ type: "SET_USER", payload: null });
        }
      });
      return () => unsubscribe();
    }
  }, [dispatch]);

  // Handle Loading Shared Blueprints from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get("share");
    if (shareId) {
      console.log(`🔗 Detected share ID in URL: ${shareId}`);
      
      const loadShared = async () => {
        try {
          const data = await loadStructureById(shareId);
          if (data && data.cubes) {
            dispatch({ type: "LOAD_JSON", payload: { cubes: data.cubes } });
            console.log("✓ Loaded shared structure:", data.name);
          }
        } catch (error) {
          console.error("Failed to load shared structure:", error);
          alert("Error loading shared structure. It may have been deleted.");
        }
      };
      
      // Delay slightly to ensure canvas is ready
      const timer = setTimeout(loadShared, 800);
      return () => clearTimeout(timer);
    }
  }, [dispatch]);

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
      <VirtualCursor visible={gestureMode} />

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
        onGestureModeChange={setGestureMode}
      />
    </div>
  );
}
