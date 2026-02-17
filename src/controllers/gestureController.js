// ---- Gesture Controller: MediaPipe Integration ----
// Handles hand detection and 3D cursor tracking

import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

class GestureController {
  constructor() {
    this.hands = null;
    this.camera = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.isInitialized = false;

    // 3D cursor state
    this.cursorPosition = { x: 0, y: 0.5, z: 0 };
    this.onCursorUpdate = null;

    // Gesture detection state
    this.currentGesture = null;
    this.onGestureDetected = null;

    // Smoothing for cursor position
    this.smoothingFactor = 0.3;
    this.previousPosition = { x: 0, y: 0.5, z: 0 };
  }

  // Initialize MediaPipe Hands
  async initialize(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;

    // Test camera access first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      });
      videoElement.srcObject = stream;
      console.log("✅ Camera stream obtained");
    } catch (error) {
      console.error("❌ Camera access failed:", error);
      console.log("🔄 Falling back to mouse simulation mode");
      // Fall back to mouse simulation
      this.setupMouseSimulation();
      return;
    }

    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults(this.onResults.bind(this));

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    this.isInitialized = true;
    console.log("🖐️ Gesture controller initialized");
  }

  // Fallback mouse simulation for testing
  setupMouseSimulation() {
    this.mouseSimulation = true;
    this.isInitialized = true;

    // Simulate cursor movement with mouse
    const handleMouseMove = (e) => {
      const normalizedX = (e.clientX / window.innerWidth - 0.5) * 10;
      const normalizedZ = (e.clientY / window.innerHeight - 0.5) * 10;

      const worldPos = {
        x: Math.round(normalizedX),
        y: 0.5,
        z: Math.round(normalizedZ)
      };

      this.smoothCursorPosition(worldPos);

      if (this.onCursorUpdate) {
        this.onCursorUpdate(this.cursorPosition);
      }
    };

    const handleClick = () => {
      // Simulate pinch detection
      this.currentGesture = 'pinch';
      console.log("🤏 Pinch detected (simulated)");
      if (this.onGestureDetected) {
        this.onGestureDetected('pinch');
      }
      setTimeout(() => {
        this.currentGesture = null;
      }, 100);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);

    console.log("🖱️ Mouse simulation mode activated");
  }

  // Start camera and hand detection
  start() {
    if (!this.isInitialized) {
      console.error("Gesture controller not initialized");
      return;
    }

    if (this.mouseSimulation) {
      console.log("🖱️ Mouse simulation mode already active");
      return;
    }

    console.log("🎬 Starting camera...");

    // Start camera directly
    this.camera.start().then(() => {
      console.log("📹 Camera started - gesture detection active");
    }).catch(error => {
      console.error("❌ Failed to start camera:", error);
    });
  }

  // Stop camera and hand detection
  stop() {
    if (this.camera) {
      this.camera.stop();
      console.log("📹 Camera stopped - gesture detection inactive");
    }
  }

  // MediaPipe results callback
  onResults(results) {
    // Clear canvas
    const canvasCtx = this.canvasElement.getContext('2d');
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Draw video frame
    canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw hand landmarks (for debugging)
      this.drawHandLandmarks(canvasCtx, landmarks);

      // Get index finger tip position (landmark #8)
      const indexTip = landmarks[8];

      // Convert 2D hand coordinates to 3D world coordinates
      const worldPos = this.handToWorldCoordinates(indexTip);

      // Apply smoothing
      this.smoothCursorPosition(worldPos);

      // Detect gestures
      this.detectGestures(landmarks);

      // Update cursor position
      if (this.onCursorUpdate) {
        this.onCursorUpdate(this.cursorPosition);
      }
    }

    canvasCtx.restore();
  }

  // Draw hand landmarks for debugging
  drawHandLandmarks(ctx, landmarks) {
    // Draw connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle finger
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring finger
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17] // Palm
    ];

    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      ctx.beginPath();
      ctx.moveTo(startPoint.x * this.canvasElement.width, startPoint.y * this.canvasElement.height);
      ctx.lineTo(endPoint.x * this.canvasElement.width, endPoint.y * this.canvasElement.height);
      ctx.stroke();
    });

    // Draw landmarks
    landmarks.forEach((landmark, i) => {
      ctx.fillStyle = i === 8 ? '#FF0000' : '#00FF00'; // Red for index tip
      ctx.beginPath();
      ctx.arc(
        landmark.x * this.canvasElement.width,
        landmark.y * this.canvasElement.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
  }

  // Convert 2D hand coordinates to 3D world coordinates
  handToWorldCoordinates(landmark) {
    // Simple mapping: normalize hand coordinates to 3D space
    // This is a basic implementation - you may need to adjust based on your camera setup

    const normalizedX = (landmark.x - 0.5) * 10; // Map to -5 to 5 range
    const normalizedZ = (landmark.y - 0.5) * 10; // Map to -5 to 5 range

    return {
      x: Math.round(normalizedX),
      y: 0.5, // Always place at ground level for now
      z: Math.round(normalizedZ)
    };
  }

  // Apply smoothing to cursor position
  smoothCursorPosition(newPosition) {
    this.cursorPosition.x = this.previousPosition.x * (1 - this.smoothingFactor) + newPosition.x * this.smoothingFactor;
    this.cursorPosition.y = this.previousPosition.y * (1 - this.smoothingFactor) + newPosition.y * this.smoothingFactor;
    this.cursorPosition.z = this.previousPosition.z * (1 - this.smoothingFactor) + newPosition.z * this.smoothingFactor;

    // Round to grid
    this.cursorPosition.x = Math.round(this.cursorPosition.x);
    this.cursorPosition.y = 0.5;
    this.cursorPosition.z = Math.round(this.cursorPosition.z);

    // Store for next frame
    this.previousPosition = { ...this.cursorPosition };
  }

  // Detect basic gestures (Phase 2: detection only, no actions yet)
  detectGestures(landmarks) {
    // Get key landmarks
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const wrist = landmarks[0];

    // Calculate distances
    const thumbIndexDistance = this.calculateDistance(thumbTip, indexTip);
    const palmHeight = this.calculateDistance(wrist, middleTip);

    // Detect pinch (thumb and index close)
    const isPinch = thumbIndexDistance < 0.05;

    // Detect open palm (all fingers extended)
    const isOpenPalm =
      this.calculateDistance(wrist, indexTip) > palmHeight * 0.7 &&
      this.calculateDistance(wrist, middleTip) > palmHeight * 0.7 &&
      this.calculateDistance(wrist, ringTip) > palmHeight * 0.7 &&
      this.calculateDistance(wrist, pinkyTip) > palmHeight * 0.7;

    // Log detected gestures (Phase 2: logging only)
    if (isPinch && this.currentGesture !== 'pinch') {
      this.currentGesture = 'pinch';
      console.log("🤏 Pinch detected");
    } else if (isOpenPalm && this.currentGesture !== 'open_palm') {
      this.currentGesture = 'open_palm';
      console.log("✋ Open palm detected");
    } else if (!isPinch && !isOpenPalm) {
      this.currentGesture = null;
    }
  }

  // Calculate distance between two landmarks
  calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Set callback for cursor position updates
  setCursorCallback(callback) {
    this.onCursorUpdate = callback;
  }

  // Set callback for gesture detection (Phase 3)
  setGestureCallback(callback) {
    this.onGestureDetected = callback;
  }

  // Get current cursor position
  getCursorPosition() {
    return { ...this.cursorPosition };
  }
}

export default GestureController;
