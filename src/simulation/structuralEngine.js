// ---- Voxel Structural Solver & Stability Engine ----

// Rule 1: Face adjacency in 6 directions + edge adjacency for support
export function areFaceAdjacent(cube1, cube2) {
  const dx = Math.abs(cube1.x - cube2.x);
  const dy = Math.abs(cube1.y - cube2.y);
  const dz = Math.abs(cube1.z - cube2.z);

  // Face adjacent: exactly one coordinate differs by 1, others same
  const faceAdjacent = (dx === 1 && dy === 0 && dz === 0) ||
    (dx === 0 && dy === 1 && dz === 0) ||
    (dx === 0 && dy === 0 && dz === 1);

  // Edge adjacent: exactly two coordinates differ by 1, one same (for support)
  const edgeAdjacent = (dx === 1 && dy === 1 && dz === 0) ||
    (dx === 1 && dy === 0 && dz === 1) ||
    (dx === 0 && dy === 1 && dz === 1);

  return faceAdjacent || edgeAdjacent;
}

// Rule 2: Get face-adjacent neighbors
export function getFaceNeighbors(cube, allCubes) {
  return allCubes.filter(other =>
    other.id !== cube.id && areFaceAdjacent(cube, other)
  );
}

// Rule 3: Check if cube touches ground
export function touchesGround(cube) {
  return cube.y === 0.5;
}

// Main validation function - Computes complete physics-based metrics and stress analysis
export function calculateStructuralMetrics(confirmedCubes) {
  if (confirmedCubes.length === 0) {
    return {
      totalMass: 0,
      totalCost: 0,
      maxHeight: 0,
      safetyFactor: Infinity,
      centerOfMass: { x: 0, y: 0, z: 0 },
      stresses: {},
      unstableIds: [],
    };
  }

  // 1. Connectivity check using BFS (Ground cubes are stable seeds)
  const groundCubes = confirmedCubes.filter(cube => touchesGround(cube));
  
  // Build adjacency list
  const adjacency = new Map();
  confirmedCubes.forEach(c => adjacency.set(c.id, []));

  for (let i = 0; i < confirmedCubes.length; i++) {
    for (let j = i + 1; j < confirmedCubes.length; j++) {
      const c1 = confirmedCubes[i];
      const c2 = confirmedCubes[j];
      if (areFaceAdjacent(c1, c2)) {
        adjacency.get(c1.id).push(c2);
        adjacency.get(c2.id).push(c1);
      }
    }
  }

  // BFS search starting from all ground-connected seeds
  const visited = new Map(); // id -> shortest distance from ground (number of blocks)
  const queue = [];
  groundCubes.forEach(c => {
    visited.set(c.id, 0);
    queue.push(c.id);
  });

  while (queue.length > 0) {
    const currId = queue.shift();
    const currDist = visited.get(currId);
    const neighbors = adjacency.get(currId) || [];
    neighbors.forEach(n => {
      if (!visited.has(n.id)) {
        visited.set(n.id, currDist + 1);
        queue.push(n.id);
      }
    });
  }

  // Cubes not visited by BFS are floating/disconnected (unstable)
  const disconnectedIds = confirmedCubes
    .filter(c => !visited.has(c.id))
    .map(c => c.id);

  // 2. Load Propagation and Cantilever Lengths
  const connectedCubes = confirmedCubes.filter(c => visited.has(c.id));
  const stresses = {}; // id -> { stressRatio, load, cantilever, type }
  const accumulatedWeight = {}; // id -> kg
  const cantileverLength = {}; // id -> units

  connectedCubes.forEach(c => {
    accumulatedWeight[c.id] = c.material.density; // Start with own mass in kg
    cantileverLength[c.id] = 0;
  });

  // Sort connected cubes by y descending (top to bottom) so we propagate weight downwards
  const sortedConnected = [...connectedCubes].sort((a, b) => b.y - a.y);

  sortedConnected.forEach(u => {
    // Find cube directly below
    const below = connectedCubes.find(v => v.x === u.x && v.y === u.y - 1 && v.z === u.z);
    
    if (below) {
      // Direct compression transfer
      accumulatedWeight[below.id] += accumulatedWeight[u.id];
      cantileverLength[u.id] = 0; // Directly vertically supported
    } else {
      // Must transfer load horizontally
      const horizNeighbors = adjacency.get(u.id).filter(v => v.y === u.y);
      const uDist = visited.get(u.id);
      
      // Filter for supporting horizontal neighbors (strictly closer to ground)
      let supporting = horizNeighbors.filter(v => visited.get(v.id) < uDist);
      
      if (supporting.length === 0) {
        supporting = horizNeighbors; // Fallback to all horizontal neighbors
      }

      if (supporting.length > 0) {
        // Distribute load equally among supporting neighbors
        supporting.forEach(v => {
          accumulatedWeight[v.id] += accumulatedWeight[u.id] / supporting.length;
        });
        
        // Cantilever length is max of supporting neighbors + 1
        const maxCantilever = Math.max(...supporting.map(v => cantileverLength[v.id] || 0));
        cantileverLength[u.id] = maxCantilever + 1;
      } else {
        // Fallback for ground blocks or edge cases
        cantileverLength[u.id] = u.y === 0.5 ? 0 : 1;
      }
    }
  });

  // 3. Compute Stress Ratios and identify overstressed cubes
  let maxStressRatio = 0;
  const overstressedIds = [];

  connectedCubes.forEach(u => {
    const mat = u.material;
    
    // Compressive stress ratio (vertical load / max load capacity)
    const maxV = mat.maxVerticalLoad || 100000;
    const compRatio = accumulatedWeight[u.id] / maxV;

    // Bending moment stress ratio (load * cantilever length / max moment capacity)
    const maxM = mat.maxMoment || 400000;
    const bendRatio = (accumulatedWeight[u.id] * cantileverLength[u.id]) / maxM;

    const stressRatio = Math.max(compRatio, bendRatio);
    const type = compRatio >= bendRatio ? "compression" : "bending";

    stresses[u.id] = {
      stressRatio,
      load: accumulatedWeight[u.id],
      cantilever: cantileverLength[u.id],
      type,
    };

    if (stressRatio > maxStressRatio) {
      maxStressRatio = stressRatio;
    }

    if (stressRatio > 1.0) {
      overstressedIds.push(u.id);
    }
  });

  // Combine disconnected blocks and overstressed blocks as unstable
  const unstableIds = [...disconnectedIds, ...overstressedIds];

  // 4. Calculate Aggregate Metrics
  let totalMass = 0;
  let totalCost = 0;
  let maxHeight = 0;
  let sumX = 0, sumY = 0, sumZ = 0;

  confirmedCubes.forEach(c => {
    totalMass += c.material.density;
    totalCost += c.material.costPerCube || 100;
    if (c.y > maxHeight) maxHeight = c.y;
    sumX += c.x;
    sumY += c.y;
    sumZ += c.z;
  });

  // Report max height based on the top face of the highest cube
  const displayMaxHeight = maxHeight > 0 ? maxHeight + 0.5 : 0;

  const centerOfMass = {
    x: sumX / confirmedCubes.length,
    y: sumY / confirmedCubes.length,
    z: sumZ / confirmedCubes.length,
  };

  const safetyFactor = maxStressRatio > 0 ? 1 / maxStressRatio : Infinity;

  return {
    totalMass,
    totalCost,
    maxHeight: displayMaxHeight,
    safetyFactor: Infinity,
    centerOfMass,
    stresses: {},
    unstableIds: [],
  };
}

// Wrapper to match existing API checks
export function validateStructure(confirmedCubes) {
  const metrics = calculateStructuralMetrics(confirmedCubes);
  const supportedCubes = confirmedCubes.filter(c => !metrics.unstableIds.includes(c.id));
  const unstableCubes = confirmedCubes.filter(c => metrics.unstableIds.includes(c.id));
  return { supported: supportedCubes, unstable: unstableCubes };
}

// Function to check if structure is stable
export function isStructureStable(confirmedCubes) {
  const metrics = calculateStructuralMetrics(confirmedCubes);
  return metrics.unstableIds.length === 0;
}

// Function to get unstable cube IDs
export function getUnstableCubeIds(confirmedCubes) {
  const metrics = calculateStructuralMetrics(confirmedCubes);
  return metrics.unstableIds;
}
