// Complete Gesture Controller with MediaPipe Integration
// Robust hand tracking, cursor mapping, and gesture detection

import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

class GestureController {
  constructor() {
    this.hands = null;
    this.camera = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.isInitialized = false;
    this.isActive = false;
    this.mouseSimulation = false;

    // Cursor tracking
    this.cursorPosition = { x: 0, y: 0.5, z: 0 };
    this.previousPosition = { x: 0, y: 0.5, z: 0 };
    this.smoothingFactor = 0.3;

    // Gesture detection state
    this.currentGesture = null;
    this.gestureHistory = [];
    this.lastGestureTime = 0;
    this.gestureCooldown = 300; // ms

    // Callbacks
    this.onCursorUpdate = null;
    this.onGestureDetected = null;

    // Performance
    this.lastUpdateTime = 0;
    this.targetFrameRate = 30;
  }

  async initialize(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;

    try {
      // Test camera access first
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
      this.setupMouseSimulation();
      return;
    }

    // Initialize MediaPipe Hands
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

  setupMouseSimulation() {
    this.mouseSimulation = true;
    this.isInitialized = true;

    const handleMouseMove = (e) => {
      if (this.isActive) return; // Don't interfere with gesture mode

      // Store mouse coordinates for raycasting in CubeManager
      this.cursorPosition = {
        x: e.clientX,
        y: e.clientY,
        z: 0 // Will be computed by raycasting
      };

      if (this.onCursorUpdate) {
        this.onCursorUpdate(this.cursorPosition);
      }
    };

    const handleKeyPress = (e) => {
      if (this.isActive) return;

      console.log("⌨️ Key pressed:", e.key.toLowerCase());

      switch (e.key.toLowerCase()) {
        case 'p': // Pinch
          console.log("🤏 Pinch detected (simulated) - PLACE CUBE");
          this.currentGesture = 'pinch';
          if (this.onGestureDetected) {
            this.onGestureDetected('pinch');
          }
          setTimeout(() => {
            this.currentGesture = null;
          }, 100);
          break;

        case 'o': // Open palm
          console.log("✋ Open palm detected (simulated) - CONFIRM STRUCTURE");
          this.currentGesture = 'open_palm';
          if (this.onGestureDetected) {
            this.onGestureDetected('open_palm');
          }
          setTimeout(() => {
            this.currentGesture = null;
          }, 100);
          break;

        case 'f': // Fist
          console.log("✊ Fist detected (simulated) - DELETE CUBE");
          this.currentGesture = 'fist';
          if (this.onGestureDetected) {
            this.onGestureDetected('fist');
          }
          setTimeout(() => {
            this.currentGesture = null;
          }, 100);
          break;

        case ' ': // Space - click simulation
          console.log("🤏 Pinch detected (simulated) - PLACE CUBE");
          this.currentGesture = 'pinch';
          if (this.onGestureDetected) {
            this.onGestureDetected('pinch');
          }
          setTimeout(() => {
            this.currentGesture = null;
          }, 100);
          break;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keypress', handleKeyPress);

    console.log("🖱️ Mouse simulation mode activated");
    console.log("🎮 Keyboard shortcuts: P=Pinch, O=Open Palm, F=Fist, Space=Click");
  }

  start() {
    if (!this.isInitialized) {
      console.error("Gesture controller not initialized");
      return;
    }

    if (this.mouseSimulation) {
      console.log("🖱️ Mouse simulation mode active");
      this.isActive = true;
      return;
    }

    console.log("🎬 Starting camera...");

    this.camera.start().then(() => {
      console.log("📹 Camera started - gesture detection active");
      this.isActive = true;
    }).catch(error => {
      console.error("❌ Failed to start camera:", error);
    });
  }

  stop() {
    if (this.camera) {
      this.camera.stop();
      console.log("📹 Camera stopped - gesture detection inactive");
    }
    this.isActive = false;
  }

  onResults(results) {
    // Performance optimization: limit frame rate
    const currentTime = Date.now();
    const frameInterval = 1000 / this.targetFrameRate;

    if (currentTime - this.lastUpdateTime < frameInterval) {
      return;
    }
    this.lastUpdateTime = currentTime;

    // Clear canvas
    const canvasCtx = this.canvasElement.getContext('2d');
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Draw video frame
    canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Draw hand landmarks
      this.drawHandLandmarks(canvasCtx, landmarks);

      // Get index finger tip position (landmark #8)
      const indexTip = landmarks[8];

      // Convert MediaPipe coordinates to screen coordinates
      const screenCoords = this.handToScreenCoordinates(indexTip);

      // Update cursor position with screen coordinates
      this.updateCursorPosition(screenCoords);

      // Detect gestures
      this.detectGestures(landmarks);

      // Update cursor position callback
      if (this.onCursorUpdate) {
        this.onCursorUpdate(this.cursorPosition);
      }
    } else {
      // No hand detected
      canvasCtx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      canvasCtx.font = '16px Arial';
      canvasCtx.fillText('Show hand to camera', 10, 30);

      this.currentGesture = null;
    }

    canvasCtx.restore();
  }

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
        4,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
  }

  handToScreenCoordinates(landmark) {
    // Convert MediaPipe normalized coordinates to screen coordinates
    // MediaPipe: x,y ∈ [0,1] where (0,0) is top-left
    // Screen: pixels from top-left
    return {
      x: landmark.x * window.innerWidth,
      y: landmark.y * window.innerHeight
    };
  }

  updateCursorPosition(screenCoords) {
    // Store screen coordinates for raycasting in CubeManager
    this.cursorPosition = {
      x: screenCoords.x,
      y: screenCoords.y,
      z: 0 // Will be computed by raycasting
    };
  }

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

  detectGestures(landmarks) {
    const currentTime = Date.now();

    // Cooldown check
    if (currentTime - this.lastGestureTime < this.gestureCooldown) {
      return;
    }

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

    // Detect fist (all fingers closed)
    const isFist =
      this.calculateDistance(wrist, indexTip) < palmHeight * 0.3 &&
      this.calculateDistance(wrist, middleTip) < palmHeight * 0.3 &&
      this.calculateDistance(wrist, ringTip) < palmHeight * 0.3 &&
      this.calculateDistance(wrist, pinkyTip) < palmHeight * 0.3;

    // Trigger gestures
    if (isPinch && this.currentGesture !== 'pinch') {
      this.currentGesture = 'pinch';
      this.lastGestureTime = currentTime;
      console.log("🤏 Pinch detected");
      if (this.onGestureDetected) {
        this.onGestureDetected('pinch');
      }
    } else if (isOpenPalm && this.currentGesture !== 'open_palm') {
      this.currentGesture = 'open_palm';
      this.lastGestureTime = currentTime;
      console.log("✋ Open palm detected");
      if (this.onGestureDetected) {
        this.onGestureDetected('open_palm');
      }
    } else if (isFist && this.currentGesture !== 'fist') {
      this.currentGesture = 'fist';
      this.lastGestureTime = currentTime;
      console.log("✊ Fist detected");
      if (this.onGestureDetected) {
        this.onGestureDetected('fist');
      }
    } else if (!isPinch && !isOpenPalm && !isFist) {
      this.currentGesture = null;
    }
  }

  calculateDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setCursorCallback(callback) {
    this.onCursorUpdate = callback;
  }

  setGestureCallback(callback) {
    this.onGestureDetected = callback;
  }

  getCursorPosition() {
    return { ...this.cursorPosition };
  }

  setGestureModeActive(isActive) {
    this.isActive = isActive;
    console.log("🎮 Gesture mode:", isActive ? "HAND CONTROL" : "MOUSE CONTROL");
  }
}

export default GestureController;
