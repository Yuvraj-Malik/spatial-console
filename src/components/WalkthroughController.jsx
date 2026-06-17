import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";

export default function WalkthroughController({ state, dispatch }) {
  const { camera, scene, raycaster } = useThree();
  const plcRef = useRef();

  // Keyboard state
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  const speed = 4.0; // units per second
  const eyeHeight = 1.6;
  const playerHeight = 1.8;
  const playerRadius = 0.3;

  // Listen to keyboard keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = true;
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Initial Camera Position
    const originalPos = camera.position.clone();
    const originalRotation = camera.rotation.clone();

    // Calculate a safe starting position above the ground / blocks
    let startX = 0;
    let startZ = 4;
    let startY = eyeHeight;

    const cubes = [...state.confirmedCubes, ...state.draftCubes];
    if (cubes.length > 0) {
      // If there are blocks under the starting point, stand on them
      const cellCubes = cubes.filter(
        (c) => Math.round(c.x) === startX && Math.round(c.z) === startZ
      );
      if (cellCubes.length > 0) {
        const maxY = Math.max(...cellCubes.map((c) => c.y));
        startY = maxY + 0.5 + eyeHeight;
      }
    }

    camera.position.set(startX, startY, startZ);
    camera.rotation.set(0, Math.PI, 0); // look towards the center

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      camera.position.copy(originalPos);
      camera.rotation.copy(originalRotation);
    };
  }, [camera, state.confirmedCubes, state.draftCubes]);

  // Click handler to interact with doors/windows
  useEffect(() => {
    const handleClick = () => {
      if (!plcRef.current || !plcRef.current.isLocked) return;

      raycaster.setFromCamera({ x: 0, y: 0 }, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let hit = null;
      for (const intersection of intersects) {
        let obj = intersection.object;
        let cubeId = null;
        let shape = null;
        while (obj) {
          if (obj.userData && obj.userData.cubeId !== undefined) {
            cubeId = obj.userData.cubeId;
            shape = obj.userData.shape;
            break;
          }
          obj = obj.parent;
        }

        if (cubeId !== null && (shape === "door" || shape === "window")) {
          if (intersection.distance <= 3.5) {
            hit = { cubeId, shape };
            break;
          }
        }
      }

      if (hit) {
        dispatch({ type: "TOGGLE_INTERACTIVE_BLOCK", payload: { id: hit.cubeId } });
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [camera, scene, raycaster, dispatch]);

  // Helper functions for collision
  const getShapeTopY = (cube) => {
    const { y, shape = "cube" } = cube;
    if (shape === "slab") return y;
    if (shape === "quarter") return y - 0.25;
    return y + 0.5;
  };

  const isSolidBlock = (cube) => {
    if (cube.shape === "flower") return false;
    if (cube.shape === "door") {
      return !state.openInteractiveIds.includes(cube.id);
    }
    return true;
  };

  const checkCollisionAt = (x, y_camera, z) => {
    const feetY = y_camera - eyeHeight;
    const playerMinY = feetY;
    const playerMaxY = feetY + playerHeight;

    const px = Math.round(x);
    const pz = Math.round(z);

    const cubes = [...state.confirmedCubes, ...state.draftCubes];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const gx = px + dx;
        const gz = pz + dz;

        // Find distance from proposed cylinder to voxel boundary
        const closestX = Math.max(gx - 0.5, Math.min(x, gx + 0.5));
        const closestZ = Math.max(gz - 0.5, Math.min(z, gz + 0.5));
        const distSq = (x - closestX) ** 2 + (z - closestZ) ** 2;

        if (distSq < playerRadius ** 2) {
          // Find solid blocks in this cell
          const cellCubes = cubes.filter(
            (c) =>
              Math.round(c.x) === gx &&
              Math.round(c.z) === gz &&
              isSolidBlock(c)
          );

          for (const cube of cellCubes) {
            const blockMinY = cube.y - 0.5;
            const blockMaxY = getShapeTopY(cube);

            // Vertical overlap
            if (playerMinY < blockMaxY && playerMaxY > blockMinY) {
              // Stair stepping check: if the step is low, allow horizontal overlap
              const stepUpHeight = blockMaxY - playerMinY;
              if (stepUpHeight > 0 && stepUpHeight <= 0.6) {
                // Check if there is headroom directly above
                const hasBlockAbove = cubes.some(
                  (c) =>
                    Math.round(c.x) === gx &&
                    Math.round(c.z) === gz &&
                    isSolidBlock(c) &&
                    c.y - 0.5 < blockMaxY + playerHeight &&
                    getShapeTopY(c) > blockMaxY
                );
                if (!hasBlockAbove) {
                  // No head block, we can step up onto it! Skip collision here
                  continue;
                }
              }
              return true; // Solid collision!
            }
          }
        }
      }
    }

    return false;
  };

  const getFloorY = (x, z, currentFeetY) => {
    const px = Math.round(x);
    const pz = Math.round(z);
    let maxFloor = 0; // standard ground plane height

    const cubes = [...state.confirmedCubes, ...state.draftCubes];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const gx = px + dx;
        const gz = pz + dz;

        // Cylinder overlap with cell
        const closestX = Math.max(gx - 0.5, Math.min(x, gx + 0.5));
        const closestZ = Math.max(gz - 0.5, Math.min(z, gz + 0.5));
        const distSq = (x - closestX) ** 2 + (z - closestZ) ** 2;

        if (distSq < playerRadius ** 2) {
          const cellCubes = cubes.filter(
            (c) =>
              Math.round(c.x) === gx &&
              Math.round(c.z) === gz &&
              isSolidBlock(c)
          );

          for (const cube of cellCubes) {
            const topY = getShapeTopY(cube);
            // Stand on this block if our feet are above it or close to stepping on it
            if (topY <= currentFeetY + 0.6) {
              if (topY > maxFloor) {
                maxFloor = topY;
              }
            }
          }
        }
      }
    }

    return maxFloor;
  };

  // Main game loop
  useFrame((_, delta) => {
    if (!plcRef.current || !plcRef.current.isLocked) return;

    // Cap delta time to prevent clipping through walls on lags
    const dt = Math.min(delta, 0.1);

    // Movement vectors
    const frontVector = new THREE.Vector3();
    const sideVector = new THREE.Vector3();
    const direction = new THREE.Vector3();

    camera.getWorldDirection(frontVector);
    frontVector.y = 0;
    frontVector.normalize();

    sideVector.set(-frontVector.z, 0, frontVector.x);

    if (keys.current.forward) direction.add(frontVector);
    if (keys.current.backward) direction.sub(frontVector);
    if (keys.current.right) direction.add(sideVector);
    if (keys.current.left) direction.sub(sideVector);

    direction.normalize();
    const moveStep = direction.multiplyScalar(speed * dt);

    // Apply movement with axis-separated sliding collision
    if (moveStep.lengthSq() > 0) {
      // 1. Try X movement
      const nextX = camera.position.x + moveStep.x;
      if (!checkCollisionAt(nextX, camera.position.y, camera.position.z)) {
        camera.position.x = nextX;
      }

      // 2. Try Z movement
      const nextZ = camera.position.z + moveStep.z;
      if (!checkCollisionAt(camera.position.x, camera.position.y, nextZ)) {
        camera.position.z = nextZ;
      }
    }

    // 3. Gravity and Floor Snapping
    const feetY = camera.position.y - eyeHeight;
    const targetFloorY = getFloorY(camera.position.x, camera.position.z, feetY);
    const targetCameraY = targetFloorY + eyeHeight;

    // Smooth height adjustment for stair climbing and falling
    camera.position.y += (targetCameraY - camera.position.y) * 12 * dt;

    // Check if looking at an interactable door/window to update HUD state
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    let interactableFound = false;

    for (const intersection of intersects) {
      let obj = intersection.object;
      let cubeId = null;
      let shape = null;
      while (obj) {
        if (obj.userData && obj.userData.cubeId !== undefined) {
          cubeId = obj.userData.cubeId;
          shape = obj.userData.shape;
          break;
        }
        obj = obj.parent;
      }

      if (cubeId !== null && (shape === "door" || shape === "window") && intersection.distance <= 3.5) {
        interactableFound = true;
        break;
      }
    }

    const hudHighlightElement = document.getElementById("hud-crosshair");
    if (hudHighlightElement) {
      if (interactableFound) {
        hudHighlightElement.classList.add("bg-cyan-400", "scale-150", "shadow-[0_0_8px_rgba(34,211,238,0.8)]");
        hudHighlightElement.classList.remove("bg-white/60");
      } else {
        hudHighlightElement.classList.remove("bg-cyan-400", "scale-150", "shadow-[0_0_8px_rgba(34,211,238,0.8)]");
        hudHighlightElement.classList.add("bg-white/60");
      }
    }
  });

  return (
    <PointerLockControls
      ref={plcRef}
      onLock={() => {
        const lockScreen = document.getElementById("lock-screen-overlay");
        if (lockScreen) lockScreen.style.display = "none";
      }}
      onUnlock={() => {
        const lockScreen = document.getElementById("lock-screen-overlay");
        if (lockScreen && state.viewSettings.walkthroughActive) {
          lockScreen.style.display = "flex";
        }
      }}
    />
  );
}
