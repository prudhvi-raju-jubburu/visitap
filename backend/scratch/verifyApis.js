const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/visit_ap';

const District = require('../models/District');
const Place = require('../models/Place');

async function verify() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  // 1. Get database counts
  const distCount = await District.countDocuments({});
  const placeCount = await Place.countDocuments({});
  console.log(`\n=== DATABASE VERIFICATION ===`);
  console.log(`Districts Count: ${distCount} (Expected: 26)`);
  console.log(`Places Count: ${placeCount} (Expected: 260)`);

  // 2. Retrieve all districts to see their names and slugs
  const districts = await District.find({}).sort({ name: 1 });
  console.log(`\n=== DISTRICT DETAILS ===`);
  districts.forEach(d => {
    console.log(`Name: "${d.name}", Slug: "${d.slug}", Cover: "${d.image}"`);
  });

  // 3. Test queries like the API controller does
  console.log(`\n=== API QUERY TESTING ===`);
  
  // Annakapalli
  const queryStr1 = 'annakapalli';
  const slugStr1 = queryStr1.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/-+/g, '-');
  const d1 = await District.findOne({
    $or: [
      { slug: slugStr1 },
      { slug: queryStr1.toLowerCase() },
      { name: new RegExp(`^${queryStr1}$`, 'i') },
      { name: new RegExp(`^${queryStr1.replace(/[-\s.]+/g, '.*')}$`, 'i') }
    ]
  });
  
  if (d1) {
    const places1 = await Place.find({
      $or: [
        { districtId: d1._id },
        { districtName: d1.name }
      ]
    });
    console.log(`Annakapalli: Found district "${d1.name}". Attractions count: ${places1.length} (Expected: 10)`);
    places1.forEach(p => console.log(`  - ${p.name} (${p.category})`));
  } else {
    console.log(`Annakapalli: District not found!`);
  }

  // Dr. B.R. Ambedkar Konaseema
  const queryStr2 = 'dr br ambedkar konaseema';
  const slugStr2 = queryStr2.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/-+/g, '-');
  const d2 = await District.findOne({
    $or: [
      { slug: slugStr2 },
      { slug: queryStr2.toLowerCase() },
      { name: new RegExp(`^${queryStr2}$`, 'i') },
      { name: new RegExp(`^${queryStr2.replace(/[-\s.]+/g, '.*')}$`, 'i') }
    ]
  });

  if (d2) {
    const places2 = await Place.find({
      $or: [
        { districtId: d2._id },
        { districtName: d2.name }
      ]
    });
    console.log(`\nKonaseema: Found district "${d2.name}". Attractions count: ${places2.length} (Expected: 10)`);
    places2.forEach(p => console.log(`  - ${p.name} (${p.category})`));
  } else {
    console.log(`\nKonaseema: District not found!`);
  }

  await mongoose.disconnect();
  console.log('\nDisconnected.');
}

verify().catch(console.error);
