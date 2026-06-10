const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Place = require('../models/Place');
if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI;

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const MASTER_FILE = path.join(DATA_DIR, 'master-places.json');

async function runConsistencyCheck() {
  console.log('Starting Geospatial Data Consistency Audit...');
  
  const report = {
    timestamp: new Date().toISOString(),
    totalDistrictFilesChecked: 0,
    totalPlacesChecked: 0,
    mismatchesFound: 0,
    districtsList: [],
    mismatches: []
  };

  try {
    // 1. Verify existence of files
    if (!fs.existsSync(MASTER_FILE)) {
      throw new Error(`master-places.json not found at ${MASTER_FILE}`);
    }
    if (!fs.existsSync(DISTRICTS_DIR)) {
      throw new Error(`districts folder not found at ${DISTRICTS_DIR}`);
    }

    const masterPlaces = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf-8'));
    console.log(`Loaded ${masterPlaces.length} places from master-places.json.`);

    const files = fs.readdirSync(DISTRICTS_DIR).filter(f => f.endsWith('.json'));
    report.totalDistrictFilesChecked = files.length;
    console.log(`Auditing ${files.length} district files...`);

    const districtPlacesMap = new Map();
    const districtFilesPlacesCount = new Map();

    // Load from individual files
    files.forEach(file => {
      const filePath = path.join(DISTRICTS_DIR, file);
      const districtPlaces = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      report.districtsList.push(file);
      
      districtPlaces.forEach(p => {
        districtPlacesMap.set(p.slug, p);
      });
      districtFilesPlacesCount.set(file, districtPlaces.length);
    });

    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const dbPlaces = await Place.find({});
    console.log(`Found ${dbPlaces.length} places in MongoDB.`);

    const dbPlacesMap = new Map();
    dbPlaces.forEach(p => {
      dbPlacesMap.set(p.slug, p);
    });

    // 2. Perform cross-checks
    masterPlaces.forEach(mPlace => {
      report.totalPlacesChecked++;
      const slug = mPlace.slug;
      const name = mPlace.name;

      // Check A: Master vs District File
      const dPlace = districtPlacesMap.get(slug);
      if (!dPlace) {
        report.mismatchesFound++;
        report.mismatches.push({
          slug,
          name,
          type: 'MISSING_IN_DISTRICT_FILE',
          details: `Attraction is present in master-places.json but missing in district JSON files.`
        });
      } else {
        const mCoords = mPlace.location.coordinates;
        const dCoords = dPlace.location.coordinates;
        if (Math.abs(mCoords[0] - dCoords[0]) > 0.0001 || Math.abs(mCoords[1] - dCoords[1]) > 0.0001) {
          report.mismatchesFound++;
          report.mismatches.push({
            slug,
            name,
            type: 'MASTER_VS_DISTRICT_FILE_COORDINATE_MISMATCH',
            details: `Coordinates in master-places.json [${mCoords}] do not match district JSON [${dCoords}].`
          });
        }
      }

      // Check B: Master vs MongoDB Document
      const dbPlace = dbPlacesMap.get(slug);
      if (!dbPlace) {
        report.mismatchesFound++;
        report.mismatches.push({
          slug,
          name,
          type: 'MISSING_IN_MONGODB',
          details: `Attraction is present in master-places.json but missing in MongoDB Place collection.`
        });
      } else {
        const mCoords = mPlace.location.coordinates;
        const dbCoords = dbPlace.location.coordinates; // [lng, lat]
        if (Math.abs(mCoords[0] - dbCoords[0]) > 0.0001 || Math.abs(mCoords[1] - dbCoords[1]) > 0.0001) {
          report.mismatchesFound++;
          report.mismatches.push({
            slug,
            name,
            type: 'MASTER_VS_MONGODB_COORDINATE_MISMATCH',
            details: `Coordinates in master-places.json [${mCoords}] do not match MongoDB [${dbCoords}].`
          });
        }
      }
    });

    // Check C: MongoDB vs Master (Orphans in DB)
    dbPlaces.forEach(dbPlace => {
      const match = masterPlaces.find(m => m.slug === dbPlace.slug);
      if (!match) {
        report.mismatchesFound++;
        report.mismatches.push({
          slug: dbPlace.slug,
          name: dbPlace.name,
          type: 'ORPHAN_IN_MONGODB',
          details: `Place document exists in MongoDB but is missing in master-places.json.`
        });
      }
    });

    console.log(`\nConsistency Audit Complete.`);
    console.log(`- Places Checked: ${report.totalPlacesChecked}`);
    console.log(`- Mismatches Found: ${report.mismatchesFound}`);
    console.log(`- Status: ${report.mismatchesFound === 0 ? '✅ 100% CONSISTENT' : '❌ MISMATCHES DETECTED'}`);

    if (report.mismatchesFound > 0) {
      console.log('\nMismatches Detail:');
      report.mismatches.forEach((m, idx) => {
        console.log(`${idx + 1}. [${m.type}] ${m.name} (${m.slug}): ${m.details}`);
      });
    }

    // Save report to file
    const reportPath = path.join(__dirname, '..', 'reports', 'data-consistency-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Report saved to ${reportPath}`);

  } catch (err) {
    console.error('Consistency check failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

runConsistencyCheck();
