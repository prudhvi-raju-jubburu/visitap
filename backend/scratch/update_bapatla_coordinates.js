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

const bapatlaPlaces = [
  { name: 'Bapatla Bhavanarayana Temple', lat: 15.9048, lng: 80.4672, slug: 'bapatla-bhavanarayana-temple' },
  { name: 'Bapatla City Center', lat: 15.9041, lng: 80.4676, slug: 'bapatla-city-center' },
  { name: 'Bhavanarayana temple tanks', lat: 15.9044, lng: 80.4670, slug: 'bhavanarayana-temple-tanks' },
  { name: 'Chirala Beach point', lat: 15.8115, lng: 80.3696, slug: 'chirala-beach-point' },
  { name: 'Chirala Weaving Hub', lat: 15.8234, lng: 80.3521, slug: 'chirala-weaving-hub' },
  { name: 'Suryalanka Beach', lat: 15.8453, lng: 80.5211, slug: 'suryalanka-beach' },
  { name: 'Suryalanka Coastline', lat: 15.8481, lng: 80.5268, slug: 'suryalanka-coastline' },
  { name: 'Suryalanka Resorts', lat: 15.8427, lng: 80.5179, slug: 'suryalanka-resorts' },
  { name: 'Vodarevu Beach', lat: 15.7912, lng: 80.4093, slug: 'vodarevu-beach' },
  { name: 'Vodarevu Fishing Port', lat: 15.7878, lng: 80.4064, slug: 'vodarevu-fishing-port' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of bapatlaPlaces) {
      // Find the place (case-insensitive name check under districtName "Bapatla")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Bapatla'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Bapatla.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      bapatlaPlaces.forEach(item => {
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

    console.log('\nAll Bapatla coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
