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

const vzmPlaces = [
  { name: 'Gajapathiraju Palace', lat: 18.1169, lng: 83.4110, slug: 'gajapathiraju-palace' },
  { name: 'Kumili Temple Complex', lat: 18.1018, lng: 83.4502, slug: 'kumili-temple-complex' },
  { name: 'Kumili Village Gardens', lat: 18.0985, lng: 83.4470, slug: 'kumili-village-gardens' },
  { name: 'Rama Tirtham Bodhikonda', lat: 18.1633, lng: 83.4908, slug: 'rama-tirtham-bodhikonda' },
  { name: 'Rama Tirtham Temple', lat: 18.1642, lng: 83.4915, slug: 'rama-tirtham-temple' },
  { name: 'Rama Tirtham Water Tank', lat: 18.1625, lng: 83.4897, slug: 'rama-tirtham-water-tank' },
  { name: 'Vizianagaram Clock Tower', lat: 18.1160, lng: 83.4118, slug: 'vizianagaram-clock-tower' },
  { name: 'Vizianagaram Fort', lat: 18.1172, lng: 83.4072, slug: 'vizianagaram-fort' },
  { name: 'Vizianagaram Lake Park', lat: 18.1215, lng: 83.4150, slug: 'vizianagaram-lake-park' },
  { name: 'Vizianagaram Market', lat: 18.1153, lng: 83.4132, slug: 'vizianagaram-market' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of vzmPlaces) {
      // Find the place (case-insensitive name check under districtName "Vizianagaram")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Vizianagaram'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Vizianagaram.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      vzmPlaces.forEach(item => {
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

    console.log('\nAll Vizianagaram coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
