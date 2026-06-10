const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const nandyalPlaces = [
  { slug: 'ahobilam-hills', lat: 15.1338, lng: 78.7212 },
  { slug: 'ahobilam-temple', lat: 15.1333, lng: 78.7167 },
  { slug: 'mahanandi-temple', lat: 15.4868, lng: 78.6124 },
  { slug: 'mahanandi-village', lat: 15.4847, lng: 78.6102 },
  { slug: 'nallamala-forest-trekking', lat: 15.7205, lng: 78.7304 },
  { slug: 'nandyal-town-center', lat: 15.4847, lng: 78.4812 },
  { slug: 'srisailam-hill-forest', lat: 16.0762, lng: 78.8689 },
  { slug: 'srisailam-mallikarjuna-temple', lat: 16.0744, lng: 78.8683 },
  { slug: 'srisailam-tiger-reserve', lat: 16.0505, lng: 78.8012 },
  { slug: 'yaganti-temple-complex', lat: 15.3486, lng: 78.1394 }
];

nandyalPlaces.forEach(item => {
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
console.log('verified-coordinates.json updated successfully for Nandyal district!');
