const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const tirupatiPlaces = [
  { slug: 'chandragiri-fort', lat: 13.6019, lng: 79.3175 },
  { slug: 'kalyani-dam', lat: 13.6308, lng: 79.2804 },
  { slug: 'kapila-theertham', lat: 13.6509, lng: 79.4198 },
  { slug: 'sri-venkateswara-national-park', lat: 13.6700, lng: 79.3500 },
  { slug: 'srikalahasti-temple', lat: 13.7498, lng: 79.6983 },
  { slug: 'srikalahasti-town', lat: 13.7505, lng: 79.7001 },
  { slug: 'talakona-waterfalls', lat: 13.8034, lng: 79.2151 },
  { slug: 'tirumala-hills-viewpoint', lat: 13.6895, lng: 79.3604 },
  { slug: 'tirumala-venkateswara-temple', lat: 13.6833, lng: 79.3500 },
  { slug: 'tirupati-city-center', lat: 13.6288, lng: 79.4192 }
];

tirupatiPlaces.forEach(item => {
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
console.log('verified-coordinates.json updated successfully for Tirupati district!');
