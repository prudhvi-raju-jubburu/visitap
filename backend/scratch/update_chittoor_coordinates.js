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

const chittoorPlaces = [
  { name: 'Ardhagiri Veeranjaneya Temple', lat: 13.2689, lng: 79.1235, slug: 'ardhagiri-veeranjaneya-temple' },
  { name: 'Chittoor Fort ruins', lat: 13.2178, lng: 79.1004, slug: 'chittoor-fort-ruins' },
  { name: 'Chittoor Hills path', lat: 13.2252, lng: 79.1128, slug: 'chittoor-hills-path' },
  { name: 'Chittoor mango markets', lat: 13.2148, lng: 79.1016, slug: 'chittoor-mango-markets' },
  { name: 'Gurramkonda Fort borders', lat: 13.7805, lng: 78.5822, slug: 'gurramkonda-fort-borders' },
  { name: 'Kanipakam Temple tank', lat: 13.2538, lng: 79.0273, slug: 'kanipakam-temple-tank' },
  { name: 'Kanipakam Varasiddhi Temple', lat: 13.2536, lng: 79.0270, slug: 'kanipakam-varasiddhi-temple' },
  { name: 'Kaundinya Wildlife Sanctuary', lat: 13.3986, lng: 78.7524, slug: 'kaundinya-wildlife-sanctuary' },
  { name: 'Kaundinya elephant camps', lat: 13.4058, lng: 78.7602, slug: 'kaundinya-elephant-camps' },
  { name: 'Kaundinya forest trekking', lat: 13.3921, lng: 78.7468, slug: 'kaundinya-forest-trekking' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of chittoorPlaces) {
      // Find the place (case-insensitive name check under districtName "Chittoor")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Chittoor'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Chittoor.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      chittoorPlaces.forEach(item => {
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

    console.log('\nAll Chittoor coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
