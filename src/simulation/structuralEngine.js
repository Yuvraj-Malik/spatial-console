// ---- Structural Validation Engine ----

// Helper function to check if two positions are face-adjacent
function areFaceAdjacent(pos1, pos2) {
  const dx = Math.abs(pos1.x - pos2.x);
  const dy = Math.abs(pos1.y - pos2.y);
  const dz = Math.abs(pos1.z - pos2.z);
  
  // Face adjacent if exactly one coordinate differs by 1 and others are same
  return (dx === 1 && dy === 0 && dz === 0) ||
         (dx === 0 && dy === 1 && dz === 0) ||
         (dx === 0 && dy === 0 && dz === 1);
}

// Helper function to get all face-adjacent neighbors
function getAdjacentNeighbors(cube, allCubes) {
  return allCubes.filter(other => 
    other.id !== cube.id && areFaceAdjacent(cube, other)
  );
}

// Main structural validation function
export function validateStructure(confirmedCubes) {
  if (confirmedCubes.length === 0) {
    return { supported: [], unstable: [] };
  }

  // Build adjacency graph
  const adjacencyMap = new Map();
  confirmedCubes.forEach(cube => {
    adjacencyMap.set(cube.id, getAdjacentNeighbors(cube, confirmedCubes));
  });

  // Find ground-supported cubes (y === 0.5 means touching ground)
  const groundSupported = confirmedCubes.filter(cube => cube.y === 0.5);
  const supportedIds = new Set(groundSupported.map(cube => cube.id));

  // BFS/DFS to find all supported cubes
  const queue = [...groundSupported];
  const visited = new Set(supportedIds);

  while (queue.length > 0) {
    const current = queue.shift();
    
    // Check all neighbors
    const neighbors = adjacencyMap.get(current.id) || [];
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        queue.push(neighbor);
      }
    });
  }

  // Separate supported and unstable cubes
  const supported = confirmedCubes.filter(cube => visited.has(cube.id));
  const unstable = confirmedCubes.filter(cube => !visited.has(cube.id));

  return { supported, unstable };
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
