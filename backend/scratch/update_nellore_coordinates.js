const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const nellorePlaces = [
  { slug: 'pulicat-lake-sanctuary', lat: 13.6833, lng: 80.0500 },
  { slug: 'nelapattu-bird-sanctuary', lat: 13.8406, lng: 79.9708 },
  { slug: 'mypadu-beach', lat: 14.5098, lng: 80.1802 },
  { slug: 'udayagiri-fort', lat: 14.8692, lng: 79.2908 },
  { slug: 'penchalakona-temple', lat: 14.3048, lng: 79.4587 },
  { slug: 'jonnavada-temple', lat: 14.5078, lng: 79.9936 },
  { slug: 'nellore-city-center', lat: 14.4426, lng: 79.9865 },
  { slug: 'venkatagiri-weaving-town', lat: 13.9615, lng: 79.5818 },
  { slug: 'nellapattu-wetlands', lat: 13.8452, lng: 79.9754 },
  { slug: 'pulicat-lagoon-boating', lat: 13.6712, lng: 80.1615 }
];

nellorePlaces.forEach(item => {
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
console.log('verified-coordinates.json updated successfully for SPSR Nellore district!');
