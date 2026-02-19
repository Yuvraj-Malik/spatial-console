// Optimized Gesture Controller with Virtual Cursor System
// Maps hand gestures to simulated mouse events with performance optimizations

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
    
    // Virtual cursor tracking
    this.cursorX = window.innerWidth / 2;
    this.cursorY = window.innerHeight / 2;
    this.smoothedX = this.cursorX;
    this.smoothedY = this.cursorY;
    
    // Gesture detection state
    this.currentGesture = null;
    this.gestureHistory = [];
    this.lastGestureTime = 0;
    this.gestureCooldown = 400; // ms for click cooldown
    
    // Click state
    this.isPinching = false;
    this.lastClickTime = 0;
    
    // Callbacks
    this.onCursorUpdate = null;
    this.onGestureDetected = null;
    
    // Performance
    this.lastUpdateTime = 0;
    this.targetFrameRate = 15; // Reduced for performance
    
    // Expose cursor position for external access
    this.getCursorPosition = () => ({ x: this.smoothedX, y: this.smoothedY });
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

    // Initialize MediaPipe Hands with optimized settings
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0, // Use simplest model for performance
      minDetectionConfidence: 0.6, // Higher confidence for stability
      minTrackingConfidence: 0.6
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
      
      const cursor = document.getElementById("virtual-cursor");
      if (cursor) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      }
      
      if (this.onCursorUpdate) {
        this.onCursorUpdate({ x: e.clientX, y: e.clientY, z: 0 });
      }
    };

    const handleKeyPress = (e) => {
      if (this.isActive) return;
      
      console.log("⌨️ Key pressed:", e.key.toLowerCase());
      
      switch(e.key.toLowerCase()) {
        case 'p': // Pinch
          console.log("🤏 Pinch detected (simulated) - PLACE CUBE");
          this.simulateMouseEvent("mousedown", 0);
          this.simulateMouseEvent("mouseup", 0);
          break;
          
        case 'o': // Open palm
          console.log("✋ Open palm detected (simulated) - CONFIRM STRUCTURE");
          if (this.onGestureDetected) {
            this.onGestureDetected('open_palm');
          }
          break;
          
        case 'f': // Fist
          console.log("✊ Fist detected (simulated) - DELETE CUBE");
          this.simulateMouseEvent("contextmenu", 2);
          break;
          
        case ' ': // Space - click simulation
          console.log("🤏 Pinch detected (simulated) - PLACE CUBE");
          this.simulateMouseEvent("mousedown", 0);
          this.simulateMouseEvent("mouseup", 0);
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

    // Quick early exit if no hands
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      // Clear canvas and show message only when needed
      const canvasCtx = this.canvasElement.getContext('2d');
      if (canvasCtx) {
        canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        canvasCtx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        canvasCtx.font = '16px Arial';
        canvasCtx.fillText('Show hand to camera', 10, 30);
      }
      this.currentGesture = null;
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    
    // Clear canvas and draw video
    const canvasCtx = this.canvasElement.getContext('2d');
    if (!canvasCtx) return;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    // Draw video frame (for visibility)
    canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

    // Update virtual cursor position (optimized)
    this.updateVirtualCursor(landmarks);
    
    // Detect gestures (throttled)
    this.detectGestures(landmarks);

    canvasCtx.restore();
  }

  updateVirtualCursor(landmarks) {
    const indexTip = landmarks[8];
    
    const rawX = indexTip.x * window.innerWidth;
    const rawY = indexTip.y * window.innerHeight;
    
    // Smooth movement (lighter smoothing for better responsiveness)
    this.smoothedX = this.smoothedX * 0.7 + rawX * 0.3;
    this.smoothedY = this.smoothedY * 0.7 + rawY * 0.3;
    
    // Update cursor position for external access
    this.cursorPosition = {
      x: this.smoothedX,
      y: this.smoothedY,
      z: 0
    };
    
    // Update virtual cursor DOM element
    const cursor = document.getElementById("virtual-cursor");
    if (cursor) {
      cursor.style.left = `${this.smoothedX}px`;
      cursor.style.top = `${this.smoothedY}px`;
    }
    
    if (this.onCursorUpdate) {
      this.onCursorUpdate(this.cursorPosition);
    }
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
    
    // Handle pinch (left click)
    if (isPinch && !this.isPinching && currentTime - this.lastClickTime > 400) {
      this.isPinching = true;
      this.lastClickTime = currentTime;
      this.lastGestureTime = currentTime;
      
      console.log("🤏 Pinch detected - LEFT CLICK");
      this.simulateMouseEvent("mousedown", 0);
      this.simulateMouseEvent("mouseup", 0);
      
      if (this.onGestureDetected) {
        this.onGestureDetected('pinch');
      }
    } else if (!isPinch) {
      this.isPinching = false;
    }
    
    // Handle grip (right click)
    if (isFist && this.currentGesture !== 'fist') {
      this.currentGesture = 'fist';
      this.lastGestureTime = currentTime;
      
      console.log("✊ Fist detected - RIGHT CLICK");
      this.simulateMouseEvent("contextmenu", 2);
      
      if (this.onGestureDetected) {
        this.onGestureDetected('fist');
      }
    } else if (isOpenPalm && this.currentGesture !== 'open_palm') {
      this.currentGesture = 'open_palm';
      this.lastGestureTime = currentTime;
      
      console.log("✋ Open palm detected");
      
      if (this.onGestureDetected) {
        this.onGestureDetected('open_palm');
      }
    } else if (!isPinch && !isOpenPalm && !isFist) {
      this.currentGesture = null;
    }
  }

  simulateMouseEvent(type, button) {
    const cursorPos = this.getCursorPosition();
    
    const event = new MouseEvent(type, {
      bubbles: true,
      clientX: cursorPos.x,
      clientY: cursorPos.y,
      button
    });

    const target = document.elementFromPoint(cursorPos.x, cursorPos.y);
    if (target) {
      target.dispatchEvent(event);
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

  setGestureModeActive(isActive) {
    this.isActive = isActive;
    console.log("🎮 Gesture mode:", isActive ? "HAND CONTROL" : "MOUSE CONTROL");
  }
}

export default GestureController;
