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

const kakinadaPlaces = [
  { name: 'Annavaram Hills', lat: 17.2811, lng: 82.5085, slug: 'annavaram-hills' },
  { name: 'Annavaram Satyanarayana Temple', lat: 17.2815, lng: 82.5090, slug: 'annavaram-satyanarayana-temple' },
  { name: 'Coringa Mangrove Boardwalk', lat: 16.9038, lng: 82.2619, slug: 'coringa-mangrove-boardwalk' },
  { name: 'Coringa Wildlife Sanctuary', lat: 16.9148, lng: 82.2865, slug: 'coringa-wildlife-sanctuary' },
  { name: 'Hope Island', lat: 16.9618, lng: 82.3356, slug: 'hope-island' },
  { name: 'Hope Island Lighthouse', lat: 16.9574, lng: 82.3408, slug: 'hope-island-lighthouse' },
  { name: 'Kakinada Beach', lat: 16.9897, lng: 82.2794, slug: 'kakinada-beach' },
  { name: 'Kakinada City Center', lat: 16.9891, lng: 82.2475, slug: 'kakinada-city-center' },
  { name: 'Pithapuram Temple', lat: 17.1147, lng: 82.2568, slug: 'pithapuram-temple' },
  { name: 'Uppada Beach', lat: 17.0603, lng: 82.3297, slug: 'uppada-beach' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of kakinadaPlaces) {
      // Find the place (case-insensitive name check under districtName "Kakinada")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Kakinada'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Kakinada.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      kakinadaPlaces.forEach(item => {
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

    console.log('\nAll Kakinada coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
