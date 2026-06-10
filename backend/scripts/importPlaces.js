const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Place = require('../models/Place');
const District = require('../models/District');

if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI;
const MASTER_FILE = path.join(__dirname, '..', 'data', 'master-places.json');

async function importPlaces() {
  console.log('Connecting to MongoDB for import...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    // 1. Read master dataset
    if (!fs.existsSync(MASTER_FILE)) {
      throw new Error(`Master dataset not found at ${MASTER_FILE}. Run "npm run build-dataset" first.`);
    }

    const placesData = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf-8'));
    if (!Array.isArray(placesData) || placesData.length === 0) {
      throw new Error('Master dataset is empty or not an array.');
    }

    console.log(`Loaded ${placesData.length} places from master dataset.`);

    // 2. Fetch all districts from DB to map name -> ObjectId
    console.log('Retrieving districts from database...');
    const districts = await District.find({});
    console.log(`Found ${districts.length} districts in DB.`);

    const districtMap = new Map();
    districts.forEach(d => {
      const nameLower = d.name.toLowerCase().trim();
      districtMap.set(nameLower, d._id);
      
      // Handle spelling variations for Anakapalli / Annakapalli
      if (nameLower === 'annakapalli') {
        districtMap.set('anakapalli', d._id);
      } else if (nameLower === 'anakapalli') {
        districtMap.set('annakapalli', d._id);
      }
    });

    // 3. Verify all place districtNames can be mapped
    console.log('Resolving district IDs for all places...');
    const unmappedDistricts = new Set();
    
    placesData.forEach(p => {
      const normName = p.districtName.toLowerCase().trim();
      if (!districtMap.has(normName)) {
        unmappedDistricts.add(p.districtName);
      }
    });

    if (unmappedDistricts.size > 0) {
      throw new Error(`Cannot resolve district IDs for the following district names in dataset: [${Array.from(unmappedDistricts).join(', ')}]. Please verify your districts database.`);
    }

    // 4. Map the dataset to Mongoose documents
    const preparedPlaces = placesData.map(p => {
      const normName = p.districtName.toLowerCase().trim();
      const districtId = districtMap.get(normName);
      
      return {
        name: p.name,
        slug: p.slug,
        districtId: districtId,
        districtName: p.districtName,
        description: p.description,
        shortDescription: p.shortDescription || `Explore ${p.name} in ${p.districtName}.`,
        category: p.category || 'Other',
        location: p.location,
        rating: p.rating || { average: 0, count: 0 },
        bestTimeToVisit: p.bestTimeToVisit || 'October to March',
        entryFee: p.entryFee || 'Free',
        timings: p.timings || '6:00 AM - 6:00 PM',
        isFeatured: p.isFeatured || false,
        isActive: p.isActive !== undefined ? p.isActive : true,
        coverImage: p.coverImage,
        images: p.images || [p.coverImage]
      };
    });

    // 5. Clear only the places collection (preserve districts, users, reviews)
    console.log('Wiping current Places collection...');
    const deleteResult = await Place.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing places.`);

    // 6. Bulk insert places
    console.log('Importing new places...');
    const result = await Place.insertMany(preparedPlaces);
    console.log(`Successfully imported ${result.length} places into MongoDB!`);
    
  } catch (err) {
    console.error('Import operation failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

importPlaces();
