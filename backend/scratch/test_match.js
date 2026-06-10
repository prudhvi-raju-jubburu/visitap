const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const SUGGESTIONS_FILE = path.join(__dirname, '..', 'reports', 'image-suggestions.json');

const suggestions = JSON.parse(fs.readFileSync(SUGGESTIONS_FILE, 'utf-8'));
const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));

let totalPlaces = 0;
let matchedSuggestions = 0;
let suggestedImagesCount = 0;

files.forEach(file => {
  const filePath = path.join(DISTRICTS_DIR, file);
  const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  places.forEach(place => {
    totalPlaces++;
    const s = suggestions.find(item => item.place === place.name && item.district === place.districtName);
    if (s) {
      matchedSuggestions++;
      if (s.suggestedImages && s.suggestedImages.length > 0) {
        suggestedImagesCount++;
      } else {
        console.log(`Empty suggestion for: "${place.name}" (${place.districtName})`);
      }
    }
  });
});

console.log(`Total places: ${totalPlaces}`);
console.log(`Matched suggestions: ${matchedSuggestions}`);
console.log(`Suggestions with images: ${suggestedImagesCount}`);
