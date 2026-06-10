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

const konaseemaPlaces = [
  { name: 'Ainavilli Vinayaka Temple', lat: 16.5993, lng: 82.0021, slug: 'ainavilli-vinayaka-temple' },
  { name: 'Antarvedi Beach', lat: 16.3336, lng: 81.7348, slug: 'antarvedi-beach' },
  { name: 'Antarvedi Lakshmi Narasimha Temple', lat: 16.3308, lng: 81.7322, slug: 'antarvedi-lakshmi-narasimha-temple' },
  { name: 'Dindi Backwaters', lat: 16.5202, lng: 81.7365, slug: 'dindi-backwaters' },
  { name: 'Konaseema Houseboats', lat: 16.5154, lng: 81.7428, slug: 'konaseema-houseboats' },
  { name: 'Mamikuduru Wetlands', lat: 16.6553, lng: 82.0954, slug: 'mamikuduru-wetlands' },
  { name: 'Peruru Heritage Village', lat: 16.7821, lng: 82.0413, slug: 'peruru-heritage-village' },
  { name: 'Razole town', lat: 16.4768, lng: 81.8396, slug: 'razole-town' },
  { name: 'Ryali Jaganmohini Temple', lat: 16.7924, lng: 81.9591, slug: 'ryali-jaganmohini-temple' },
  { name: 'Vashishta Godavari River confluence', lat: 16.3375, lng: 81.7289, slug: 'vashishta-godavari-river-confluence' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of konaseemaPlaces) {
      // Find the place (case-insensitive name check under districtName "Dr. B.R. Ambedkar Konaseema")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Dr. B.R. Ambedkar Konaseema'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Dr. B.R. Ambedkar Konaseema.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      konaseemaPlaces.forEach(item => {
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

    console.log('\nAll Dr. B.R. Ambedkar Konaseema coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
