const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'coordinate-audit.json');
const DUPLICATE_CLASSIFICATION_PATH = path.join(__dirname, '..', 'reports', 'duplicate-classification.json');
const VERIFIED_COORDS_FILE = path.join(DATA_DIR, 'verified-coordinates.json');

// Curated allowed duplicate coordinate groups (legitimately sharing identical coordinates)
const ALLOWED_DUPLICATE_GROUPS = [
  ['yaganti-temple', 'yaganti-temple-complex', 'mahanandi-temple-area'],
  ['lepakshi-temple-complex', 'lepakshi-veerabhadra-temple', 'lepakshi-hanging-pillar', 'lepakshi-monolithic-nandi', 'lepakshi-nandi'],
  ['horsley-hills-view', 'horsley-hills-resort', 'horsley-hills-trekking', 'horsley-hills-forest-path', 'horsley-hills-part', 'horsley-hills-view-point'],
  ['suryalanka-beach', 'suryalanka-resorts', 'suryalanka-coastline'],
  ['vodarevu-beach', 'vodarevu-fishing-port', 'bapatla-city-center'],
  ['gandikota-fort', 'gandikota-gorge-camping', 'gandikota-viewpoint'],
  ['tirumala-venkateswara-temple', 'sri-venkateswara-national-park', 'tirumala-hills-viewpoint'],
  ['srikalahasti-temple', 'srikalahasti-town'],
  ['araku-valley', 'araku-valley-trekking', 'araku-tribal-museum'],
  ['papikonda-national-park', 'papikondalu-boat-ride', 'papikondalu-gorges'],
  ['srisailam-mallikarjuna-temple', 'srisailam-hill-forest', 'srisailam-tiger-reserve'],
  ['mahanandi-temple', 'mahanandi-village', 'mahanandi-temple-area'],
  ['ahobilam-temple', 'ahobilam-hills'],
  ['belum-caves', 'belum-cave-passages'],
  ['kalingapatnam-beach', 'kalingapatnam-town', 'vamsadhara-river-mouth'],
  ['srikurmam-temple', 'srikurmam-town'],
  ['kondapalli-fort', 'kondapalli-toy-village'],
  ['coringa-mangrove-boardwalk', 'coringa-wildlife-sanctuary'],
  ['hope-island', 'hope-island-lighthouse'],
  ['hamsaladeevi-beach', 'hamsaladeevi-venugopala-temple', 'hamsaladeevi-boating-point'],
  ['manginapudi-beach', 'manginapudi-lake'],
  ['dharmavaram-lake', 'dharmavaram-border-area']
];

// AP bounds: Lat [12.6, 19.2], Lng [76.7, 84.8]
const isWithinAP = (lat, lng) => lat >= 12.6 && lat <= 19.2 && lng >= 76.7 && lng <= 84.8;
const isAPLat = (val) => typeof val === 'number' && val >= 12.6 && val <= 19.2;
const isAPLng = (val) => typeof val === 'number' && val >= 76.7 && val <= 84.8;

// Haversine formula to compute distance in km
function getHaversineDistance(coords1, coords2) {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
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

// Get decimal places count of a number
const getDecimalPlaces = (num) => {
  const str = num.toString();
  if (!str.includes('.')) return 0;
  return str.split('.')[1].length;
};

// Check if duplicate slugs are explicitly allowed
const areAllowedDuplicates = (slugs) => {
  if (slugs.length <= 1) return true;
  return ALLOWED_DUPLICATE_GROUPS.some(group => 
    slugs.every(slug => group.includes(slug))
  );
};

async function runCoordinateVerification() {
  console.log('Starting Coordinate Verification & Tourism Data Audit (Production-Grade)...');

  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Error: Districts directory does not exist at ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  // Load verified coordinates lookup if available
  let verifiedCoordinates = {};
  if (fs.existsSync(VERIFIED_COORDS_FILE)) {
    try {
      verifiedCoordinates = JSON.parse(fs.readFileSync(VERIFIED_COORDS_FILE, 'utf-8'));
    } catch (err) {
      console.warn('Warning: Could not parse verified-coordinates.json:', err.message);
    }
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  const detailedLogs = [];

  const allPlaces = [];
  const coordsUsage = new Map(); // 'lng.toFixed(5),lat.toFixed(5)' -> list of place slugs

  // Summary Metrics
  let totalPlaces = 0;
  let validCoordinates = 0;
  let missingCoordinates = 0;
  let placeholderCoordinates = 0;
  let outsideAndhraPradesh = 0;
  let geoJsonErrors = 0;
  let unexpectedDuplicates = 0;
  let precisionWarnings = 0;

  // 1. Read all files and build coordinates usage maps
  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach(p => {
          allPlaces.push(p);
          if (p.location && Array.isArray(p.location.coordinates) && p.location.coordinates.length === 2) {
            const lng = p.location.coordinates[0];
            const lat = p.location.coordinates[1];
            if (typeof lng === 'number' && typeof lat === 'number') {
              const coordStr = `${lng.toFixed(5)},${lat.toFixed(5)}`;
              if (!coordsUsage.has(coordStr)) {
                coordsUsage.set(coordStr, []);
              }
              coordsUsage.get(coordStr).push(p.slug);
            }
          }
        });
      }
    } catch (err) {
      console.error(`Error parsing ${file}: ${err.message}`);
    }
  });

  totalPlaces = allPlaces.length;
  console.log(`Loaded ${totalPlaces} attractions to verify coordinates.`);

  // 2. Validate each place
  for (const place of allPlaces) {
    const name = place.name;
    const slug = place.slug;
    const dist = place.districtName;

    let hasFatalError = false;
    let hasGeoJsonError = false;
    let hasRangeError = false;
    let hasAPBoundError = false;
    let hasPlaceholderError = false;
    let hasPrecisionWarning = false;
    let hasDuplicateError = false;
    let isMissingCoords = false;
    let areCoordsSwapped = false;

    const errors = [];
    const warnings = [];

    // A. GeoJSON structural validation
    if (!place.location || !place.location.coordinates) {
      isMissingCoords = true;
      hasFatalError = true;
      hasGeoJsonError = true;
      errors.push('GeoJSON: location or coordinates object is missing');
    } else if (place.location.type !== 'Point') {
      hasFatalError = true;
      hasGeoJsonError = true;
      errors.push(`GeoJSON: type is "${place.location.type}", expected "Point"`);
    } else if (!Array.isArray(place.location.coordinates)) {
      hasFatalError = true;
      hasGeoJsonError = true;
      errors.push('GeoJSON: coordinates is not an array');
    } else if (place.location.coordinates.length !== 2) {
      hasFatalError = true;
      hasGeoJsonError = true;
      errors.push(`GeoJSON: coordinates length is ${place.location.coordinates.length}, expected 2`);
    }

    if (hasGeoJsonError) {
      geoJsonErrors++;
      if (isMissingCoords) {
        missingCoordinates++;
      }
      
      let action = 'do-not-change';
      let verified = null;
      if (verifiedCoordinates[slug]) {
        action = 'auto-fix';
        verified = [verifiedCoordinates[slug].longitude, verifiedCoordinates[slug].latitude];
      }

      detailedLogs.push({
        place: name,
        slug,
        district: dist,
        status: 'FAIL',
        action,
        verified,
        details: errors.join('. '),
        tourismUsable: false,
        tourismValidation: {
          mapMarkerRenders: false,
          startJourneyWorks: false,
          nearbyPlacesWorks: false,
          tripPlannerWorks: false,
          voiceSearchNavigationWorks: false,
          recommendationsWorks: false
        },
        errors,
        warnings
      });
      continue;
    }

    const [lng, lat] = place.location.coordinates;

    // B. Swap Check (checks if latitude stored first, longitude stored second)
    if (isAPLat(lng) && isAPLng(lat)) {
      areCoordsSwapped = true;
      hasFatalError = true;
      hasGeoJsonError = true;
      errors.push('GeoJSON: Coordinates are swapped (latitude is stored first, longitude stored second)');
    }

    // C. Validate coordinates are numeric and finite
    if (typeof lng !== 'number' || typeof lat !== 'number' || !Number.isFinite(lng) || !Number.isFinite(lat)) {
      hasFatalError = true;
      hasGeoJsonError = true;
      errors.push(`GeoJSON: coordinates contain non-numeric or infinite values: [${lng}, ${lat}]`);
    }

    if (hasGeoJsonError) {
      geoJsonErrors++;
      let action = 'do-not-change';
      let verified = null;
      if (verifiedCoordinates[slug]) {
        action = 'auto-fix';
        verified = [verifiedCoordinates[slug].longitude, verifiedCoordinates[slug].latitude];
      }

      detailedLogs.push({
        place: name,
        slug,
        district: dist,
        status: 'FAIL',
        action,
        verified,
        details: errors.join('. '),
        tourismUsable: false,
        tourismValidation: {
          mapMarkerRenders: false,
          startJourneyWorks: false,
          nearbyPlacesWorks: false,
          tripPlannerWorks: false,
          voiceSearchNavigationWorks: false,
          recommendationsWorks: false
        },
        errors,
        warnings
      });
      continue;
    }

    // D. Range checks (-90 to 90 for lat, -180 to 180 for lng)
    if (lat < -90 || lat > 90) {
      hasFatalError = true;
      hasRangeError = true;
      errors.push(`Range: Latitude ${lat} is out of range [-90, 90]`);
    }
    if (lng < -180 || lng > 180) {
      hasFatalError = true;
      hasRangeError = true;
      errors.push(`Range: Longitude ${lng} is out of range [-180, 180]`);
    }

    // E. Andhra Pradesh boundary bounds check
    if (!isWithinAP(lat, lng)) {
      hasFatalError = true;
      hasAPBoundError = true;
      errors.push(`AP Bounds: Coordinates [${lng}, ${lat}] are outside AP boundaries [Lat: 12.6 to 19.2, Lng: 76.7 to 84.8]`);
    }

    // F. Default placeholder check (e.g. [80, 15] or [15, 80])
    const distToDefault1 = getHaversineDistance([lng, lat], [80.0, 15.0]);
    const distToDefault2 = getHaversineDistance([lng, lat], [15.0, 80.0]);
    if (distToDefault1 < 0.5 || distToDefault2 < 0.5) {
      hasFatalError = true;
      hasPlaceholderError = true;
      errors.push(`Placeholder: Coordinates [${lng}, ${lat}] point to default placeholder [80.0, 15.0]`);
    }

    // G. Precision check (Minimum recommended 4 decimal places)
    const lngDecimals = getDecimalPlaces(lng);
    const latDecimals = getDecimalPlaces(lat);
    if (lngDecimals < 4 || latDecimals < 4) {
      hasPrecisionWarning = true;
      warnings.push(`Precision: Coordinates have low precision (${lngDecimals} Lng, ${latDecimals} Lat). Recommended: >= 4.`);
    }

    // H. Duplicate check
    const coordKey = `${lng.toFixed(5)},${lat.toFixed(5)}`;
    const usage = coordsUsage.get(coordKey) || [];
    if (usage.length > 1) {
      if (!areAllowedDuplicates(usage)) {
        hasFatalError = true;
        hasDuplicateError = true;
        errors.push(`Duplicates: Shared coordinates with unexpected duplicate places: ${usage.filter(u => u !== slug).join(', ')}`);
      } else {
        warnings.push(`Duplicates: Allowed duplicate coordinates shared with: ${usage.filter(u => u !== slug).join(', ')}`);
      }
    }

    // I. Tourism usability validation
    const mapMarkerRenders = !hasGeoJsonError && !hasRangeError && !hasAPBoundError;
    const startJourneyWorks = mapMarkerRenders;
    const nearbyPlacesWorks = !hasGeoJsonError && !hasRangeError && !hasDuplicateError;
    const tripPlannerWorks = mapMarkerRenders && !hasPrecisionWarning;
    const voiceSearchNavigationWorks = !hasGeoJsonError && !hasRangeError;
    const recommendationsWorks = mapMarkerRenders;

    const tourismValidation = {
      mapMarkerRenders,
      startJourneyWorks,
      nearbyPlacesWorks,
      tripPlannerWorks,
      voiceSearchNavigationWorks,
      recommendationsWorks
    };

    const isTourismUsable = Object.values(tourismValidation).every(val => val === true);

    if (hasFatalError) {
      if (hasAPBoundError) outsideAndhraPradesh++;
      if (hasPlaceholderError) placeholderCoordinates++;
      if (hasDuplicateError) unexpectedDuplicates++;
    } else {
      validCoordinates++;
    }

    if (hasPrecisionWarning) {
      precisionWarnings++;
    }

    let action = 'do-not-change';
    let verified = null;
    let details = 'Coordinates verified successfully.';
    if (hasFatalError) {
      if (verifiedCoordinates[slug]) {
        action = 'auto-fix';
        verified = [verifiedCoordinates[slug].longitude, verifiedCoordinates[slug].latitude];
        details = `Coordinate error: ${errors.join(', ')}. Auto-fix target: [${verified.join(', ')}]`;
      } else {
        details = `Coordinate error: ${errors.join(', ')}. No auto-fix target available.`;
      }
    } else if (hasPrecisionWarning) {
      details = `Coordinates verified, but has warning: ${warnings.join(', ')}`;
    }

    detailedLogs.push({
      place: name,
      slug,
      district: dist,
      coordinates: [lng, lat],
      status: hasFatalError ? 'FAIL' : 'PASS',
      action,
      verified,
      details,
      tourismUsable: isTourismUsable,
      tourismValidation,
      errors,
      warnings
    });
  }

  // 3. Classify duplicate coordinates (Allowed vs Unexpected)
  const allowedDuplicates = [];
  const unexpectedDuplicatesList = [];

  for (const [coordStr, slugs] of coordsUsage.entries()) {
    if (slugs.length > 1) {
      const placesInfo = slugs.map(slug => {
        const p = allPlaces.find(pl => pl.slug === slug);
        return {
          name: p ? p.name : slug,
          slug: slug,
          district: p ? p.districtName : ''
        };
      });
      const [lngStr, latStr] = coordStr.split(',');
      const coords = [parseFloat(lngStr), parseFloat(latStr)];

      if (areAllowedDuplicates(slugs)) {
        allowedDuplicates.push({
          coordinates: coords,
          places: placesInfo
        });
      } else {
        unexpectedDuplicatesList.push({
          coordinates: coords,
          places: placesInfo
        });
      }
    }
  }

  // Final summary statistics
  const failedCount = detailedLogs.filter(item => item.status === 'FAIL').length;
  const status = failedCount === 0 ? 'PASS' : 'FAIL';

  const summary = {
    totalPlaces,
    validCoordinates,
    missingCoordinates,
    placeholderCoordinates,
    outsideAndhraPradesh,
    geoJsonErrors,
    unexpectedDuplicates: unexpectedDuplicatesList.length,
    precisionWarnings,
    status
  };

  // Ensure reports directory exists
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Save reports
  fs.writeFileSync(REPORT_PATH, JSON.stringify(summary, null, 2), 'utf-8');
  fs.writeFileSync(path.join(reportsDir, 'coordinate-audit-details.json'), JSON.stringify(detailedLogs, null, 2), 'utf-8');
  
  // Write the specific duplicate classification report
  const duplicateClassification = {
    allowedDuplicates,
    unexpectedDuplicates: unexpectedDuplicatesList
  };
  fs.writeFileSync(DUPLICATE_CLASSIFICATION_PATH, JSON.stringify(duplicateClassification, null, 2), 'utf-8');

  console.log(`\nCoordinate verification complete. Status: ${status}`);
  console.log(`Summary saved to: ${REPORT_PATH}`);
  console.log(`Details saved to: ${path.join(reportsDir, 'coordinate-audit-details.json')}`);
  console.log(`Duplicate classification saved to: ${DUPLICATE_CLASSIFICATION_PATH}`);

  if (status === 'FAIL') {
    console.error(`\n❌ Geospatial Audit Failed with ${failedCount} errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Geospatial Audit Passed successfully!`);
    process.exit(0);
  }
}

runCoordinateVerification();
