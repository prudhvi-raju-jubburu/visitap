const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/verified-coordinates.json');
const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));

const srikakulamPlaces = [
  { slug: 'arasavalli-sun-temple', lat: 18.3039, lng: 83.9015 },
  { slug: 'srikurmam-temple', lat: 18.2706, lng: 83.9839 },
  { slug: 'kalingapatnam-beach', lat: 18.3414, lng: 84.1264 },
  { slug: 'baruva-beach', lat: 18.8824, lng: 84.5888 },
  { slug: 'srimukhalingam-temple', lat: 18.5954, lng: 83.9634 },
  { slug: 'kalingapatnam-town', lat: 18.3388, lng: 84.1227 },
  { slug: 'vamsadhara-river-mouth', lat: 18.3495, lng: 84.1368 },
  { slug: 'srikakulam-city-center', lat: 18.2949, lng: 83.8935 },
  { slug: 'srikurmam-town', lat: 18.2720, lng: 83.9815 },
  { slug: 'sangam-shiva-temple', lat: 18.6045, lng: 83.8297 }
];

srikakulamPlaces.forEach(item => {
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
console.log('verified-coordinates.json updated successfully for Srikakulam district!');
