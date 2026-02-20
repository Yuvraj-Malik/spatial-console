// gestureController.js

export class GestureController {
    constructor() {
        this.renderer = null;
        this.smoothedX = window.innerWidth / 2;
        this.smoothedY = window.innerHeight / 2;

        this.sensitivity = 0.6;
        this.smoothing = 0.9;
        this.deadzone = 1.5;

        this.isPinching = false;
        this.isFist = false;
        this.isRotatePose = false;
        this.isRotating = false;
        this.isThumbsUp = false;
        this.isThumbsDown = false;

        this.openPalmStartedAt = null;
        this.openPalmConfirmed = false;

        this.lastPlaceTime = 0;
        this.lastDeleteTime = 0;
        this.lastZoomTime = 0;

        this.zoomLockUntil = 0;

        this.placeCooldown = 450;
        this.deleteCooldown = 450;
        this.zoomCooldown = 220;
        this.confirmHoldMs = 850;

        this.onAction = null;
        this.onRoleChange = null;
        this.currentRole = "idle";
    }

    setThreeRefs(_scene, _camera, renderer) {
        this.renderer = renderer;
    }

    setActionCallback(callback) {
        this.onAction = callback;
    }

    setRoleCallback(callback) {
        this.onRoleChange = callback;
    }

    processLandmarks(landmarks) {
        if (!landmarks) {
            this.endRotateDrag();
            this.setRole("idle");
            this.openPalmStartedAt = null;
            this.openPalmConfirmed = false;
            return;
        }

        const pointPose = this.isPointPose(landmarks);
        const rotatePose = this.isRotatePoseGesture(landmarks);
        const openPalm = this.isOpenPalmGesture(landmarks);
        const fist = this.isFistGesture(landmarks);
        const pinch = this.isPinchGesture(landmarks);
        const now = Date.now();

        if (pinch) {
            this.zoomLockUntil = now + 500;
        }

        if (openPalm) {
            this.setRole("confirm_hold");
            this.updateCursorFromLandmarks(landmarks, false);
            this.detectConfirmGesture();
            return;
        }

        if (rotatePose) {
            this.setRole("rotate");
            this.startRotateDrag();
            this.updateCursorFromLandmarks(landmarks, true);
            return;
        }

        this.endRotateDrag();

        this.openPalmStartedAt = null;
        this.openPalmConfirmed = false;

        if (pointPose) {
            this.setRole("move");
            this.updateCursorFromLandmarks(landmarks, false);
            this.detectPinch(landmarks, pinch);
            this.detectGrip(fist);
            this.detectZoomGesture(landmarks, pinch);
            return;
        }

        this.setRole("idle");
        this.detectZoomGesture(landmarks, pinch);
    }

    setRole(role) {
        if (this.currentRole === role) return;
        this.currentRole = role;
        if (this.onRoleChange) {
            this.onRoleChange(role);
        }
    }

    updateCursorFromLandmarks(landmarks, rotating = false) {
        const indexTip = landmarks[8];

        const centeredX = (indexTip.x - 0.5) * window.innerWidth * this.sensitivity;
        const centeredY = (indexTip.y - 0.5) * window.innerHeight * this.sensitivity;
        const rawX = centeredX + window.innerWidth / 2;
        const rawY = centeredY + window.innerHeight / 2;

        const targetX = Math.max(0, Math.min(window.innerWidth, rawX));
        const targetY = Math.max(0, Math.min(window.innerHeight, rawY));

        const nextX = this.smoothedX * this.smoothing + targetX * (1 - this.smoothing);
        const nextY = this.smoothedY * this.smoothing + targetY * (1 - this.smoothing);

        if (
            Math.abs(nextX - this.smoothedX) < this.deadzone &&
            Math.abs(nextY - this.smoothedY) < this.deadzone
        ) {
            return;
        }

        this.smoothedX = nextX;
        this.smoothedY = nextY;

        const cursor = document.getElementById("virtual-cursor");
        if (cursor) {
            cursor.style.left = `${this.smoothedX}px`;
            cursor.style.top = `${this.smoothedY}px`;
        }

        this.simulatePointerMove(rotating ? 4 : 0);
    }

    simulatePointerMove(buttons = 0) {
        if (!this.renderer) return;

        const canvas = this.renderer.domElement;

        const moveEvent = new PointerEvent("pointermove", {
            bubbles: true,
            clientX: this.smoothedX,
            clientY: this.smoothedY,
            buttons,
        });

        canvas.dispatchEvent(moveEvent);
    }

    simulatePointerClick(button = 0) {
        if (!this.renderer) return;

        const canvas = this.renderer.domElement;
        const buttonMask = button === 2 ? 2 : 1;

        const down = new PointerEvent("pointerdown", {
            bubbles: true,
            clientX: this.smoothedX,
            clientY: this.smoothedY,
            button,
            buttons: buttonMask,
        });

        const up = new PointerEvent("pointerup", {
            bubbles: true,
            clientX: this.smoothedX,
            clientY: this.smoothedY,
            button,
            buttons: 0,
        });

        canvas.dispatchEvent(down);
        canvas.dispatchEvent(up);
    }

    startRotateDrag() {
        if (!this.renderer || this.isRotating) return;

        const canvas = this.renderer.domElement;
        window.__gestureRotateActive = true;
        const down = new PointerEvent("pointerdown", {
            bubbles: true,
            clientX: this.smoothedX,
            clientY: this.smoothedY,
            button: 2,
            buttons: 2,
        });

        canvas.dispatchEvent(down);
        this.isRotating = true;
        this.emitAction("rotate_start");
    }

    endRotateDrag() {
        if (!this.renderer || !this.isRotating) return;

        const canvas = this.renderer.domElement;
        const up = new PointerEvent("pointerup", {
            bubbles: true,
            clientX: this.smoothedX,
            clientY: this.smoothedY,
            button: 2,
            buttons: 0,
        });

        canvas.dispatchEvent(up);
        window.__gestureRotateActive = false;
        this.isRotating = false;
        this.emitAction("rotate_end");
    }

    detectPinch(_landmarks, pinchDetected) {
        const now = Date.now();

        if (pinchDetected && !this.isPinching && now - this.lastPlaceTime > this.placeCooldown) {
            this.simulatePointerClick(0);
            this.lastPlaceTime = now;
            this.emitAction("place");
        }

        this.isPinching = pinchDetected;
    }

    detectGrip(fistDetected) {
        const now = Date.now();

        if (fistDetected && !this.isFist && now - this.lastDeleteTime > this.deleteCooldown) {
            this.simulatePointerClick(2);
            this.lastDeleteTime = now;
            this.emitAction("delete");
        }

        this.isFist = fistDetected;
    }

    detectConfirmGesture() {
        const now = Date.now();

        if (!this.openPalmStartedAt) {
            this.openPalmStartedAt = now;
            this.openPalmConfirmed = false;
            return;
        }

        if (!this.openPalmConfirmed && now - this.openPalmStartedAt >= this.confirmHoldMs) {
            this.openPalmConfirmed = true;
            this.emitAction("confirm");
        }
    }

    detectZoomGesture(landmarks, pinchDetected = false) {
        const now = Date.now();
        if (now < this.zoomLockUntil) return;
        if (pinchDetected) {
            this.isThumbsUp = false;
            this.isThumbsDown = false;
            return;
        }

        if (this.isFingerExtended(landmarks, 8, 6) || this.isFingerExtended(landmarks, 12, 10)) {
            this.isThumbsUp = false;
            this.isThumbsDown = false;
            return;
        }

        if (now - this.lastZoomTime < this.zoomCooldown) return;

        const thumbsUp = this.isThumbsUpGesture(landmarks);
        const thumbsDown = this.isThumbsDownGesture(landmarks);

        if (thumbsUp) {
            this.setRole("zoom_in");
            this.simulateWheel(-120);
            this.lastZoomTime = now;
            this.emitAction("zoom_in");
        }

        if (thumbsDown) {
            this.setRole("zoom_out");
            this.simulateWheel(120);
            this.lastZoomTime = now;
            this.emitAction("zoom_out");
        }

        this.isThumbsUp = thumbsUp;
        this.isThumbsDown = thumbsDown;
    }

    simulateWheel(deltaY) {
        if (!this.renderer) return;

        const canvas = this.renderer.domElement;
        const wheelEvent = new WheelEvent("wheel", {
            bubbles: true,
            clientX: this.smoothedX,
            clientY: this.smoothedY,
            deltaY,
        });

        canvas.dispatchEvent(wheelEvent);
    }

    isPinchGesture(landmarks) {
        const thumb = landmarks[4];
        const index = landmarks[8];
        return this.distance(thumb, index) < 0.04;
    }

    isPointPose(landmarks) {
        return (
            this.isFingerExtended(landmarks, 8, 6) &&
            this.isFingerCurled(landmarks, 12, 10) &&
            this.isFingerCurled(landmarks, 16, 14) &&
            this.isFingerCurled(landmarks, 20, 18)
        );
    }

    isFistGesture(landmarks) {
        return (
            this.isFingerCurled(landmarks, 8, 6) &&
            this.isFingerCurled(landmarks, 12, 10) &&
            this.isFingerCurled(landmarks, 16, 14) &&
            this.isFingerCurled(landmarks, 20, 18)
        );
    }

    isOpenPalmGesture(landmarks) {
        return (
            this.isFingerExtended(landmarks, 8, 6) &&
            this.isFingerExtended(landmarks, 12, 10) &&
            this.isFingerExtended(landmarks, 16, 14) &&
            this.isFingerExtended(landmarks, 20, 18)
        );
    }

    isRotatePoseGesture(landmarks) {
        return (
            this.isFingerExtended(landmarks, 8, 6) &&
            this.isFingerExtended(landmarks, 12, 10) &&
            this.isFingerCurled(landmarks, 16, 14) &&
            this.isFingerCurled(landmarks, 20, 18)
        );
    }

    isThumbsUpGesture(landmarks) {
        const thumbTip = landmarks[4];
        const thumbIp = landmarks[3];
        const wrist = landmarks[0];
        const thumbIndexDistance = this.distance(landmarks[4], landmarks[8]);

        return (
            thumbIndexDistance > 0.08 &&
            thumbTip.y < thumbIp.y &&
            thumbTip.y < wrist.y - 0.02 &&
            this.isFingerNotExtended(landmarks, 8, 6) &&
            this.isFingerNotExtended(landmarks, 12, 10) &&
            this.isFingerNotExtended(landmarks, 16, 14) &&
            this.isFingerNotExtended(landmarks, 20, 18)
        );
    }

    isThumbsDownGesture(landmarks) {
        const thumbTip = landmarks[4];
        const thumbIp = landmarks[3];
        const wrist = landmarks[0];
        const thumbIndexDistance = this.distance(landmarks[4], landmarks[8]);

        return (
            thumbIndexDistance > 0.08 &&
            thumbTip.y > thumbIp.y &&
            thumbTip.y > wrist.y + 0.02 &&
            this.isFingerNotExtended(landmarks, 8, 6) &&
            this.isFingerNotExtended(landmarks, 12, 10) &&
            this.isFingerNotExtended(landmarks, 16, 14) &&
            this.isFingerNotExtended(landmarks, 20, 18)
        );
    }

    isFingerExtended(landmarks, tipIndex, pipIndex) {
        return landmarks[tipIndex].y < landmarks[pipIndex].y;
    }

    isFingerCurled(landmarks, tipIndex, pipIndex) {
        return landmarks[tipIndex].y > landmarks[pipIndex].y;
    }

    isFingerNotExtended(landmarks, tipIndex, pipIndex) {
        return landmarks[tipIndex].y > landmarks[pipIndex].y - 0.02;
    }

    distance(pointA, pointB) {
        const dx = pointA.x - pointB.x;
        const dy = pointA.y - pointB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    emitAction(action) {
        if (this.onAction) {
            this.onAction(action);
        }
    }
}
