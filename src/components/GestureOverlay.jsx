import { useEffect, useRef, useState } from "react";
import GestureController from "../controllers/gestureController.js";

export default function GestureOverlay({ onCursorUpdate, onGestureDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const controllerRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [showRawVideo, setShowRawVideo] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0.5, z: 0 });

  useEffect(() => {
    // Initialize gesture controller when component mounts
    const initializeController = async () => {
      console.log("🔧 Initializing gesture controller...");
      
      // Small delay to ensure DOM is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("Video ref:", !!videoRef.current);
      console.log("Canvas ref:", !!canvasRef.current);
      
      if (!videoRef.current || !canvasRef.current) {
        console.error("❌ Refs not available after delay");
        // Try once more after a longer delay
        setTimeout(() => {
          console.log("🔄 Retrying initialization...");
          if (videoRef.current && canvasRef.current) {
            console.log("✅ Refs found on retry!");
            initializeController();
          } else {
            console.error("❌ Refs still not available");
          }
        }, 1000);
        return;
      }

      try {
        const controller = new GestureController();
        controllerRef.current = controller;
        console.log("✅ GestureController instance created");

        // Set callbacks
        controller.setCursorCallback((position) => {
          setCursorPosition(position);
          if (onCursorUpdate) {
            onCursorUpdate(position);
          }
        });

        controller.setGestureCallback((gesture) => {
          if (onGestureDetected) {
            onGestureDetected(gesture);
          }
        });

        await controller.initialize(videoRef.current, canvasRef.current);
        console.log("✅ Gesture controller ready");
        setIsInitialized(true);
        
        // Check if we're in simulation mode
        if (controller.mouseSimulation) {
          setIsSimulationMode(true);
          console.log("🖱️ Mouse simulation mode detected");
        }
      } catch (error) {
        console.error("❌ Failed to initialize gesture controller:", error);
      }
    };

    initializeController();

    return () => {
      if (controllerRef.current) {
        controllerRef.current.stop();
      }
    };
  }, [onCursorUpdate, onGestureDetected]);

  const toggleGestureMode = async () => {
    console.log("🔘 Toggle gesture mode clicked");
    console.log("Controller available:", !!controllerRef.current);
    console.log("Initialized:", isInitialized);
    console.log("Current active state:", isActive);
    
    if (!controllerRef.current || !isInitialized) {
      console.error("❌ Controller not initialized yet");
      return;
    }

    if (isActive) {
      try {
        controllerRef.current.stop();
        setIsActive(false);
        console.log("🖐️ Gesture mode deactivated");
      } catch (error) {
        console.error("❌ Failed to stop gesture detection:", error);
      }
    } else {
      try {
        console.log("🎬 Starting camera...");
        await controllerRef.current.start();
        setIsActive(true);
        console.log("🖐️ Gesture mode activated");
      } catch (error) {
        console.error("❌ Failed to start gesture detection:", error);
        // Try to provide more helpful error info
        if (error.name === 'NotAllowedError') {
          console.error("📹 Camera permission denied. Please allow camera access.");
        } else if (error.name === 'NotFoundError') {
          console.error("📹 No camera found. Please connect a camera.");
        } else {
          console.error("📹 Camera error:", error.message);
        }
      }
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm">
      {/* Always render video and canvas elements for refs */}
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="hidden"
        width={320}
        height={240}
      />

      {/* Gesture Controls */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">Gesture Control</h3>
        <button
          onClick={toggleGestureMode}
          disabled={!isInitialized}
          className={`w-full px-3 py-2 rounded text-xs font-medium transition-all ${
            !isInitialized
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : isActive
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {!isInitialized 
            ? "🔄 Initializing..." 
            : isSimulationMode
            ? "🖱️ Mouse Mode ON"
            : isActive 
            ? "🖐️ Gesture Mode ON" 
            : isSimulationMode
            ? "🖱️ Enable Mouse Mode"
            : "👋 Enable Gestures"
          }
        </button>
      </div>

      {/* Status Display */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold mb-1 text-gray-400">
          {isSimulationMode ? "🖱️ Mouse Mode" : "🖐️ Gesture Mode"}
        </h4>
        <div className="text-xs bg-gray-800 rounded p-2">
          {isSimulationMode ? (
            <div>• Move mouse to control cursor</div>
          ) : (
            <div>• Show hand to camera</div>
          )}
          <div>• {isActive ? "Tracking active" : "Click to start"}</div>
        </div>
      </div>

      {/* Cursor Position Display */}
      {(isActive || isSimulationMode) && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold mb-1 text-gray-400">3D Cursor Position</h4>
          <div className="text-xs font-mono bg-gray-800 rounded p-2">
            <div>X: {cursorPosition.x}</div>
            <div>Y: {cursorPosition.y}</div>
            <div>Z: {cursorPosition.z}</div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-400">
        <div className="mb-2">
          <div className="font-semibold text-gray-300 mb-1">Instructions:</div>
          {isSimulationMode ? (
            <>
              <div>1. Move mouse to control cursor</div>
              <div>2. Click to simulate pinch gesture</div>
              <div>3. Camera not required</div>
            </>
          ) : (
            <>
              <div>1. Click "Enable Gestures"</div>
              <div>2. Allow camera access</div>
              <div>3. Show hand to camera</div>
              <div>4. Move index finger to control cursor</div>
            </>
          )}
        </div>
        
        <div className="border-t border-gray-700 pt-2">
          <div className="font-semibold text-gray-300 mb-1">Detected Gestures:</div>
          <div>🤏 Pinch - Place cube</div>
          <div>✋ Open Palm - Confirm structure</div>
          <div>👋 Coming soon: More gestures</div>
        </div>
      </div>
    </div>
  );
}
