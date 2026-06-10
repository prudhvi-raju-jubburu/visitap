const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const kurnoolPlaces = [
  { slug: 'belum-cave-passages', lat: 15.1032, lng: 78.1171 },
  { slug: 'belum-caves', lat: 15.1017, lng: 78.1147 },
  { slug: 'konda-reddy-buruzu', lat: 15.8281, lng: 78.0373 },
  { slug: 'kurnool-city-center', lat: 15.8289, lng: 78.0378 },
  { slug: 'kurnool-fort-ruins', lat: 15.8352, lng: 78.0414 },
  { slug: 'mahanandi-temple-area', lat: 15.4875, lng: 78.6112 },
  { slug: 'orvakal-rock-garden', lat: 15.6811, lng: 78.0169 },
  { slug: 'rollapadu-bird-sanctuary', lat: 15.7258, lng: 78.3683 },
  { slug: 'tungabhadra-riverfront', lat: 15.8451, lng: 78.0556 },
  { slug: 'yaganti-temple', lat: 15.3486, lng: 78.1394 }
];

kurnoolPlaces.forEach(item => {
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
console.log('verified-coordinates.json updated successfully for Kurnool district!');
