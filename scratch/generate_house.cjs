const fs = require('fs');

const cubes = [];

// Floor
for (let x = -3; x <= 3; x++) {
  for (let z = -3; z <= 3; z++) {
    cubes.push('{ x: ' + x + ', y: 0.5, z: ' + z + ', material: MATERIALS.MARBLE, shape: "slab" }');
  }
}

// Front Stairs
cubes.push('{ x: 0, y: 0.5, z: 4, material: MATERIALS.CONCRETE, shape: "stair", rotationY: 0 }');

// Z = 3 (Front Wall)
cubes.push('{ x: -3, y: 1.5, z: 3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: -2, y: 1.5, z: 3, material: MATERIALS.GLASS, shape: "window", rotationY: 0 }');
cubes.push('{ x: -1, y: 1.5, z: 3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 0, y: 1.5, z: 3, material: MATERIALS.WOOD, shape: "door", rotationY: 0 }');
cubes.push('{ x: 1, y: 1.5, z: 3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 2, y: 1.5, z: 3, material: MATERIALS.GLASS, shape: "window", rotationY: 0 }');
cubes.push('{ x: 3, y: 1.5, z: 3, material: MATERIALS.CONCRETE, shape: "cube" }');

cubes.push('{ x: -3, y: 2.5, z: 3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: -2, y: 2.5, z: 3, material: MATERIALS.GLASS, shape: "window", rotationY: 0 }');
cubes.push('{ x: -1, y: 2.5, z: 3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 0, y: 2.5, z: 3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 1, y: 2.5, z: 3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 2, y: 2.5, z: 3, material: MATERIALS.GLASS, shape: "window", rotationY: 0 }');
cubes.push('{ x: 3, y: 2.5, z: 3, material: MATERIALS.CONCRETE, shape: "cube" }');

// Z = -3 (Back Wall)
cubes.push('{ x: -3, y: 1.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: -2, y: 1.5, z: -3, material: MATERIALS.GLASS, shape: "window", rotationY: 0 }');
cubes.push('{ x: -1, y: 1.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 0, y: 1.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 1, y: 1.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 2, y: 1.5, z: -3, material: MATERIALS.GLASS, shape: "window", rotationY: 0 }');
cubes.push('{ x: 3, y: 1.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');

cubes.push('{ x: -3, y: 2.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: -2, y: 2.5, z: -3, material: MATERIALS.GLASS, shape: "window", rotationY: 0 }');
cubes.push('{ x: -1, y: 2.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 0, y: 2.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 1, y: 2.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');
cubes.push('{ x: 2, y: 2.5, z: -3, material: MATERIALS.GLASS, shape: "window", rotationY: 0 }');
cubes.push('{ x: 3, y: 2.5, z: -3, material: MATERIALS.CONCRETE, shape: "cube" }');

// X = -3 (Left Wall)
for (let z of [-2, -1, 0, 1, 2]) {
  cubes.push('{ x: -3, y: 1.5, z: ' + z + ', material: MATERIALS.CONCRETE, shape: "cube" }');
  cubes.push('{ x: -3, y: 2.5, z: ' + z + ', material: MATERIALS.CONCRETE, shape: "cube" }');
}

// X = 3 (Right Wall - Giant glass wall)
for (let z of [-2, -1, 0, 1, 2]) {
  cubes.push('{ x: 3, y: 1.5, z: ' + z + ', material: MATERIALS.GLASS, shape: "window", rotationY: 1 }');
  cubes.push('{ x: 3, y: 2.5, z: ' + z + ', material: MATERIALS.GLASS, shape: "window", rotationY: 1 }');
}

// Roof Slab
for (let x = -3; x <= 3; x++) {
  for (let z = -3; z <= 3; z++) {
    cubes.push('{ x: ' + x + ', y: 3.5, z: ' + z + ', material: MATERIALS.STEEL, shape: "slab" }');
  }
}

// Furniture
cubes.push('{ x: 1, y: 1.5, z: 0, material: MATERIALS.CARPET, shape: "sofa", rotationY: 1 }');
cubes.push('{ x: 0, y: 1.5, z: 0, material: MATERIALS.WOOD, shape: "table" }');
cubes.push('{ x: -1, y: 1.5, z: 0, material: MATERIALS.STEEL, shape: "tv", rotationY: 3 }');
cubes.push('{ x: -2, y: 1.5, z: 2, material: MATERIALS.CARPET, shape: "bed", rotationY: 2 }');
cubes.push('{ x: 2, y: 1.5, z: -2, material: MATERIALS.STEEL, shape: "kitchen_cabinet", rotationY: 0 }');
cubes.push('{ x: 1, y: 1.5, z: -2, material: MATERIALS.STEEL, shape: "fridge", rotationY: 0 }');
cubes.push('{ x: 0, y: 1.5, z: -2, material: MATERIALS.STEEL, shape: "sink", rotationY: 0 }');
cubes.push('{ x: -2, y: 1.5, z: -2, material: MATERIALS.MARBLE, shape: "bathtub", rotationY: 1 }');
cubes.push('{ x: -1, y: 1.5, z: -2, material: MATERIALS.MARBLE, shape: "toilet", rotationY: 0 }');
cubes.push('{ x: 0, y: 1.5, z: 2, material: MATERIALS.STEEL, shape: "lamp" }');
cubes.push('{ x: -2.9, y: 1.5, z: 0, material: MATERIALS.WOOD, shape: "painting", rotationY: 3 }');

const output = '  modern_house: {\\n' +
  '    name: "Modern Villa",\\n' +
  '    description: "A premium 2-story Modern Villa featuring a marble & tile open-floor plan, steel structural columns, large panoramic glass windows, and interactive doors.",\\n' +
  '    cubes: [\\n' +
  '      ' + cubes.join(',\\n      ') + '\\n' +
  '    ]\\n' +
  '  },';

fs.writeFileSync('modern_house_output.js', output);
console.log('Written to modern_house_output.js');
