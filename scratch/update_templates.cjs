const fs = require('fs');

const file = 'd:/My Programs/MediaPipe/Block_Builder/spatial-console/src/simulation/templates.js';
let content = fs.readFileSync(file, 'utf8');

const output = fs.readFileSync('modern_house_output.js', 'utf8');

const regex = /modern_house:\s*\{[\s\S]*?old_house:\s*\{/m;
const match = content.match(regex);
if (match) {
  content = content.replace(regex, output + '\\n  old_house: {');
  fs.writeFileSync(file, content);
  console.log('Replaced successfully.');
} else {
  console.log('Could not find modern_house block.');
}
