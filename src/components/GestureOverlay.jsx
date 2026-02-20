import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { GestureController } from "../controllers/gestureController.js";

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

function drawHandLandmarks(ctx, landmarks, width, height) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#22d3ee";
  ctx.fillStyle = "#34d399";

  HAND_CONNECTIONS.forEach(([start, end]) => {
    const s = landmarks[start];
    const e = landmarks[end];

    ctx.beginPath();
    ctx.moveTo(s.x * width, s.y * height);
    ctx.lineTo(e.x * width, e.y * height);
    ctx.stroke();
  });

  landmarks.forEach((point, index) => {
    const x = point.x * width;
    const y = point.y * height;
    const radius = index === 8 ? 5 : 3;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

export default function GestureOverlay({
  gestureControllerRef,
  onGestureAction,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const controllerRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const gestureActionRef = useRef(onGestureAction);

  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [activeRole, setActiveRole] = useState("idle");

  useEffect(() => {
    gestureActionRef.current = onGestureAction;
  }, [onGestureAction]);

  useEffect(() => {
    const initialize = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const controller = new GestureController();
      controllerRef.current = controller;
      gestureControllerRef.current = controller;
      controller.setActionCallback((action) => {
        if (gestureActionRef.current) {
          gestureActionRef.current(action);
        }
      });
      controller.setRoleCallback((role) => {
        setActiveRole(role);
      });

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
        controller.processLandmarks(landmarks);

        if (landmarks) {
          drawHandLandmarks(
            ctx,
            landmarks,
            canvasRef.current.width,
            canvasRef.current.height,
          );
        }

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
      if (controllerRef.current) {
        controllerRef.current.endRotateDrag();
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
    <div className="absolute top-4 right-4 z-20 pointer-events-auto bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm w-80">
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
          <div className="mt-1 text-cyan-300">
            ROLE: {activeRole.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        <div className="font-semibold text-gray-300 mb-1">Gesture Actions:</div>
        <div>👆 Point pose - Move cursor / ghost cube</div>
        <div>🤏 Pinch pulse - Place cube</div>
        <div>✊ Fist pulse - Delete cube</div>
        <div>🖐️ Open palm hold - Confirm drafts</div>
        <div>✌️ V-sign hold - Rotate view</div>
        <div>👍 / 👎 - Zoom in / out</div>
      </div>
    </div>
  );
}
