const fs = require('fs');
const path = require('path');

const SUGGESTIONS_FILE = path.join(__dirname, '..', 'reports', 'image-suggestions.json');

if (!fs.existsSync(SUGGESTIONS_FILE)) {
  console.log('Suggestions file does not exist.');
  process.exit(0);
}

const suggestions = JSON.parse(fs.readFileSync(SUGGESTIONS_FILE, 'utf-8'));
console.log(`Total entries in suggestions file: ${suggestions.length}`);

let emptyCount = 0;
let partialCount = 0;
let fullCount = 0;

const emptyPlaces = [];

suggestions.forEach(item => {
  const count = item.suggestedImages ? item.suggestedImages.length : 0;
  if (count === 0) {
    emptyCount++;
    emptyPlaces.push(`${item.place} (${item.district})`);
  } else if (count < 4) {
    partialCount++;
  } else {
    fullCount++;
  }
});

console.log(`Empty suggestions: ${emptyCount}`);
console.log(`Partial suggestions (< 4): ${partialCount}`);
console.log(`Full suggestions (>= 4): ${fullCount}`);

console.log('\nSample of empty suggestions:');
emptyPlaces.slice(0, 30).forEach(p => console.log(` - ${p}`));
