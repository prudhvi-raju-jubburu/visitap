const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const sssPlaces = [
  { slug: 'puttaparthi-ashram', lat: 14.1664, lng: 77.8106 },
  { slug: 'lepakshi-temple-complex', lat: 13.8021, lng: 77.6062 },
  { slug: 'puttaparthi-planetarium', lat: 14.1650, lng: 77.8100 },
  { slug: 'lepakshi-monolithic-nandi', lat: 13.8010, lng: 77.6080 },
  { slug: 'puttaparthi-chaitanya-jyoti', lat: 14.1677, lng: 77.8118 },
  { slug: 'lepakshi-hanging-pillar', lat: 13.8032, lng: 77.6069 },
  { slug: 'pennar-riverbed', lat: 14.1200, lng: 77.8100 },
  { slug: 'puttaparthi-hill-view', lat: 14.1725, lng: 77.8175 },
  { slug: 'dharmavaram-border-area', lat: 14.4145, lng: 77.7208 },
  { slug: 'puttaparthi-super-hospital', lat: 14.1657, lng: 77.8088 }
];

sssPlaces.forEach(item => {
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

// Since the old key was monolithic-nandi-lepakshi, let's delete it if it exists to clean up
if (data['monolithic-nandi-lepakshi']) {
  console.log('Cleaning up old key monolithic-nandi-lepakshi from verified-coordinates.json');
  delete data['monolithic-nandi-lepakshi'];
}

fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
console.log('verified-coordinates.json updated successfully for Sri Sathya Sai district!');
