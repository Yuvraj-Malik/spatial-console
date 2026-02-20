// gestureController.js

export class GestureController {
    constructor() {
        this.renderer = null;
        this.smoothedX = window.innerWidth / 2;
        this.smoothedY = window.innerHeight / 2;

        this.isPinching = false;
        this.lastClickTime = 0;
        this.cooldown = 400;
    }

    setThreeRefs(scene, camera, renderer) {
        this.renderer = renderer;
    }

    updateCursorFromLandmarks(landmarks) {
        if (!landmarks) return;

        const indexTip = landmarks[8];

        const rawX = indexTip.x * window.innerWidth;
        const rawY = indexTip.y * window.innerHeight;

        // Smooth movement
        this.smoothedX = this.smoothedX * 0.8 + rawX * 0.2;
        this.smoothedY = this.smoothedY * 0.8 + rawY * 0.2;

        const cursor = document.getElementById("virtual-cursor");
        if (cursor) {
            cursor.style.left = `${this.smoothedX}px`;
            cursor.style.top = `${this.smoothedY}px`;
        }

        this.simulatePointerMove();
    }

    simulatePointerMove() {
        if (!this.renderer) return;

        const canvas = this.renderer.domElement;

        const moveEvent = new PointerEvent("pointermove", {
            bubbles: true,
            clientX: this.smoothedX,
            clientY: this.smoothedY,
        });

        canvas.dispatchEvent(moveEvent);
    }

    simulatePointerClick(button = 0) {
        if (!this.renderer) return;

        const canvas = this.renderer.domElement;

        const down = new PointerEvent("pointerdown", {
            bubbles: true,
            clientX: this.smoothedX,
            clientY: this.smoothedY,
            button,
        });

        const up = new PointerEvent("pointerup", {
            bubbles: true,
            clientX: this.smoothedX,
            clientY: this.smoothedY,
            button,
        });

        canvas.dispatchEvent(down);
        canvas.dispatchEvent(up);
    }

    detectPinch(landmarks) {
        if (!landmarks) return;

        const thumb = landmarks[4];
        const index = landmarks[8];

        const dx = thumb.x - index.x;
        const dy = thumb.y - index.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        const now = Date.now();
        const pinchDetected = distance < 0.04;

        if (
            pinchDetected &&
            !this.isPinching &&
            now - this.lastClickTime > this.cooldown
        ) {
            this.simulatePointerClick(0);
            this.lastClickTime = now;
        }

        this.isPinching = pinchDetected;
    }

    detectGrip(landmarks) {
        if (!landmarks) return;

        const index = landmarks[8];
        const middle = landmarks[12];

        const dx = index.x - middle.x;
        const dy = index.y - middle.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.03) {
            this.simulatePointerClick(2);
        }
    }
}
