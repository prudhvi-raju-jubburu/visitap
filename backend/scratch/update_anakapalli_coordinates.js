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

const anakapalliPlaces = [
  { name: 'Anakapalli Jaggery Market', lat: 17.6913, lng: 83.0037, slug: 'anakapalli-jaggery-market' },
  { name: 'Anakapalli Town Center', lat: 17.6910, lng: 83.0025, slug: 'anakapalli-town-center' },
  { name: 'Bojjannakonda Caves', lat: 17.6936, lng: 83.0167, slug: 'bojjannakonda-caves' },
  { name: 'Bojjannakonda Museum', lat: 17.6940, lng: 83.0172, slug: 'bojjannakonda-museum' },
  { name: 'Bojjannakonda Stupas', lat: 17.6938, lng: 83.0169, slug: 'bojjannakonda-stupas' },
  { name: 'Kondakarla Ava Lake', lat: 17.6154, lng: 82.9777, slug: 'kondakarla-ava-lake' },
  { name: 'Kondakarla Boating Point', lat: 17.6170, lng: 82.9800, slug: 'kondakarla-boating-point' },
  { name: 'Kondakarla birding', lat: 17.6190, lng: 82.9750, slug: 'kondakarla-birding' },
  { name: 'Sarada Riverfront', lat: 17.7000, lng: 82.9500, slug: 'sarada-riverfront' },
  { name: 'Upaka Forest Reserve', lat: 17.6500, lng: 82.9300, slug: 'upaka-forest-reserve' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of anakapalliPlaces) {
      // Find the place (case-insensitive name check under districtName "Anakapalli" or "Annakapalli")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: { $in: ['Anakapalli', 'Annakapalli'] }
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Anakapalli/Annakapalli.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      anakapalliPlaces.forEach(item => {
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

    console.log('\nAll Anakapalli coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
