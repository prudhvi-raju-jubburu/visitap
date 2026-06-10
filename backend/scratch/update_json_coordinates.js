const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const vizagPlaces = [
  { slug: 'bheemili-beach', lat: 17.8905, lng: 83.4529 },
  { slug: 'kambalakonda-wildlife-sanctuary', lat: 17.7907, lng: 83.3378 },
  { slug: 'katiki-waterfalls', lat: 18.2674, lng: 82.9967 },
  { slug: 'rk-beach', lat: 17.7149, lng: 83.3237 },
  { slug: 'rushikonda-beach', lat: 17.7820, lng: 83.3855 },
  { slug: 'simhachalam-hill-sanctuary', lat: 17.7670, lng: 83.2510 },
  { slug: 'simhachalam-temple', lat: 17.7667, lng: 83.2506 },
  { slug: 'tadimada-waterfalls', lat: 18.2324, lng: 82.9123 },
  { slug: 'visakhapatnam-harbor', lat: 17.6868, lng: 83.2185 },
  { slug: 'yarada-beach', lat: 17.6555, lng: 83.2747 }
];

vizagPlaces.forEach(item => {
  if (data[item.slug]) {
    console.log(`Updating JSON for ${item.slug}: lat: ${item.lat}, lng: ${item.lng}`);
    data[item.slug].latitude = item.lat;
    data[item.slug].longitude = item.lng;
    data[item.slug].googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
  } else {
    console.warn(`WARNING: Slug "${item.slug}" not found in verified-coordinates.json.`);
  }
});

fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
console.log('JSON file updated successfully!');
