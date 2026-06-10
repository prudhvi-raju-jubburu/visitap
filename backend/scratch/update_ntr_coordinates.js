const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const ntrPlaces = [
  { slug: 'bhavani-island', lat: 16.5178, lng: 80.5894 },
  { slug: 'indrakeeladri-hills', lat: 16.5154, lng: 80.6036 },
  { slug: 'kanaka-durga-temple', lat: 16.5162, lng: 80.6062 },
  { slug: 'kondapalli-fort', lat: 16.6186, lng: 80.5369 },
  { slug: 'kondapalli-toy-village', lat: 16.6125, lng: 80.5408 },
  { slug: 'prakasam-barrage', lat: 16.5061, lng: 80.6044 },
  { slug: 'prakasam-lakefront', lat: 16.5039, lng: 80.6005 },
  { slug: 'undavalli-caves', lat: 16.4922, lng: 80.5794 },
  { slug: 'vijayawada-city-center', lat: 16.5062, lng: 80.6480 },
  { slug: 'vijayawada-museum', lat: 16.5194, lng: 80.6296 }
];

ntrPlaces.forEach(item => {
  if (data[item.slug]) {
    console.log(`Updating JSON for ${item.slug}: lat: ${item.lat}, lng: ${item.lng}`);
    data[item.slug].latitude = item.lat;
    data[item.slug].longitude = item.lng;
    data[item.slug].googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
  } else {
    console.warn(`WARNING: Slug "${item.slug}" not found in verified-coordinates.json. Adding it.`);
    data[item.slug] = {
      latitude: item.lat,
      longitude: item.lng,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`
    };
  }
});

fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
console.log('verified-coordinates.json updated successfully for NTR district!');
