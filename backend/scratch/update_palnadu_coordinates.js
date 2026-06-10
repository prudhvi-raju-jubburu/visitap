const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const palnaduPlaces = [
  { slug: 'nagarjuna-sagar-dam', lat: 16.5757, lng: 79.3124 },
  { slug: 'ethipothala-waterfalls-palnadu', lat: 16.5847, lng: 79.3183 },
  { slug: 'nagarjunakonda-island', lat: 16.5382, lng: 79.3178 },
  { slug: 'palnadu-battlefield-site', lat: 16.5495, lng: 79.7068 },
  { slug: 'ethipothala-valley-park', lat: 16.5856, lng: 79.3175 },
  { slug: 'nagarjuna-sagar-lake', lat: 16.5665, lng: 79.2950 },
  { slug: 'dachapalli-caves', lat: 16.6165, lng: 79.7385 },
  { slug: 'karempudi-town', lat: 16.5468, lng: 79.7027 },
  { slug: 'nagarjunasagar-boating-point', lat: 16.5728, lng: 79.3085 },
  { slug: 'guttikonda-bilam-caves', lat: 16.6408, lng: 79.7315 }
];

palnaduPlaces.forEach(item => {
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
console.log('verified-coordinates.json updated successfully for Palnadu district!');
