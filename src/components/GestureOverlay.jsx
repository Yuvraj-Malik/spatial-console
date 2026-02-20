import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { GestureController } from "../controllers/gestureController.js";

export default function GestureOverlay({ gestureControllerRef }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const controllerRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const initialize = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const controller = new GestureController();
      controllerRef.current = controller;
      gestureControllerRef.current = controller;

      const hands = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults((results) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !canvasRef.current) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(
          results.image,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
        );

        const landmarks = results.multiHandLandmarks?.[0];
        if (!landmarks) return;

        controller.updateCursorFromLandmarks(landmarks);
        controller.detectPinch(landmarks);
        controller.detectGrip(landmarks);

        setCursorPosition({
          x: Math.round(controller.smoothedX),
          y: Math.round(controller.smoothedY),
        });
      });

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });

      handsRef.current = hands;
      cameraRef.current = camera;
      setIsInitialized(true);
    };

    initialize();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      handsRef.current = null;
      cameraRef.current = null;
      controllerRef.current = null;
      gestureControllerRef.current = null;
    };
  }, [gestureControllerRef]);

  const toggleGestureMode = async () => {
    if (!isInitialized || !cameraRef.current) return;

    if (isActive) {
      cameraRef.current.stop();
      setIsActive(false);
      return;
    }

    try {
      await cameraRef.current.start();
      setIsActive(true);
    } catch (error) {
      console.error("Failed to start gesture detection:", error);
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm w-80">
      <div className="mb-4">
        <h4 className="text-xs font-semibold mb-1 text-gray-400">
          Camera Feed
        </h4>
        <div className="relative w-full h-32">
          <video
            ref={videoRef}
            className="w-full h-full bg-black rounded object-cover"
            style={{
              display: isActive ? "block" : "none",
              transform: "scaleX(-1)",
            }}
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="w-full h-full bg-black rounded object-cover absolute top-0 left-0"
            style={{
              display: isActive ? "block" : "none",
              transform: "scaleX(-1)",
            }}
            width={320}
            height={240}
          />
          {!isActive && (
            <div className="w-full h-full bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400">
              Camera feed will appear here
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-300">
          Gesture Control
        </h3>
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
            : isActive
              ? "🖐️ Gesture Mode ON"
              : "👋 Enable Gestures"}
        </button>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-semibold mb-1 text-gray-400">
          Cursor Position
        </h4>
        <div className="text-xs font-mono bg-gray-800 rounded p-2">
          <div>X: {cursorPosition.x}</div>
          <div>Y: {cursorPosition.y}</div>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        <div className="font-semibold text-gray-300 mb-1">Gesture Actions:</div>
        <div>👆 Finger move - Pointer move on canvas</div>
        <div>🤏 Pinch - Left click</div>
        <div>🤌 Grip - Right click</div>
      </div>
    </div>
  );
}
