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

const krishnaPlaces = [
  { name: 'Bandar Fort ruins', lat: 16.1835, lng: 81.1382, slug: 'bandar-fort-ruins' },
  { name: 'Hamsaladeevi Beach', lat: 15.9530, lng: 81.0858, slug: 'hamsaladeevi-beach' },
  { name: 'Hamsaladeevi Venugopala Temple', lat: 15.9564, lng: 81.0819, slug: 'hamsaladeevi-venugopala-temple' },
  { name: 'Hamsaladeevi boating point', lat: 15.9498, lng: 81.0896, slug: 'hamsaladeevi-boating-point' },
  { name: 'Krishna River Delta', lat: 15.9655, lng: 81.0724, slug: 'krishna-river-delta' },
  { name: 'Kuchipudi Dance Academy', lat: 16.1872, lng: 80.7936, slug: 'kuchipudi-dance-academy' },
  { name: 'Machilipatnam Kalamkari Town', lat: 16.1804, lng: 81.1301, slug: 'machilipatnam-kalamkari-town' },
  { name: 'Machilipatnam Port town', lat: 16.1718, lng: 81.1415, slug: 'machilipatnam-port-town' },
  { name: 'Manginapudi Beach', lat: 16.1972, lng: 81.2417, slug: 'manginapudi-beach' },
  { name: 'Manginapudi Lake', lat: 16.2028, lng: 81.2336, slug: 'manginapudi-lake' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of krishnaPlaces) {
      // Find the place (case-insensitive name check under districtName "Krishna")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Krishna'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Krishna.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      krishnaPlaces.forEach(item => {
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

    console.log('\nAll Krishna coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
