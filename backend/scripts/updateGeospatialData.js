const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Place = require('../models/Place');
const District = require('../models/District');
if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI;

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const MASTER_FILE = path.join(DATA_DIR, 'master-places.json');
const VERIFIED_COORDS_FILE = path.join(DATA_DIR, 'verified-coordinates.json');

async function updateGeospatialData() {
  console.log('Starting Geospatial Data Update...');

  try {
    // 1. Load verified coordinates
    if (!fs.existsSync(VERIFIED_COORDS_FILE)) {
      throw new Error(`Verified coordinates file not found at ${VERIFIED_COORDS_FILE}`);
    }
    const verifiedCoordinates = JSON.parse(fs.readFileSync(VERIFIED_COORDS_FILE, 'utf-8'));
    console.log(`Loaded verified coordinates for ${Object.keys(verifiedCoordinates).length} places.`);

    // 2. Update individual district files
    const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
    console.log(`Updating ${files.length} district files...`);

    let totalPlacesUpdated = 0;
    const masterPlacesList = [];

    files.forEach(file => {
      const filePath = path.join(DISTRICTS_DIR, file);
      const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let modified = false;

      const updatedPlaces = places.map(p => {
        const verified = verifiedCoordinates[p.slug];
        if (verified) {
          p.location.coordinates = [verified.longitude, verified.latitude];
          modified = true;
          totalPlacesUpdated++;
        }
        return p;
      });

      fs.writeFileSync(filePath, JSON.stringify(updatedPlaces, null, 2), 'utf-8');
      masterPlacesList.push(...updatedPlaces);
    });

    console.log(`✓ Updated coordinates for ${totalPlacesUpdated} places in district JSON files.`);

    // 3. Rebuild master-places.json
    fs.writeFileSync(MASTER_FILE, JSON.stringify(masterPlacesList, null, 2), 'utf-8');
    console.log(`✓ Rebuilt master dataset at: ${MASTER_FILE} with ${masterPlacesList.length} places.`);

    // 4. Update MongoDB Place collection
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Fetch all districts to map name -> ObjectId
    console.log('Fetching districts from database...');
    const districts = await District.find({});
    console.log(`Found ${districts.length} districts in DB.`);

    const districtMap = new Map();
    districts.forEach(d => {
      const nameLower = d.name.toLowerCase().trim();
      districtMap.set(nameLower, d._id);
      
      // Handle spelling variations
      if (nameLower === 'annakapalli') {
        districtMap.set('anakapalli', d._id);
      } else if (nameLower === 'anakapalli') {
        districtMap.set('annakapalli', d._id);
      }
    });

    console.log('Clearing existing Place collection in MongoDB...');
    await Place.deleteMany({});
    console.log('✓ Cleared Place collection.');

    console.log('Inserting updated places with verified coordinates into MongoDB...');
    const dbPlacesToInsert = masterPlacesList.map(p => {
      const districtLower = p.districtName.toLowerCase().trim();
      const districtId = districtMap.get(districtLower);
      
      if (!districtId) {
        throw new Error(`Could not map district name "${p.districtName}" to an ID.`);
      }

      return {
        name: p.name,
        slug: p.slug,
        districtId: districtId,
        districtName: p.districtName,
        description: p.description,
        shortDescription: p.shortDescription || `A beautiful ${p.category.toLowerCase()} spot in ${p.districtName}.`,
        category: p.category,
        location: p.location,
        coverImage: p.coverImage,
        images: p.images,
        rating: p.rating || { average: 0, count: 0 },
        bestTimeToVisit: p.bestTimeToVisit || 'October to March',
        entryFee: p.entryFee || 'Free',
        timings: p.timings || '6:00 AM - 6:00 PM',
        tags: p.tags || [p.category.toLowerCase()],
        isFeatured: p.isFeatured || false,
        isActive: true
      };
    });

    const result = await Place.insertMany(dbPlacesToInsert);
    console.log(`✓ Successfully imported ${result.length} places into MongoDB.`);

    // Ensure 2dsphere index is active
    console.log('Ensuring 2dsphere index on location field...');
    await Place.collection.createIndex({ location: '2dsphere' });
    console.log('✓ Geospatial index created successfully.');

  } catch (err) {
    console.error('Update failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

updateGeospatialData();
