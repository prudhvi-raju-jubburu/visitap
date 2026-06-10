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

const egPlaces = [
  { name: 'Dowleswaram Barrage', lat: 16.9548, lng: 81.7835, slug: 'dowleswaram-barrage' },
  { name: 'Dowleswaram Cotton Museum', lat: 16.9556, lng: 81.7848, slug: 'dowleswaram-cotton-museum' },
  { name: 'Godavari Arch Bridge', lat: 17.0009, lng: 81.7794, slug: 'godavari-arch-bridge' },
  { name: 'Godavari River cruise', lat: 17.0032, lng: 81.7858, slug: 'godavari-river-cruise' },
  { name: 'Kadiapulanka flower fields', lat: 16.9468, lng: 82.0527, slug: 'kadiapulanka-flower-fields' },
  { name: 'Kadiyam Nursery Gardens', lat: 16.9204, lng: 81.9988, slug: 'kadiyam-nursery-gardens' },
  { name: 'Rajahmundry City Center', lat: 17.0005, lng: 81.8040, slug: 'rajahmundry-city-center' },
  { name: 'Rajahmundry Ghats', lat: 17.0021, lng: 81.7788, slug: 'rajahmundry-ghats' },
  { name: 'Rajahmundry ISKCON Temple', lat: 17.0059, lng: 81.7916, slug: 'rajahmundry-iskcon-temple' },
  { name: 'Rajahmundry parklands', lat: 17.0112, lng: 81.7994, slug: 'rajahmundry-parklands' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of egPlaces) {
      // Find the place (case-insensitive name check under districtName "East Godavari")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'East Godavari'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district East Godavari.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      egPlaces.forEach(item => {
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

    console.log('\nAll East Godavari coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
