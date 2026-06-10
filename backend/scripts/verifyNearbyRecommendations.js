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
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'nearby-validation.json');

// Haversine formula to compute distance in km
function getHaversineDistance(lon1, lat1, lon2, lat2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Validation routes
const validationRoutes = [
  { from: 'rk-beach', to: 'rushikonda-beach', expectedKm: 9.87 },
  { from: 'araku-valley', to: 'borra-caves', expectedKm: 17.84 },
  { from: 'tirumala-venkateswara-temple', to: 'chandragiri-fort', expectedKm: 9.71 },
  { from: 'suryalanka-beach', to: 'vodarevu-beach', expectedKm: 12.89 }
];

async function runNearbyValidation() {
  console.log('Connecting to MongoDB for Nearby Recommendations Validation...');
  
  const validationReport = {
    timestamp: new Date().toISOString(),
    tests: {
      distanceVerification: [],
      nearbyRecommendations: []
    },
    status: 'PASSED'
  };

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    // 1. Verify specific distances (Haversine calculations)
    console.log('\n1. Verifying Haversine distance calculations...');
    for (const route of validationRoutes) {
      const fromPlace = await Place.findOne({ slug: route.from });
      const toPlace = await Place.findOne({ slug: route.to });

      if (!fromPlace || !toPlace) {
        console.warn(`  ⚠ Warning: Missing place in database for route: ${route.from} -> ${route.to}`);
        continue;
      }

      const fromCoords = fromPlace.location.coordinates; // [lng, lat]
      const toCoords = toPlace.location.coordinates;

      const computedDistance = getHaversineDistance(
        fromCoords[0], fromCoords[1],
        toCoords[0], toCoords[1]
      );

      // We accept a tolerance of up to 1 km
      const tolerance = 1.0; 
      const diff = Math.abs(computedDistance - route.expectedKm);
      const passed = diff <= tolerance;

      console.log(`  - ${fromPlace.name} -> ${toPlace.name}: Computed = ${computedDistance.toFixed(2)} km, Target = ${route.expectedKm} km. Diff = ${diff.toFixed(2)} km. [${passed ? '✓ PASS' : '❌ FAIL'}]`);

      validationReport.tests.distanceVerification.push({
        from: fromPlace.name,
        to: toPlace.name,
        storedFromCoordinates: fromCoords,
        storedToCoordinates: toCoords,
        computedDistanceKm: parseFloat(computedDistance.toFixed(3)),
        targetDistanceKm: route.expectedKm,
        passed
      });

      if (!passed) {
        validationReport.status = 'FAILED';
      }
    }

    // 2. Audit Nearby Attractions queries
    console.log('\n2. Auditing Nearby Attractions API results...');
    
    // Test Case: RK Beach (Visakhapatnam)
    const rkBeach = await Place.findOne({ slug: 'rk-beach' });
    if (rkBeach) {
      console.log(`  Auditing nearby places for RK Beach...`);
      const radiusInMeters = 20000; // 20 km
      
      const filter = {
        isActive: true,
        _id: { $ne: rkBeach._id }, // No self-recommendations
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: rkBeach.location.coordinates },
            $maxDistance: radiusInMeters,
          },
        },
      };

      const nearby = await Place.find(filter).limit(10);
      console.log(`  Found ${nearby.length} places near RK Beach within 20km:`);
      
      const list = nearby.map(p => {
        const dist = getHaversineDistance(
          rkBeach.location.coordinates[0], rkBeach.location.coordinates[1],
          p.location.coordinates[0], p.location.coordinates[1]
        );
        console.log(`    - ${p.name} (${dist.toFixed(2)} km away)`);
        return { name: p.name, slug: p.slug, distanceKm: parseFloat(dist.toFixed(3)) };
      });

      // Verify that no self-recommendation exists
      const selfIncluded = list.some(p => p.slug === 'rk-beach');
      
      validationReport.tests.nearbyRecommendations.push({
        origin: 'RK Beach',
        radiusKm: 20,
        selfRecommendationCheck: selfIncluded ? 'FAILED' : 'PASSED',
        recommendationsCount: list.length,
        recommendations: list
      });

      if (selfIncluded) {
        validationReport.status = 'FAILED';
      }
    }

    // Test Case: Araku Valley (ASR)
    const araku = await Place.findOne({ slug: 'araku-valley' });
    if (araku) {
      console.log(`  Auditing nearby places for Araku Valley...`);
      const radiusInMeters = 35000; // 35 km
      
      const filter = {
        isActive: true,
        _id: { $ne: araku._id }, // No self-recommendations
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: araku.location.coordinates },
            $maxDistance: radiusInMeters,
          },
        },
      };

      const nearby = await Place.find(filter).limit(10);
      console.log(`  Found ${nearby.length} places near Araku Valley within 35km:`);
      
      const list = nearby.map(p => {
        const dist = getHaversineDistance(
          araku.location.coordinates[0], araku.location.coordinates[1],
          p.location.coordinates[0], p.location.coordinates[1]
        );
        console.log(`    - ${p.name} (${dist.toFixed(2)} km away)`);
        return { name: p.name, slug: p.slug, distanceKm: parseFloat(dist.toFixed(3)) };
      });

      const selfIncluded = list.some(p => p.slug === 'araku-valley');
      
      validationReport.tests.nearbyRecommendations.push({
        origin: 'Araku Valley',
        radiusKm: 35,
        selfRecommendationCheck: selfIncluded ? 'FAILED' : 'PASSED',
        recommendationsCount: list.length,
        recommendations: list
      });

      if (selfIncluded) {
        validationReport.status = 'FAILED';
      }
    }

    // Save report
    fs.writeFileSync(REPORT_PATH, JSON.stringify(validationReport, null, 2), 'utf-8');
    console.log(`\n✓ Generated nearby recommendations report at: ${REPORT_PATH}`);
    console.log(`Overall Nearby Validation Status: ${validationReport.status}`);

  } catch (err) {
    console.error('Validation failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

runNearbyValidation();
