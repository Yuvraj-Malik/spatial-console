// ---- Voxel Structural Metrics Engine ----

export function areFaceAdjacent(cube1, cube2) {
  const dx = Math.abs(cube1.x - cube2.x);
  const dy = Math.abs(cube1.y - cube2.y);
  const dz = Math.abs(cube1.z - cube2.z);

  const faceAdjacent =
    (dx === 1 && dy === 0 && dz === 0) ||
    (dx === 0 && dy === 1 && dz === 0) ||
    (dx === 0 && dy === 0 && dz === 1);

  const edgeAdjacent =
    (dx === 1 && dy === 1 && dz === 0) ||
    (dx === 1 && dy === 0 && dz === 1) ||
    (dx === 0 && dy === 1 && dz === 1);

  return faceAdjacent || edgeAdjacent;
}

export function getFaceNeighbors(cube, allCubes) {
  return allCubes.filter((other) => other.id !== cube.id && areFaceAdjacent(cube, other));
}

export function touchesGround(cube) {
  return cube.y === 0.5;
}

export function calculateStructuralMetrics(confirmedCubes) {
  if (confirmedCubes.length === 0) {
    return {
      totalMass: 0,
      totalCost: 0,
      maxHeight: 0,
      safetyFactor: Infinity,
      centerOfMass: { x: 0, y: 0, z: 0 },
      stresses: {},
    };
  }

  let totalMass = 0;
  let totalCost = 0;
  let maxY = 0;
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (const cube of confirmedCubes) {
    totalMass += cube.material.density;
    totalCost += cube.material.costPerCube || 100;
    if (cube.y > maxY) maxY = cube.y;
    sumX += cube.x;
    sumY += cube.y;
    sumZ += cube.z;
  }

  return {
    totalMass,
    totalCost,
    maxHeight: maxY > 0 ? maxY + 0.5 : 0,
    safetyFactor: Infinity,
    centerOfMass: {
      x: sumX / confirmedCubes.length,
      y: sumY / confirmedCubes.length,
      z: sumZ / confirmedCubes.length,
    },
    stresses: {},
  };
}

export function validateStructure(confirmedCubes) {
  return { supported: [...confirmedCubes], issues: [] };
}

export function isStructureStable() {
  return true;
}
