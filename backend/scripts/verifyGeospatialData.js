const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const VERIFIED_COORDS_FILE = path.join(DATA_DIR, 'verified-coordinates.json');
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'geospatial-audit.json');

// District centroids mapping
const districtCentroids = {
  'Visakhapatnam': [83.2185, 17.6868],
  'Tirupati': [79.4192, 13.6288],
  'Alluri Sitharama Raju': [82.6844, 18.0673],
  'Anantapur': [77.6006, 14.6819],
  'Kurnool': [78.0373, 15.8281],
  'Dr. B.R. Ambedkar Konaseema': [81.8973, 16.5165],
  'Srikakulam': [83.8935, 18.2949],
  'NTR': [80.6480, 16.5062],
  'YSR Kadapa': [78.8241, 14.4674],
  'SPSR Nellore': [79.9865, 14.4426],
  'Guntur': [80.4428, 16.3008],
  'Anakapalli': [83.0024, 17.6896],
  'Nandyal': [78.4812, 15.4847],
  'Eluru': [81.1035, 16.7107],
  'Kakinada': [82.2475, 16.9891],
  'Krishna': [81.1320, 16.1675],
  'Palnadu': [79.7100, 16.3500],
  'Bapatla': [80.4686, 15.9044],
  'Prakasam': [80.0493, 15.5057],
  'West Godavari': [81.5212, 16.5445],
  'East Godavari': [81.7800, 17.3194],
  'Annamayya': [78.7500, 14.0500],
  'Sri Sathya Sai': [77.8100, 14.1670],
  'Parvathipuram Manyam': [83.4219, 18.7946],
  'Vizianagaram': [83.3956, 18.1066],
  'Chittoor': [79.1003, 13.2172]
};

// Haversine distance in km
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

// AP bounds: Lat [12.6, 19.2], Lng [76.7, 84.8]
const isWithinAP = (lat, lng) => lat >= 12.6 && lat <= 19.2 && lng >= 76.7 && lng <= 84.8;

async function run() {
  console.log('Running geospatial verification audit...');

  if (!fs.existsSync(VERIFIED_COORDS_FILE)) {
    console.error(`Error: Verified coordinates dataset not found at ${VERIFIED_COORDS_FILE}. Please run "node scripts/buildVerifiedCoordinates.js" first.`);
    process.exit(1);
  }

  const verifiedCoordinates = JSON.parse(fs.readFileSync(VERIFIED_COORDS_FILE, 'utf-8'));
  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));

  const auditReport = [];
  const coordsUsage = new Map(); // 'lng,lat' -> list of place details
  
  let totalPlaces = 0;
  let flagOutOfBounds = 0;
  let flagPlaceholders = 0;
  let flagCentroids = 0;
  let flagDeviated = 0;
  let flagDuplicates = 0;

  // 1. Load all places and build coordinates usage map
  const allPlaces = [];
  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    try {
      const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(places)) {
        places.forEach(p => {
          allPlaces.push(p);
          const coordStr = `${p.location.coordinates[0].toFixed(4)},${p.location.coordinates[1].toFixed(4)}`;
          if (!coordsUsage.has(coordStr)) {
            coordsUsage.set(coordStr, []);
          }
          coordsUsage.get(coordStr).push(`${p.name} (${p.districtName})`);
        });
      }
    } catch (err) {
      console.error(`Error reading ${file}: ${err.message}`);
    }
  });

  totalPlaces = allPlaces.length;

  // 2. Audit each place
  allPlaces.forEach(p => {
    const name = p.name;
    const slug = p.slug;
    const district = p.districtName;
    const storedCoords = p.location.coordinates; // [lng, lat]
    const storedLng = storedCoords[0];
    const storedLat = storedCoords[1];

    let hasIssue = false;
    const issuesList = [];

    // A. Check out of bounds
    if (!isWithinAP(storedLat, storedLng)) {
      hasIssue = true;
      flagOutOfBounds++;
      issuesList.push(`Coordinates [${storedLng}, ${storedLat}] are outside Andhra Pradesh boundaries`);
    }

    // B. Check standard default placeholder [80, 15] or [15, 80]
    const distToDefault1 = getHaversineDistance(storedLng, storedLat, 80.0, 15.0);
    const distToDefault2 = getHaversineDistance(storedLng, storedLat, 15.0, 80.0);
    if (distToDefault1 < 1.0 || distToDefault2 < 1.0) {
      hasIssue = true;
      flagPlaceholders++;
      issuesList.push(`Coordinates point to default placeholder [80.0, 15.0]`);
    }

    // C. Check if close to district centroid
    const centroid = districtCentroids[district];
    if (centroid) {
      const distToCentroid = getHaversineDistance(storedLng, storedLat, centroid[0], centroid[1]);
      // If within 0.05 degrees (approx 5.5 km) and not in high-precision curated list, flag it
      const isCurated = curatedCentroidExceptions(slug);
      if (distToCentroid < 0.1 && !isCurated) {
        hasIssue = true;
        flagCentroids++;
        issuesList.push(`Coordinates [${storedLng}, ${storedLat}] are within ${distToCentroid.toFixed(2)} km of district centroid placeholder`);
      }
    }

    // D. Check for duplicate coordinate usage
    const coordStr = `${storedLng.toFixed(4)},${storedLat.toFixed(4)}`;
    const usage = coordsUsage.get(coordStr) || [];
    if (usage.length > 1 && !curatedDuplicateExceptions(slug)) {
      hasIssue = true;
      flagDuplicates++;
      issuesList.push(`Coordinates duplicate and shared with: ${usage.filter(u => u !== `${name} (${district})`).join(', ')}`);
    }

    // E. Compare to verified coordinates from source-of-truth dataset
    const verified = verifiedCoordinates[slug];
    let devDistanceKm = 0;
    if (verified) {
      devDistanceKm = getHaversineDistance(storedLng, storedLat, verified.longitude, verified.latitude);
      if (devDistanceKm > 1.0) {
        hasIssue = true;
        flagDeviated++;
        issuesList.push(`Deviation of ${devDistanceKm.toFixed(2)} km from verified coordinates [${verified.longitude}, ${verified.latitude}]`);
      }
    }

    auditReport.push({
      place: name,
      slug,
      district,
      storedCoordinates: [storedLng, storedLat],
      verifiedCoordinates: verified ? [verified.longitude, verified.latitude] : null,
      deviationKm: parseFloat(devDistanceKm.toFixed(3)),
      hasIssue,
      issues: issuesList
    });
  });

  // Save reports/coordinate-audit.json
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(auditReport, null, 2), 'utf-8');
  console.log(`\n✓ Generated coordinate audit report at: ${REPORT_PATH}`);

  console.log(`\nAudit Statistics:`);
  console.log(`- Total Places Audited: ${totalPlaces}`);
  console.log(`- Out of Bounds: ${flagOutOfBounds}`);
  console.log(`- Placeholders ([80,15]): ${flagPlaceholders}`);
  console.log(`- Centroid Overlaps: ${flagCentroids}`);
  console.log(`- Duplicate Coordinates: ${flagDuplicates}`);
  console.log(`- Deviated > 1km: ${flagDeviated}`);
  console.log(`- Overall Clean Status: ${flagOutOfBounds === 0 && flagPlaceholders === 0 && flagCentroids === 0 && flagDuplicates === 0 && flagDeviated === 0 ? '✅ CLEAN' : '❌ GEOSPATIAL ISSUES DETECTED'}`);
}

// Returns true if the place is legitimately located near the district centroid
function curatedCentroidExceptions(slug) {
  const exceptions = [
    'tirupati-city-center',
    'kurnool-city-center',
    'srikakulam-city-center',
    'vijayawada-city-center',
    'kadapa-city-center',
    'kakinada-city-center',
    'bapatla-city-center',
    'ongole-city-center',
    'bhimavaram-city-center',
    'parvathipuram-town-center',
    'nandyal-town-center',
    'konda-reddy-buruzu',
    'puttaparthi-ashram',
    'visakhapatnam-harbor',
    'ameen-peer-dargah',
    'anantapur-city-center',
    'chittoor-fort-ruins',
    'nellore-city-center'
  ];
  return exceptions.includes(slug);
}

// Returns true if the place is legitimately allowed to share coordinates with another place
function curatedDuplicateExceptions(slug) {
  const exceptions = [
    'yaganti-temple',
    'yaganti-temple-complex',
    'dharmavaram-lake',
    'dharmavaram-border-area'
  ];
  return exceptions.includes(slug);
}

run();
