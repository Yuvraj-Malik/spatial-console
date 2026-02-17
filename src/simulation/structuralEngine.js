// ---- Simple Deterministic Voxel Stability Engine ----

// ---- Stage 1: Pure Connectivity Rules ----

// Rule 1: Face adjacency in 6 directions + edge adjacency for support
function areFaceAdjacent(cube1, cube2) {
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
function getFaceNeighbors(cube, allCubes) {
  return allCubes.filter(other =>
    other.id !== cube.id && areFaceAdjacent(cube, other)
  );
}

// Rule 3: Check if cube touches ground
function touchesGround(cube) {
  return cube.y === 0.5;
}

// Main validation function - Simple BFS from ground
export function validateStructure(confirmedCubes) {
  if (confirmedCubes.length === 0) {
    return { supported: [], unstable: [] };
  }

  console.log("🔍 Simple connectivity validation");
  console.log("Total cubes:", confirmedCubes.length);

  // Build adjacency map
  const adjacencyMap = new Map();
  confirmedCubes.forEach(cube => {
    const neighbors = getFaceNeighbors(cube, confirmedCubes);
    adjacencyMap.set(cube.id, neighbors);
    console.log(`Cube ${cube.id} (${cube.x}, ${cube.y}, ${cube.z}): ${neighbors.length} neighbors`);
  });

  // Find ground cubes (seeds)
  const groundCubes = confirmedCubes.filter(cube => touchesGround(cube));
  console.log("Ground cubes:", groundCubes.map(c => c.id));

  // BFS from ground cubes
  const supported = new Set();
  const queue = [...groundCubes];

  // Add all ground cubes to supported set
  groundCubes.forEach(cube => supported.add(cube.id));

  console.log("🚀 BFS propagation:");

  while (queue.length > 0) {
    const current = queue.shift();
    console.log(`Processing cube ${current.id}`);

    const neighbors = adjacencyMap.get(current.id) || [];
    neighbors.forEach(neighbor => {
      if (!supported.has(neighbor.id)) {
        supported.add(neighbor.id);
        queue.push(neighbor);
        console.log(`  ✓ Added neighbor ${neighbor.id}`);
      }
    });
  }

  // Separate supported and unstable
  const supportedCubes = confirmedCubes.filter(cube => supported.has(cube.id));
  const unstableCubes = confirmedCubes.filter(cube => !supported.has(cube.id));

  console.log("✅ Supported cubes:", supportedCubes.map(c => c.id));
  console.log("❌ Unstable cubes:", unstableCubes.map(c => c.id));

  return { supported: supportedCubes, unstable: unstableCubes };
}

// Function to check if structure is stable
export function isStructureStable(confirmedCubes) {
  const { unstable } = validateStructure(confirmedCubes);
  return unstable.length === 0;
}

// Function to get unstable cube IDs
export function getUnstableCubeIds(confirmedCubes) {
  const { unstable } = validateStructure(confirmedCubes);
  return unstable.map(cube => cube.id);
}
