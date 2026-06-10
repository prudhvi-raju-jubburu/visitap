const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI;

// Define Schema
const PlaceSchema = new mongoose.Schema({
  name: String,
  districtName: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  }
});

const Place = mongoose.model('Place', PlaceSchema);

const vizagPlaces = [
  { name: 'Bheemili Beach', lat: 17.8905, lng: 83.4529 },
  { name: 'Kambalakonda Wildlife Sanctuary', lat: 17.7907, lng: 83.3378 },
  { name: 'Katiki Waterfalls', lat: 18.2674, lng: 82.9967 },
  { name: 'RK Beach', lat: 17.7149, lng: 83.3237 },
  { name: 'Rushikonda Beach', lat: 17.7820, lng: 83.3855 },
  { name: 'Simhachalam Hill Sanctuary', lat: 17.7670, lng: 83.2510 },
  { name: 'Simhachalam Temple', lat: 17.7667, lng: 83.2506 },
  { name: 'Tadimada Waterfalls', lat: 18.2324, lng: 82.9123 },
  { name: 'Visakhapatnam Harbor', lat: 17.6868, lng: 83.2185 },
  { name: 'Yarada Beach', lat: 17.6555, lng: 83.2747 }
];

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of vizagPlaces) {
      // Find the place (case-insensitive name check under districtName "Visakhapatnam")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Visakhapatnam'
      });

      if (placeDoc) {
        console.log(`Updating ${placeDoc.name}: [lng: ${item.lng}, lat: ${item.lat}]`);
        placeDoc.location = {
          type: 'Point',
          coordinates: [item.lng, item.lat] // [longitude, latitude]
        };
        await placeDoc.save();
        console.log(`Successfully updated ${placeDoc.name}!`);
      } else {
        console.warn(`WARNING: Place "${item.name}" not found under district Visakhapatnam.`);
      }
    }

    console.log('\nAll Visakhapatnam coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
