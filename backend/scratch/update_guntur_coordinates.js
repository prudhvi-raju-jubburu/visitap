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

const gunturPlaces = [
  { name: 'Amaravati Archaeological Museum', lat: 16.5748, lng: 80.3574, slug: 'amaravati-archaeological-museum' },
  { name: 'Amaravati Stupa', lat: 16.5726, lng: 80.3570, slug: 'amaravati-stupa' },
  { name: 'Ethipothala Crocodile Breeding Pond', lat: 16.2104, lng: 79.9228, slug: 'ethipothala-crocodile-breeding-pond' },
  { name: 'Ethipothala Waterfalls', lat: 16.2112, lng: 79.9235, slug: 'ethipothala-waterfalls' },
  { name: 'Guntur City Center', lat: 16.3067, lng: 80.4365, slug: 'guntur-city-center' },
  { name: 'Kondaveedu Forest trekking', lat: 16.6918, lng: 80.2476, slug: 'kondaveedu-forest-trekking' },
  { name: 'Kondaveedu Fort', lat: 16.6947, lng: 80.2508, slug: 'kondaveedu-fort' },
  { name: 'Kotappakonda Hill Temple', lat: 16.1347, lng: 80.0131, slug: 'kotappakonda-hill-temple' },
  { name: 'Mangalagiri Temple', lat: 16.4304, lng: 80.5589, slug: 'mangalagiri-temple' },
  { name: 'Uppalapadu Bird Sanctuary', lat: 16.2789, lng: 80.3708, slug: 'uppalapadu-bird-sanctuary' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of gunturPlaces) {
      // Find the place (case-insensitive name check under districtName "Guntur")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Guntur'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Guntur.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      gunturPlaces.forEach(item => {
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

    console.log('\nAll Guntur coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
