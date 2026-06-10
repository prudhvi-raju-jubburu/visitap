const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const pmPlaces = [
  { slug: 'kurupam-hills', lat: 18.8680, lng: 83.5450 },
  { slug: 'kurupam-palace-ruins', lat: 18.8702, lng: 83.4848 },
  { slug: 'manyam-forest-reserves', lat: 18.7600, lng: 83.3800 },
  { slug: 'nagavali-river-banks', lat: 18.8055, lng: 83.4208 },
  { slug: 'nagavali-bridge', lat: 18.8062, lng: 83.4231 },
  { slug: 'parvathipuram-town-center', lat: 18.7832, lng: 83.4257 },
  { slug: 'parvathipuram-tribal-market', lat: 18.7848, lng: 83.4274 },
  { slug: 'thotapalli-barrage-project', lat: 18.8129, lng: 83.4703 },
  { slug: 'thotapalli-reservoir', lat: 18.8185, lng: 83.4788 },
  { slug: 'thotapalli-parklands', lat: 18.8146, lng: 83.4721 }
];

pmPlaces.forEach(item => {
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
console.log('verified-coordinates.json updated successfully for Parvathipuram Manyam district!');
