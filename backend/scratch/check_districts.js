const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGO_URI = process.env.MONGO_URI;

// Define Schemas
const DistrictSchema = new mongoose.Schema({ name: String });
const PlaceSchema = new mongoose.Schema({ name: String, districtName: String });

const District = mongoose.model('District', DistrictSchema);
const Place = mongoose.model('Place', PlaceSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB...');

  const districts = await District.find();
  const places = await Place.find();

  const districtNames = districts.map(d => d.name);
  console.log('Districts in Database:', districtNames);

  const placeDistrictNames = [...new Set(places.map(p => p.districtName))];
  console.log('\nDistrict Names in Places Collection:', placeDistrictNames);

  console.log('\nChecking for mismatches:');
  const mismatches = [];
  places.forEach(p => {
    if (!districtNames.includes(p.districtName)) {
      mismatches.push({ placeName: p.name, placeDistrict: p.districtName });
    }
  });

  if (mismatches.length === 0) {
    console.log('No mismatches found! All places map to a valid district.');
  } else {
    console.log(`Found ${mismatches.length} mismatches:`, mismatches);
  }

  await mongoose.disconnect();
}

main();
