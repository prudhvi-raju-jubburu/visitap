const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI;

// Define Schema for DB
const PlaceSchema = new mongoose.Schema({
  name: String,
  districtName: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  }
});

const Place = mongoose.model('Place', PlaceSchema);

const asrPlaces = [
  { name: 'Araku Tribal Museum', lat: 18.3278, lng: 82.8786, slug: 'araku-tribal-museum' },
  { name: 'Araku Valley', lat: 18.3274, lng: 82.8806, slug: 'araku-valley' },
  { name: 'Araku Valley Trekking', lat: 18.3380, lng: 82.8720, slug: 'araku-valley-trekking' },
  { name: 'Borra Caves', lat: 18.2813, lng: 83.0385, slug: 'borra-caves' },
  { name: 'Lambasingi', lat: 17.8117, lng: 82.8122, slug: 'lambasingi' },
  { name: 'Lambasingi Tribal Area', lat: 17.8180, lng: 82.8185, slug: 'lambasingi-tribal-area' },
  { name: 'Maredumilli Forest', lat: 17.4344, lng: 81.7028, slug: 'maredumilli-forest' },
  { name: 'Papikonda National Park', lat: 17.5960, lng: 81.7740, slug: 'papikonda-national-park' },
  { name: 'Papikondalu Boat Ride', lat: 17.5530, lng: 81.7700, slug: 'papikondalu-boat-ride' },
  { name: 'Papikondalu Gorges', lat: 17.5650, lng: 81.7820, slug: 'papikondalu-gorges' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of asrPlaces) {
      // Find the place (case-insensitive name check under districtName "Alluri Sitharama Raju")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Alluri Sitharama Raju'
      });

      if (placeDoc) {
        console.log(`Updating DB for ${placeDoc.name}: [lng: ${item.lng}, lat: ${item.lat}]`);
        placeDoc.location = {
          type: 'Point',
          coordinates: [item.lng, item.lat] // [longitude, latitude]
        };
        await placeDoc.save();
        console.log(`Successfully updated DB for ${placeDoc.name}!`);
      } else {
        console.warn(`WARNING: DB Place "${item.name}" not found under district Alluri Sitharama Raju.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      asrPlaces.forEach(item => {
        if (data[item.slug]) {
          console.log(`Updating JSON for ${item.slug}: lat: ${item.lat}, lng: ${item.lng}`);
          data[item.slug].latitude = item.lat;
          data[item.slug].longitude = item.lng;
          data[item.slug].googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
        } else {
          console.warn(`WARNING: Slug "${item.slug}" not found in verified-coordinates.json.`);
        }
      });

      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      console.log('JSON file updated successfully!');
    } else {
      console.warn('verified-coordinates.json not found!');
    }

    console.log('\nAll Alluri Sitharama Raju coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
