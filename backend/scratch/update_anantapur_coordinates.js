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

const anantapurPlaces = [
  { name: 'Anantapur City Center', lat: 14.6819, lng: 77.6006, slug: 'anantapur-city-center' },
  { name: 'Dharmavaram Lake', lat: 14.4145, lng: 77.7208, slug: 'dharmavaram-lake' },
  { name: 'Dharmavaram Silk Village', lat: 14.4136, lng: 77.7197, slug: 'dharmavaram-silk-village' },
  { name: 'Gooty Fort', lat: 15.1247, lng: 77.6342, slug: 'gooty-fort' },
  { name: 'Gooty Hilltop Viewpoint', lat: 15.1265, lng: 77.6355, slug: 'gooty-hilltop-viewpoint' },
  { name: 'Lepakshi Nandi', lat: 13.8010, lng: 77.6075, slug: 'lepakshi-nandi' },
  { name: 'Lepakshi Veerabhadra Temple', lat: 13.8035, lng: 77.6098, slug: 'lepakshi-veerabhadra-temple' },
  { name: 'Penukonda Fort', lat: 14.0825, lng: 77.5948, slug: 'penukonda-fort' },
  { name: 'Penukonda Gagan Mahal', lat: 14.0812, lng: 77.5961, slug: 'penukonda-gagan-mahal' },
  { name: 'Tadpatri Temples', lat: 14.9097, lng: 78.0105, slug: 'tadpatri-temples' }
];

async function main() {
  try {
    // 1. Connect to MongoDB Atlas and update database
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    for (const item of anantapurPlaces) {
      // Find the place (case-insensitive name check under districtName "Anantapur")
      const placeDoc = await Place.findOne({
        name: { $regex: new RegExp(`^${item.name.replace('*', '')}$`, 'i') },
        districtName: 'Anantapur'
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
        console.warn(`WARNING: DB Place "${item.name}" not found under district Anantapur.`);
      }
    }

    console.log('\nDatabase synchronization complete. Now updating verified-coordinates.json...');

    // 2. Load, update and save JSON coordinates
    const jsonPath = path.join(__dirname, '../data/verified-coordinates.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

      anantapurPlaces.forEach(item => {
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

    console.log('\nAll Anantapur coordinates have been successfully synchronized.');

  } catch (err) {
    console.error('Error running update script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
