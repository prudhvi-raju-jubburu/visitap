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

const annamayyaPlaces = [
  { name: 'Annamacharya Memorial', lat: 14.2308, lng: 79.1505, slug: 'annamacharya-memorial' },
  { name: 'Gurramkonda Fort', lat: 13.7828, lng: 78.5854, slug: 'gurramkonda-fort' },
  { name: 'Gurramkonda Rangin Mahal', lat: 13.7819, lng: 78.5868, slug: 'gurramkonda-rangin-mahal' },
  { name: 'Horsley Hills Resort', lat: 13.6552, lng: 78.3938, slug: 'horsley-hills-resort' },
  { name: 'Horsley Hills Trekking', lat: 13.6615, lng: 78.3992, slug: 'horsley-hills-trekking' },
  { name: 'Horsley Hills forest path', lat: 13.6488, lng: 78.3886, slug: 'horsley-hills-forest-path' },
  { name: 'Kalyani Dam Reservoir', lat: 13.6295, lng: 79.2818, slug: 'kalyani-dam-reservoir' },
  { name: 'Madanapalle Town Center', lat: 13.5503, lng: 78.5029, slug: 'madanapalle-town-center' },
  { name: 'Sompalem Chennakesava Temple', lat: 13.8602, lng: 78.2704, slug: 'sompalem-chennakesava-temple' },
  { name: 'Tallapaka Poet Village', lat: 14.2300, lng: 79.1525, slug: 'tallapaka-poet-village' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of annamayyaPlaces) {
      // Find the place (case-insensitive name check under districtName "Annamayya")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Annamayya'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Annamayya.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      annamayyaPlaces.forEach(item => {
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

    console.log('\nAll Annamayya coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
