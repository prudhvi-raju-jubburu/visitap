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

const kadapaPlaces = [
  { name: 'Ameen Peer Dargah', lat: 14.4678, lng: 78.8249, slug: 'ameen-peer-dargah' },
  { name: 'Brahmamgari Matham', lat: 14.7845, lng: 78.8503, slug: 'brahmamgari-matham' },
  { name: 'Gandikota Fort', lat: 14.8154, lng: 78.2866, slug: 'gandikota-fort' },
  { name: 'Gandikota Gorge Camping', lat: 14.8168, lng: 78.2880, slug: 'gandikota-gorge-camping' },
  { name: 'Gandikota Viewpoint', lat: 14.8202, lng: 78.2904, slug: 'gandikota-viewpoint' },
  { name: 'Kadapa City Center', lat: 14.4674, lng: 78.8241, slug: 'kadapa-city-center' },
  { name: 'Lakkireddipalli Hills', lat: 14.1667, lng: 78.7000, slug: 'lakkireddipalli-hills' },
  { name: 'Pushpagiri Temple Complex', lat: 14.5975, lng: 78.7508, slug: 'pushpagiri-temple-complex' },
  { name: 'Siddavatam Fort', lat: 14.4670, lng: 78.9268, slug: 'siddavatam-fort' },
  { name: 'Vontimitta Kodandarama Temple', lat: 14.3833, lng: 78.9667, slug: 'vontimitta-kodandarama-temple' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of kadapaPlaces) {
      // Find the place (case-insensitive name check under districtName "YSR Kadapa")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'YSR Kadapa'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district YSR Kadapa.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      kadapaPlaces.forEach(item => {
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

    console.log('\nAll YSR Kadapa coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
