import { TEMPLATES } from "../src/simulation/templates.js";

function getShapeTopY(cube) {
  const { y, shape = "cube" } = cube;
  if (shape === "slab") return y;
  if (shape === "quarter") return y - 0.25;
  return y + 0.5;
}

function isSolidBlock(cube) {
  return cube.shape !== "flower";
}

function checkCollisionNaive(cubes, x, yCamera, z, eyeHeight = 1.6, playerHeight = 1.8, playerRadius = 0.3) {
  const feetY = yCamera - eyeHeight;
  const playerMinY = feetY;
  const playerMaxY = feetY + playerHeight;

  let narrowChecks = 0;

  for (const cube of cubes) {
    if (!isSolidBlock(cube)) continue;
    narrowChecks += 1;

    const closestX = Math.max(cube.x - 0.5, Math.min(x, cube.x + 0.5));
    const closestZ = Math.max(cube.z - 0.5, Math.min(z, cube.z + 0.5));
    const distSq = (x - closestX) ** 2 + (z - closestZ) ** 2;
    if (distSq >= playerRadius ** 2) continue;

    const blockMinY = cube.y - 0.5;
    const blockMaxY = getShapeTopY(cube);
    if (playerMinY < blockMaxY && playerMaxY > blockMinY) {
      return { hit: true, broadChecks: narrowChecks, narrowChecks };
    }
  }

  return { hit: false, broadChecks: narrowChecks, narrowChecks };
}

function getFloorYNaive(cubes, x, z, currentFeetY, playerRadius = 0.3) {
  let maxFloor = 0;
  let narrowChecks = 0;

  for (const cube of cubes) {
    if (!isSolidBlock(cube)) continue;
    narrowChecks += 1;

    const closestX = Math.max(cube.x - 0.5, Math.min(x, cube.x + 0.5));
    const closestZ = Math.max(cube.z - 0.5, Math.min(z, cube.z + 0.5));
    const distSq = (x - closestX) ** 2 + (z - closestZ) ** 2;
    if (distSq >= playerRadius ** 2) continue;

    const topY = getShapeTopY(cube);
    if (topY <= currentFeetY + 0.6 && topY > maxFloor) {
      maxFloor = topY;
    }
  }

  return { floorY: maxFloor, broadChecks: narrowChecks, narrowChecks };
}

function checkCollisionCurrent(cubes, x, yCamera, z, eyeHeight = 1.6, playerHeight = 1.8, playerRadius = 0.3) {
  const feetY = yCamera - eyeHeight;
  const playerMinY = feetY;
  const playerMaxY = feetY + playerHeight;

  const px = Math.round(x);
  const pz = Math.round(z);

  let broadChecks = 0;
  let narrowChecks = 0;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const gx = px + dx;
      const gz = pz + dz;

      const closestX = Math.max(gx - 0.5, Math.min(x, gx + 0.5));
      const closestZ = Math.max(gz - 0.5, Math.min(z, gz + 0.5));
      const distSq = (x - closestX) ** 2 + (z - closestZ) ** 2;

      if (distSq < playerRadius ** 2) {
        const cellCubes = [];
        for (const c of cubes) {
          broadChecks += 1;
          if (Math.round(c.x) === gx && Math.round(c.z) === gz && isSolidBlock(c)) {
            cellCubes.push(c);
          }
        }

        for (const cube of cellCubes) {
          narrowChecks += 1;
          const blockMinY = cube.y - 0.5;
          const blockMaxY = getShapeTopY(cube);

          if (playerMinY < blockMaxY && playerMaxY > blockMinY) {
            return { hit: true, broadChecks, narrowChecks };
          }
        }
      }
    }
  }

  return { hit: false, broadChecks, narrowChecks };
}

function getFloorYCurrent(cubes, x, z, currentFeetY, playerRadius = 0.3) {
  const px = Math.round(x);
  const pz = Math.round(z);
  let maxFloor = 0;

  let broadChecks = 0;
  let narrowChecks = 0;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const gx = px + dx;
      const gz = pz + dz;

      const closestX = Math.max(gx - 0.5, Math.min(x, gx + 0.5));
      const closestZ = Math.max(gz - 0.5, Math.min(z, gz + 0.5));
      const distSq = (x - closestX) ** 2 + (z - closestZ) ** 2;

      if (distSq < playerRadius ** 2) {
        const cellCubes = [];
        for (const c of cubes) {
          broadChecks += 1;
          if (Math.round(c.x) === gx && Math.round(c.z) === gz && isSolidBlock(c)) {
            cellCubes.push(c);
          }
        }

        for (const cube of cellCubes) {
          narrowChecks += 1;
          const topY = getShapeTopY(cube);
          if (topY <= currentFeetY + 0.6 && topY > maxFloor) {
            maxFloor = topY;
          }
        }
      }
    }
  }

  return { floorY: maxFloor, broadChecks, narrowChecks };
}

function makeRoute(bounds, samples) {
  const route = [];
  const minX = bounds.minX - 1;
  const maxX = bounds.maxX + 1;
  const minZ = bounds.minZ - 1;
  const maxZ = bounds.maxZ + 1;

  for (let i = 0; i < samples; i += 1) {
    const t = i / samples;
    const angle = t * Math.PI * 4;
    const radiusX = (maxX - minX) * 0.35;
    const radiusZ = (maxZ - minZ) * 0.35;
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;

    route.push({
      x: cx + Math.cos(angle) * radiusX,
      z: cz + Math.sin(angle) * radiusZ,
      y: 2.1 + Math.sin(angle * 0.5) * 0.1,
    });
  }

  return route;
}

function boundsOf(cubes) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const c of cubes) {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.z < minZ) minZ = c.z;
    if (c.z > maxZ) maxZ = c.z;
  }

  return { minX, maxX, minZ, maxZ };
}

function runBenchmark(templateKey, samples = 5000) {
  const cubes = TEMPLATES[templateKey].cubes.map((cube, i) => ({
    ...cube,
    id: i + 1,
    status: "confirmed",
    shape: cube.shape || "cube",
  }));

  const route = makeRoute(boundsOf(cubes), samples);

  let naiveBroad = 0;
  let naiveNarrow = 0;
  let currentBroad = 0;
  let currentNarrow = 0;

  for (const p of route) {
    const a1 = checkCollisionNaive(cubes, p.x + 0.03, p.y, p.z);
    const a2 = checkCollisionNaive(cubes, p.x, p.y, p.z + 0.03);
    const a3 = checkCollisionNaive(cubes, p.x, p.y, p.z);
    const af = getFloorYNaive(cubes, p.x, p.z, p.y - 1.6);
    naiveBroad += a1.broadChecks + a2.broadChecks + a3.broadChecks + af.broadChecks;
    naiveNarrow += a1.narrowChecks + a2.narrowChecks + a3.narrowChecks + af.narrowChecks;

    const b1 = checkCollisionCurrent(cubes, p.x + 0.03, p.y, p.z);
    const b2 = checkCollisionCurrent(cubes, p.x, p.y, p.z + 0.03);
    const b3 = checkCollisionCurrent(cubes, p.x, p.y, p.z);
    const bf = getFloorYCurrent(cubes, p.x, p.z, p.y - 1.6);
    currentBroad += b1.broadChecks + b2.broadChecks + b3.broadChecks + bf.broadChecks;
    currentNarrow += b1.narrowChecks + b2.narrowChecks + b3.narrowChecks + bf.narrowChecks;
  }

  const narrowReduction = ((naiveNarrow - currentNarrow) / naiveNarrow) * 100;
  const totalReduction = ((naiveBroad - currentBroad) / naiveBroad) * 100;

  return {
    template: templateKey,
    cubeCount: cubes.length,
    samples,
    naiveNarrow,
    currentNarrow,
    narrowReduction,
    naiveBroad,
    currentBroad,
    totalReduction,
  };
}

const targets = ["modern_house", "old_house", "multistory"];
console.log("=== Collision Benchmark (A/B) ===");
console.log("Baseline A: naive full-cube scan");
console.log("Variant B: current 3x3-cell method in WalkthroughController");

for (const key of targets) {
  const result = runBenchmark(key, 5000);
  console.log("\nTemplate:", result.template, `(${result.cubeCount} cubes)`);
  console.log("Samples:", result.samples);
  console.log(
    "Narrow-phase checks (naive -> current):",
    result.naiveNarrow.toLocaleString(),
    "->",
    result.currentNarrow.toLocaleString(),
    `(${result.narrowReduction.toFixed(2)}%)`
  );
  console.log(
    "Total candidate scans incl. broad-phase filter (naive -> current):",
    result.naiveBroad.toLocaleString(),
    "->",
    result.currentBroad.toLocaleString(),
    `(${result.totalReduction.toFixed(2)}%)`
  );
}
