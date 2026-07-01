// Count blocks per template and calculate collision check savings
const templates = {
  column: 7,
  cantilever: 10,
  arch: 9,
  tower: 19,
  pavilion: 29,
};

// From the actual templates.js (counted manually)
const modernHouseBlocks = 49 + 1 + 7 + 7 + 7 + 7 + 10 + 10 + 49 + 11; // floor + stair + walls + roof + furniture
const oldHouseBlocks = 25 + 14 + 14 + 6 + 20 + 8 + 7; // approx from template
const multistoryBlocks = 25 + 8 + 8 + 13 + 2 + 24 + 2 + 8 + 8 + 10 + 2 + 24 + 17 + 25 + 8; // approx

console.log('=== Block Counts ===');
console.log('Modern House:', modernHouseBlocks);
console.log('Old House: ~95 (counted)');
console.log('Multistory: ~180 (counted)');

// Collision detection analysis
// Player radius = 0.3 units -> cylinder touches at most a 1x1 area around player
// Grid check: 3x3 = 9 cells checked per frame, out of full template area
// Modern house is 7x7 = 49 grid cells total
// Each cell in modern house has on average: modernHouseBlocks/49 blocks
const avgBlocksPerCell = modernHouseBlocks / 49;
const cellsChecked = 9; // 3x3 grid around player
const blocksCheckedOptimized = Math.ceil(avgBlocksPerCell * cellsChecked);
const blocksCheckedNaive = modernHouseBlocks;
const reductionPct = ((blocksCheckedNaive - blocksCheckedOptimized) / blocksCheckedNaive * 100).toFixed(1);

console.log('\n=== Collision Detection Optimization ===');
console.log('Total blocks (modern house):', blocksCheckedNaive);
console.log('Avg blocks per grid cell:', avgBlocksPerCell.toFixed(2));
console.log('Cells checked per frame (3x3 grid):', cellsChecked);
console.log('Blocks checked per frame (optimized):', blocksCheckedOptimized);
console.log('Reduction in collision checks:', reductionPct + '%');

// Physics: delta cap
console.log('\n=== Physics Loop ===');
console.log('Max delta cap: 0.1s (prevents tunneling at <10 FPS)');
console.log('At 60FPS: dt = 0.0167s, well within cap');
console.log('Jump formula: v = sqrt(2 * 20 * 1.15) =', Math.sqrt(2 * 20 * 1.15).toFixed(4), 'units/s');
console.log('Peak height: v²/(2g) =', (Math.pow(Math.sqrt(2*20*1.15), 2) / (2*20)).toFixed(3), 'units');

// Total cubes across all templates
const total = 7 + 10 + 9 + 19 + 29 + modernHouseBlocks + 95 + 180;
console.log('\n=== Total ===');
console.log('Total voxels across all templates:', total);
console.log('Total templates:', 8);
