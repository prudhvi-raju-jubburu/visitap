const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI;

// Define Place Schema
const PlaceSchema = new mongoose.Schema({
  name: String,
  location: {
    type: { type: String },
    coordinates: [Number]
  }
});

// Avoid Overwrite Model Compile Error
const Place = mongoose.models.Place || mongoose.model('Place', PlaceSchema);

async function main() {
  if (!MONGO_URI) {
    console.error('MONGO_URI is missing in .env!');
    process.exit(1);
  }
  
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB...');

  const targets = [
    'Araku Valley',
    'RK Beach',
    'Tirumala Temple',
    'Gandikota Fort'
  ];

  console.log('\n--- Coordinate Accuracy Test ---');
  for (const name of targets) {
    const place = await Place.findOne({ name: new RegExp(name, 'i') });
    if (!place) {
      console.log(`❌ Place "${name}" not found in database!`);
      continue;
    }

    const coords = place.location?.coordinates;
    if (!coords || coords.length !== 2) {
      console.log(`❌ Place "${place.name}" has missing/invalid coordinates!`);
      continue;
    }

    const [lng, lat] = coords;
    const isValid = Number.isFinite(lat) && Number.isFinite(lng) &&
                    lat >= -90 && lat <= 90 &&
                    lng >= -180 && lng <= 180 &&
                    lat !== 0 && lng !== 0;

    if (isValid) {
      console.log(`✅ ${place.name}: Latitude = ${lat}, Longitude = ${lng}`);
    } else {
      console.log(`❌ ${place.name}: Invalid coordinates: [${lng}, ${lat}]`);
    }
  }

  await mongoose.disconnect();
  console.log('\nDisconnected from DB.');
}

main();
