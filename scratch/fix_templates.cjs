const fs = require('fs');

const file = 'd:/My Programs/MediaPipe/Block_Builder/spatial-console/src/simulation/templates.js';
let content = fs.readFileSync(file, 'utf8');

const output = fs.readFileSync('d:/My Programs/MediaPipe/Block_Builder/spatial-console/scratch/modern_house_output.js', 'utf8');

// The broken line starts with `    modern_house: {\\n    name: "Modern Villa"` and ends with `  old_house: {`
// Let's just replace the whole broken modern_house line.
const lines = content.split('\n');
const newLines = [];
for (let line of lines) {
  if (line.includes('modern_house: {\\n')) {
    newLines.push(output);
    newLines.push('  old_house: {');
  } else {
    // If the line is '  old_house: {' and we already pushed it, skip it. But wait, old_house is on line 125 as well? No, old_house: { was on line 125 at the end!
    if (line.trim() === 'old_house: {') continue; // just in case
    newLines.push(line);
  }
}

fs.writeFileSync(file, newLines.join('\n'));
console.log('Fixed templates.js');
