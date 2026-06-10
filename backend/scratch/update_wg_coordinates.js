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

const wgPlaces = [
  { name: 'Bhimavaram City Center', lat: 16.5449, lng: 81.5212, slug: 'bhimavaram-city-center' },
  { name: 'Godavari Delta Canals', lat: 16.4800, lng: 81.6500, slug: 'godavari-delta-canals' },
  { name: 'Kolleru Wetlands', lat: 16.6300, lng: 81.2500, slug: 'kolleru-wetlands' },
  { name: 'Ksheerarama Gopuram', lat: 16.5168, lng: 81.7288, slug: 'ksheerarama-gopuram' },
  { name: 'Ksheerarama Temple', lat: 16.5208, lng: 81.7289, slug: 'ksheerarama-temple' },
  { name: 'Narsapur Lace Industry', lat: 16.4340, lng: 81.6985, slug: 'narsapur-lace-industry' },
  { name: 'Palakollu Town', lat: 16.5165, lng: 81.7281, slug: 'palakollu-town' },
  { name: 'Perupalem Beach', lat: 16.3589, lng: 81.5956, slug: 'perupalem-beach' },
  { name: 'Somarama Temple', lat: 16.5436, lng: 81.5236, slug: 'somarama-temple' },
  { name: 'Somarama Temple Tank', lat: 16.5431, lng: 81.5242, slug: 'somarama-temple-tank' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of wgPlaces) {
      // Find the place (case-insensitive name check under districtName "West Godavari")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'West Godavari'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district West Godavari.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      wgPlaces.forEach(item => {
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

    console.log('\nAll Bhimavaram/West Godavari coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
