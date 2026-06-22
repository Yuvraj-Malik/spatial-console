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
    jump: false,
  });

  const velocityY = useRef(0);
  const isJumping = useRef(false);
  const gravity = 20.0;
  // jumpSpeed derived from physics: v = sqrt(2 * g * h), h = 1.15 units (clears 1 full block)
  const jumpSpeed = Math.sqrt(2 * 20.0 * 1.15); // ≈ 6.78

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
        case "Space":
          keys.current.jump = true;
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
        case "Space":
          keys.current.jump = false;
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
      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const c of cubes) {
        if (c.x < minX) minX = c.x;
        if (c.x > maxX) maxX = c.x;
        if (c.z < minZ) minZ = c.z;
        if (c.z > maxZ) maxZ = c.z;
      }
      startX = (minX + maxX) / 2;
      startZ = maxZ + 4; // spawn in front of the building

      // If there are blocks under the starting point, stand on them
      const cellCubes = cubes.filter(
        (c) => Math.round(c.x) === Math.round(startX) && Math.round(c.z) === Math.round(startZ)
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

  // Click handler to interact with doors/windows and edit blocks
  useEffect(() => {
    const handleClick = (e) => {
      if (!plcRef.current || !plcRef.current.isLocked) return;

      raycaster.setFromCamera({ x: 0, y: 0 }, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let hit = null;
      let faceNormal = null;
      let hitObject = null;
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

        if (cubeId !== null && intersection.distance <= 5.0) {
          hit = { cubeId, shape };
          faceNormal = intersection.face ? intersection.face.normal : null;
          hitObject = obj;
          break;
        }
      }

      if (hit) {
        // Door/Window Interaction
        if ((hit.shape === "door" || hit.shape === "window") && e.button === 0) {
          dispatch({ type: "TOGGLE_INTERACTIVE_BLOCK", payload: { id: hit.cubeId } });
          return;
        }

        // Left Click: Place block
        if (e.button === 0 && faceNormal && hitObject) {
          const pos = hitObject.position;
          const newPos = [pos.x + faceNormal.x, pos.y + faceNormal.y, pos.z + faceNormal.z];
          dispatch({
            type: "PLACE_DRAFT",
            payload: {
              x: newPos[0],
              y: newPos[1],
              z: newPos[2],
              material: state.currentMaterial,
              shape: state.currentShape || "cube",
              rotationY: state.rotationY || 0
            }
          });
          dispatch({ type: "CONFIRM_DRAFT" });
        }

        // Middle Click: Pick up block material/shape
        if (e.button === 1) {
          const cube = state.confirmedCubes.find(c => c.id === hit.cubeId) || state.draftCubes.find(c => c.id === hit.cubeId);
          if (cube) {
            dispatch({ type: "SET_MATERIAL", payload: cube.material });
            dispatch({ type: "SET_SHAPE", payload: cube.shape });
            if (cube.rotationY !== undefined) dispatch({ type: "SET_ROTATION", payload: cube.rotationY });
          }
        }

        // Right Click: Delete block
        if (e.button === 2) {
          dispatch({ type: "DELETE_CONFIRMED", payload: { id: hit.cubeId } });
        }
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [camera, scene, raycaster, dispatch, state.currentMaterial, state.currentShape, state.rotationY, state.confirmedCubes, state.draftCubes]);

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

    // Apply jump impulse FIRST (before gravity/floor checks)
    if (keys.current.jump && !isJumping.current && feetY <= targetFloorY + 0.15) {
      velocityY.current = jumpSpeed;
      isJumping.current = true;
      keys.current.jump = false;
    }

    let isGrounded = false;

    if (isJumping.current || velocityY.current > 0.01) {
      // Ascending or mid-air: apply gravity, NO floor snap
      velocityY.current -= gravity * dt;
      camera.position.y += velocityY.current * dt;

      // Ceiling collision: if we hit a block above, kill upward velocity
      if (checkCollisionAt(camera.position.x, camera.position.y, camera.position.z)) {
        velocityY.current = -0.1;
      }

      // Transition to falling once velocity goes negative
      if (velocityY.current <= 0) {
        isJumping.current = false;
      }
    } else {
      // Falling or grounded: apply gravity then snap to floor
      velocityY.current -= gravity * dt;
      camera.position.y += velocityY.current * dt;

      const newFeetY = camera.position.y - eyeHeight;
      if (newFeetY <= targetFloorY + 0.05) {
        // Snap to floor surface
        camera.position.y = targetFloorY + eyeHeight;
        velocityY.current = 0;
        isGrounded = true;
        isJumping.current = false;
      }
    }

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
