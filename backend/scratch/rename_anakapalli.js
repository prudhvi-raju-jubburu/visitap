const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI;

// Define Schemas
const DistrictSchema = new mongoose.Schema({ name: String, slug: String });
const PlaceSchema = new mongoose.Schema({ name: String, districtName: String });

const District = mongoose.model('District', DistrictSchema);
const Place = mongoose.model('Place', PlaceSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB...');

  // Find the district with name "Annakapalli"
  const dist = await District.findOne({ name: 'Annakapalli' });
  if (dist) {
    console.log('Found Annakapalli district. Updating name and slug...');
    dist.name = 'Anakapalli';
    dist.slug = 'anakapalli';
    await dist.save();
    console.log('District updated successfully!');
  } else {
    console.log('District "Annakapalli" not found. Checking if Anakapalli already exists...');
    const existing = await District.findOne({ name: 'Anakapalli' });
    if (existing) {
      console.log('District "Anakapalli" already exists.');
    } else {
      console.log('Neither district found!');
    }
  }

  // Double check if any place is using Annakapalli
  const placesWithTwoNs = await Place.find({ districtName: 'Annakapalli' });
  if (placesWithTwoNs.length > 0) {
    console.log(`Found ${placesWithTwoNs.length} places with districtName "Annakapalli". Updating them to "Anakapalli"...`);
    for (const p of placesWithTwoNs) {
      p.districtName = 'Anakapalli';
      await p.save();
    }
    console.log('Places updated successfully!');
  } else {
    console.log('No places are using "Annakapalli" spelling.');
  }

  await mongoose.disconnect();
}

main();
