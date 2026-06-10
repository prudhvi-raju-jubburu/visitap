const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const prakasamPlaces = [
  { slug: 'markapur-chennakesava-temple', lat: 15.7358, lng: 79.2687 },
  { slug: 'ongole-city-center', lat: 15.5057, lng: 80.0499 },
  { slug: 'singarayakonda-temple', lat: 15.2589, lng: 80.0381 },
  { slug: 'cumbum-lake', lat: 15.5786, lng: 79.1122 },
  { slug: 'kothapatnam-beach', lat: 15.4836, lng: 80.1784 },
  { slug: 'chirala-beach', lat: 15.8128, lng: 80.3639 },
  { slug: 'markapur-slate-industry', lat: 15.7352, lng: 79.2709 },
  { slug: 'singarayakonda-hilltop-view', lat: 15.2517, lng: 80.0279 },
  { slug: 'ongole-bull-farm', lat: 15.5157, lng: 80.0499 },
  { slug: 'cumbum-dam', lat: 15.5814, lng: 79.1138 }
];

prakasamPlaces.forEach(item => {
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
console.log('verified-coordinates.json updated successfully for Prakasam district!');
