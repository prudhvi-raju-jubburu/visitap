const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const UserCollection = require('../models/UserCollection');
const Place = require('../models/Place');
const District = require('../models/District');
const TripPlan = require('../models/TripPlan');
const User = require('../models/User');

if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI;
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'collection-audit.json');

async function verifyCollections() {
  console.log('Connecting to MongoDB for collections audit...');
  try {
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    const auditReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCollections: 0,
        missingPlacesCount: 0,
        missingDistrictsCount: 0,
        missingTripsCount: 0,
        duplicateSavesCount: 0,
        statsMismatchesCount: 0,
        achievementMismatchesCount: 0,
        clean: true
      },
      missingPlaces: [],
      missingDistricts: [],
      missingTrips: [],
      duplicateSaves: [],
      statsMismatches: [],
      achievementMismatches: []
    };

    // Fetch master datasets for quick lookups
    const places = await Place.find({});
    const districts = await District.find({});
    const trips = await TripPlan.find({});
    const users = await User.find({});

    const placeMap = new Map(places.map(p => [p._id.toString(), p]));
    const districtMap = new Map(districts.map(d => [d._id.toString(), d]));
    const tripMap = new Map(trips.map(t => [t._id.toString(), t]));
    const userIds = new Set(users.map(u => u._id.toString()));

    const collections = await UserCollection.find({});
    auditReport.summary.totalCollections = collections.length;
    console.log(`Auditing ${collections.length} traveler collection documents...`);

    for (const col of collections) {
      const colId = col._id.toString();
      const userId = col.userId ? col.userId.toString() : 'UNKNOWN';

      if (!col.userId || !userIds.has(userId)) {
        console.warn(`⚠️ Warning: Collection ${colId} has an invalid or orphaned userId: ${userId}`);
      }

      // A. Check Missing Place References & Duplicates
      const placeIds = col.savedPlaces.map(p => p.placeId.toString());
      const uniquePlaces = new Set();
      const duplicatePlaces = [];

      placeIds.forEach(id => {
        if (!placeMap.has(id)) {
          auditReport.summary.missingPlacesCount++;
          auditReport.missingPlaces.push({ collectionId: colId, userId, placeId: id });
        }
        if (uniquePlaces.has(id)) {
          duplicatePlaces.push(id);
        } else {
          uniquePlaces.add(id);
        }
      });

      // B. Check Missing District References & Duplicates
      const districtIds = col.savedDistricts.map(d => d.districtId.toString());
      const uniqueDistricts = new Set();
      const duplicateDistricts = [];

      districtIds.forEach(id => {
        if (!districtMap.has(id)) {
          auditReport.summary.missingDistrictsCount++;
          auditReport.missingDistricts.push({ collectionId: colId, userId, districtId: id });
        }
        if (uniqueDistricts.has(id)) {
          duplicateDistricts.push(id);
        } else {
          uniqueDistricts.add(id);
        }
      });

      // C. Check Missing Trip References & Duplicates
      const tripIds = col.savedTrips.map(t => t.tripId.toString());
      const uniqueTrips = new Set();
      const duplicateTrips = [];

      tripIds.forEach(id => {
        if (!tripMap.has(id)) {
          auditReport.summary.missingTripsCount++;
          auditReport.missingTrips.push({ collectionId: colId, userId, tripId: id });
        }
        if (uniqueTrips.has(id)) {
          duplicateTrips.push(id);
        } else {
          uniqueTrips.add(id);
        }
      });

      if (duplicatePlaces.length > 0 || duplicateDistricts.length > 0 || duplicateTrips.length > 0) {
        auditReport.summary.duplicateSavesCount++;
        auditReport.duplicateSaves.push({
          collectionId: colId,
          userId,
          duplicatePlaces,
          duplicateDistricts,
          duplicateTrips
        });
      }

      // D. Check Stats counts mismatches
      const actualPlacesCount = col.savedPlaces.length;
      const actualDistrictsCount = col.savedDistricts.length;
      const actualTripsCount = col.savedTrips.length;

      const cachedPlacesCount = col.stats.placesCount || 0;
      const cachedDistrictsCount = col.stats.districtsCount || 0;
      const cachedTripsCount = col.stats.tripsCount || 0;

      if (actualPlacesCount !== cachedPlacesCount || 
          actualDistrictsCount !== cachedDistrictsCount || 
          actualTripsCount !== cachedTripsCount) {
        auditReport.summary.statsMismatchesCount++;
        auditReport.statsMismatches.push({
          collectionId: colId,
          userId,
          cached: { places: cachedPlacesCount, districts: cachedDistrictsCount, trips: cachedTripsCount },
          actual: { places: actualPlacesCount, districts: actualDistrictsCount, trips: actualTripsCount }
        });
      }

      // E. Check Achievements inconsistency
      let templeCount = 0;
      let beachCount = 0;
      col.savedPlaces.forEach(p => {
        const placeObj = placeMap.get(p.placeId.toString());
        if (placeObj) {
          if (placeObj.category === 'Temple / Religious') templeCount++;
          if (placeObj.category === 'Beach') beachCount++;
        }
      });

      const expectedExplorer = actualPlacesCount >= 10;
      const expectedDistrictMaster = actualDistrictsCount >= 10;
      const expectedTempleExplorer = templeCount >= 10;
      const expectedBeachExplorer = beachCount >= 10;

      const currentExplorer = col.achievements.explorer || false;
      const currentDistrictMaster = col.achievements.districtMaster || false;
      const currentTempleExplorer = col.achievements.templeExplorer || false;
      const currentBeachExplorer = col.achievements.beachExplorer || false;

      if (expectedExplorer !== currentExplorer ||
          expectedDistrictMaster !== currentDistrictMaster ||
          expectedTempleExplorer !== currentTempleExplorer ||
          expectedBeachExplorer !== currentBeachExplorer) {
        auditReport.summary.achievementMismatchesCount++;
        auditReport.achievementMismatches.push({
          collectionId: colId,
          userId,
          cached: { 
            explorer: currentExplorer, 
            districtMaster: currentDistrictMaster, 
            templeExplorer: currentTempleExplorer, 
            beachExplorer: currentBeachExplorer 
          },
          expected: { 
            explorer: expectedExplorer, 
            districtMaster: expectedDistrictMaster, 
            templeExplorer: expectedTempleExplorer, 
            beachExplorer: expectedBeachExplorer 
          }
        });
      }
    }

    const hasIssues = 
      auditReport.summary.missingPlacesCount > 0 ||
      auditReport.summary.missingDistrictsCount > 0 ||
      auditReport.summary.missingTripsCount > 0 ||
      auditReport.summary.duplicateSavesCount > 0 ||
      auditReport.summary.statsMismatchesCount > 0 ||
      auditReport.summary.achievementMismatchesCount > 0;

    auditReport.summary.clean = !hasIssues;

    fs.writeFileSync(REPORT_PATH, JSON.stringify(auditReport, null, 2), 'utf-8');
    console.log(`Audit report generated at: ${REPORT_PATH}`);
    console.log(`\nAudit Summary:`);
    console.log(`- Total Traveler Collections: ${auditReport.summary.totalCollections}`);
    console.log(`- Missing Place References: ${auditReport.summary.missingPlacesCount}`);
    console.log(`- Missing District References: ${auditReport.summary.missingDistrictsCount}`);
    console.log(`- Missing Trip References: ${auditReport.summary.missingTripsCount}`);
    console.log(`- Collections with Duplicates: ${auditReport.summary.duplicateSavesCount}`);
    console.log(`- Collections with Stats Mismatches: ${auditReport.summary.statsMismatchesCount}`);
    console.log(`- Collections with Achievement Mismatches: ${auditReport.summary.achievementMismatchesCount}`);
    console.log(`- Overall Status: ${auditReport.summary.clean ? '✅ CLEAN' : '❌ INCONSISTENCIES FOUND'}`);

  } catch (error) {
    console.error('Audit failed:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

verifyCollections();
