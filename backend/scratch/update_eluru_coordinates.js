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

const eluruPlaces = [
  { name: 'Dwaraka Tirumala Hill', lat: 16.9328, lng: 81.2552, slug: 'dwaraka-tirumala-hill' },
  { name: 'Dwaraka Tirumala Temple', lat: 16.9319, lng: 81.2558, slug: 'dwaraka-tirumala-temple' },
  { name: 'Eluru Canal Park', lat: 16.7108, lng: 81.0956, slug: 'eluru-canal-park' },
  { name: 'Eluru City Center', lat: 16.7107, lng: 81.0952, slug: 'eluru-city-center' },
  { name: 'Guntupalli Caves', lat: 17.2208, lng: 81.0804, slug: 'guntupalli-caves' },
  { name: 'Guntupalli Stupa Complex', lat: 17.2219, lng: 81.0815, slug: 'guntupalli-stupa-complex' },
  { name: 'Kolleru Lake', lat: 16.6204, lng: 81.2378, slug: 'kolleru-lake' },
  { name: 'Kolleru Pelican Sanctuary', lat: 16.6365, lng: 81.2472, slug: 'kolleru-pelican-sanctuary' },
  { name: 'Kolleru boating channels', lat: 16.6248, lng: 81.2426, slug: 'kolleru-boating-channels' },
  { name: 'Maddinala Waterfall', lat: 17.3512, lng: 81.1654, slug: 'maddinala-waterfall' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of eluruPlaces) {
      // Find the place (case-insensitive name check under districtName "Eluru")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Eluru'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Eluru.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      eluruPlaces.forEach(item => {
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

    console.log('\nAll Eluru coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
