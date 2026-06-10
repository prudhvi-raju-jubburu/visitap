const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const VERIFIED_COORDS_FILE = path.join(DATA_DIR, 'verified-coordinates.json');

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

// Curated verified overrides [longitude, latitude]
const curatedOverrides = {
  // Sri Sathya Sai & Anantapur Temple mismatches
  'lepakshi-veerabhadra-temple': [77.8062, 13.8021],
  'lepakshi-monolithic-nandi': [77.8080, 13.8010],
  'lepakshi-nandi': [77.6122, 13.8037],
  'lepakshi-hanging-pillar': [77.8062, 13.8021],
  'lepakshi-temple-complex': [77.8062, 13.8021],
  'puttaparthi-ashram': [77.8106, 14.1664],
  'puttaparthi-planetarium': [77.8100, 14.1650],
  'puttaparthi-chaitanya-jyoti': [77.7795, 14.1388],
  'dharmavaram-border-area': [77.7832, 14.1679],
  'puttaparthi-super-hospital': [77.8346, 14.1498],
  'puttaparthi-hill-view': [77.8299, 14.1382],
  
  // Chittoor
  'kaundinya-wildlife-sanctuary': [78.75, 13.0],
  'kaundinya-elephant-camps': [78.58, 13.05],
  'kaundinya-forest-trekking': [78.62, 13.12],
  'chittoor-fort-ruins': [79.0624, 13.2563],
  'chittoor-hills-path': [79.0931, 13.1839],
  'chittoor-mango-markets': [79.1052, 13.1983],
  'kanipakam-temple-tank': [79.0270, 13.2536],
  'kanipakam-varasiddhi-temple': [79.0975, 13.2036],
  'ardhagiri-veeranjaneya-temple': [79.0912, 13.1920],
  'chittoor-hills': [79.1003, 13.2172],
  
  // Annamayya
  'tallapaka-poet-village': [78.97, 14.23],
  'annamacharya-memorial': [78.97, 14.23],
  'gurramkonda-fort-borders': [78.58, 13.78],
  'gurramkonda-fort': [78.58, 13.78],
  'sompalem-chennakesava-temple': [78.27, 13.86],
  'horsley-hills-trekking': [78.3972, 13.6492],
  'horsley-hills-forest-path': [78.3972, 13.6492],
  'horsley-hills-view': [78.3972, 13.6492],
  'horsley-hills-resort': [78.4000, 13.6500],
  'madanapalle-town-center': [78.5015, 13.5558],
  'kalyani-dam-reservoir': [79.2800, 13.6300],

  // Bapatla
  'suryalanka-beach': [80.5211, 15.8453],
  'suryalanka-resorts': [80.5211, 15.8453],
  'suryalanka-coastline': [80.5211, 15.8453],
  'vodarevu-beach': [80.4686, 15.9044],
  'vodarevu-fishing-port': [80.4686, 15.9044],
  'bapatla-bhavanarayana-temple': [80.4678, 15.9038],
  'bhavanarayana-temple-tanks': [80.4678, 15.9038],
  'chirala-weaving-hub': [80.35, 15.82],
  'chirala-beach-point': [80.35, 15.82],
  'bapatla-city-center': [80.4686, 15.9044],

  // Konaseema
  'dindi-backwaters': [81.8617, 16.5411],
  'konaseema-houseboats': [81.8748, 16.4878],
  'vashishta-godavari-river-confluence': [81.8886, 16.5317],
  'mamikuduru-wetlands': [81.8939, 16.529],
  'antarvedi-beach': [81.9234, 16.4962],
  'ainavilli-vinayaka-temple': [81.8577, 16.5352],
  'peruru-heritage-village': [81.8896, 16.5386],
  'razole-town': [81.8706, 16.4777],
  'ryali-jaganmohini-temple': [81.9102, 16.4886],
  'antarvedi-lakshmi-narasimha-temple': [81.9219, 16.5031],

  // Kakinada
  'coringa-mangrove-boardwalk': [82.2619, 16.9038],
  'hope-island-lighthouse': [82.34, 16.95],
  'hope-island': [82.3627, 16.9236],
  'coringa-wildlife-sanctuary': [82.2517, 17.0121],
  'kakinada-beach': [82.2930, 17.0236],
  'annavaram-satyanarayana-temple': [82.2227, 16.9501],
  'annavaram-hills': [82.5085, 17.2811],
  'pithapuram-temple': [82.2568, 17.1147],
  'uppada-beach': [82.3297, 17.0603],
  'kakinada-city-center': [82.2475, 16.9891],

  // Krishna
  'machilipatnam-kalamkari-town': [81.13, 16.18],
  'machilipatnam-port-town': [81.14, 16.17],
  'hamsaladeevi-venugopala-temple': [81.0927, 16.1915],
  'hamsaladeevi-boating-point': [81.0929, 16.1707],
  'manginapudi-lake': [81.1139, 16.1787],
  'krishna-river-delta': [81.1051, 16.14],
  'manginapudi-beach': [81.2417, 16.1972],
  'hamsaladeevi-beach': [81.0858, 15.9525],
  'kuchipudi-dance-academy': [80.7936, 16.1867],
  'bandar-fort-ruins': [81.1667, 16.1833],

  // Prakasam
  'markapur-slate-industry': [80.0104, 15.5084],
  'singarayakonda-hilltop-view': [80.0397, 15.5227],
  'ongole-bull-farm': [80.0298, 15.5049],
  'cumbum-dam': [80.0528, 15.5174],
  'cumbum-lake': [79.1122, 15.5786],
  'markapur-chennakesava-temple': [79.2711, 15.7369],
  'singarayakonda-temple': [80.0381, 15.2589],
  'kothapatnam-beach': [80.1200, 15.4800],

  // Nellore
  'pulicat-lagoon-boating': [80.05, 13.6833],
  'nelapattu-wetlands': [79.9708, 13.8406],
  'pulicat-lake-sanctuary': [80.0500, 13.6833],
  'nelapattu-bird-sanctuary': [79.9708, 13.8406],
  'mypadu-beach': [80.1802, 14.5098],
  'udayagiri-fort': [79.2908, 14.8692],
  'penchalakona-temple': [79.4600, 14.3000],
  'nellore-city-center': [79.9739, 14.4483],
  'jonnavada-temple': [79.9557, 14.4197],
  'venkatagiri-weaving-town': [79.9617, 14.4599],

  // West Godavari & East Godavari
  'somarama-temple-tank': [81.53, 16.54],
  'ksheerarama-gopuram': [81.72, 16.52],
  'narsapur-lace-industry': [81.5158, 16.5352],
  'godavari-delta-canals': [81.4899, 16.5172],
  'somarama-temple': [81.5333, 16.5417],
  'ksheerarama-temple': [81.7289, 16.5208],
  'bhimavaram-city-center': [81.5212, 16.5445],
  'kolleru-wetlands': [81.2500, 16.6333],
  'palakollu-town': [81.7300, 16.5200],
  'perupalem-beach': [81.6000, 16.3500],
  
  // Gandikota & YSR Kadapa
  'gandikota-gorge-camping': [78.288, 14.816],
  'gandikota-viewpoint': [78.29, 14.82],
  'lakkireddipalli-hills': [78.7, 14.1667],
  'pushpagiri-temple-complex': [78.819, 14.4445],
  'gandikota-fort': [78.2866, 14.8154],
  'vontimitta-kodandarama-temple': [78.9667, 14.3833],
  'siddavatam-fort': [78.9833, 14.4500],
  'brahmamgari-matham': [78.8500, 14.7800],
  'kadapa-city-center': [78.8241, 14.4674],
  'ameen-peer-dargah': [78.8200, 14.4700],

  // Extra generic place overrides to avoid mismatches
  'eluru-city-center': [81.1035, 16.7107],
  'guntur-city-center': [80.4428, 16.3008],
  'vizianagaram-market': [83.3956, 18.1066],
  'visakhapatnam-harbor': [83.2985, 17.6912],
  'parvathipuram-town-center': [83.4219, 18.7946],
  'vijayawada-city-center': [80.6480, 16.5062],
  'karempudi-town': [79.6804, 16.3690],
  'srikakulam-city-center': [83.8935, 18.2949],
  'anakapalli-town-center': [83.0024, 17.6896],
  'anantapur-city-center': [77.6006, 14.6819],
  'nandyal-town-center': [78.4812, 15.4847],
  'kadapa-city-center': [78.8241, 14.4674],
  'kakinada-city-center': [82.2475, 16.9891],
  'bapatla-city-center': [80.4686, 15.9044],
  'ongole-city-center': [80.0493, 15.5057],
  'bhimavaram-city-center': [81.5212, 16.5445],
  'rajahmundry-city-center': [81.7775, 17.3592]
};

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

// Delays loop execution by a set number of ms
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// OpenStreetMap Nominatim request with User-Agent
function fetchGeocodeFromOSM(query) {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const options = {
      headers: {
        'User-Agent': 'VisitAPGeospatialAudit/1.0'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed && parsed.length > 0 ? parsed[0] : null);
        } catch (err) {
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

const isWithinAP = (lat, lng) => lat >= 12.6 && lat <= 19.2 && lng >= 76.7 && lng <= 84.8;

// Returns a list of candidate queries for OSM search
function getSearchQueries(name, districtName) {
  const queries = [];
  let cleanName = name;
  const distPrefix = new RegExp(`^${districtName}\\s+`, 'i');
  cleanName = cleanName.replace(distPrefix, '');
  
  if (cleanName.toLowerCase().includes('kaundinya')) {
    cleanName = cleanName.replace(/kaundinya/gi, 'Koundinya');
  }

  let simplifiedName = cleanName
    .replace(/Caves/gi, '')
    .replace(/Cave/gi, '')
    .replace(/Stupas/gi, '')
    .replace(/Stupa/gi, '')
    .replace(/Lake/gi, '')
    .replace(/Forest/gi, '')
    .replace(/Temples/gi, '')
    .replace(/Temple/gi, '')
    .replace(/Fort/gi, '')
    .replace(/Waterfalls/gi, '')
    .replace(/Waterfall/gi, '')
    .replace(/Beach/gi, '')
    .replace(/Valley/gi, '')
    .replace(/National Park/gi, '')
    .replace(/borders/gi, '')
    .replace(/border/gi, '')
    .replace(/pathlands/gi, '')
    .replace(/path/gi, '')
    .replace(/trekking/gi, '')
    .replace(/boating point/gi, '')
    .replace(/boating/gi, '')
    .replace(/boat ride/gi, '')
    .replace(/fishing port/gi, '')
    .replace(/tanks/gi, '')
    .replace(/tank/gi, '')
    .replace(/town center/gi, '')
    .replace(/city center/gi, '')
    .replace(/forest reserve/gi, '')
    .replace(/reserve/gi, '')
    .replace(/museum/gi, '')
    .replace(/birding/gi, '')
    .replace(/riverfront/gi, '')
    .replace(/resorts/gi, '')
    .replace(/resort/gi, '')
    .replace(/coastline/gi, '')
    .replace(/beach point/gi, '')
    .replace(/elephant camps/gi, '')
    .replace(/forest trekking/gi, '')
    .replace(/fort ruins/gi, '')
    .replace(/ruins/gi, '')
    .replace(/hilltop viewpoint/gi, '')
    .replace(/viewpoint/gi, '')
    .replace(/view/gi, '')
    .trim();

  queries.push(`${cleanName}, ${districtName} District, Andhra Pradesh, India`);
  queries.push(`${cleanName}, ${districtName}, Andhra Pradesh, India`);
  
  if (cleanName !== name) {
    queries.push(`${cleanName}, Andhra Pradesh, India`);
  }
  
  if (simplifiedName && simplifiedName !== cleanName && simplifiedName.length > 2) {
    queries.push(`${simplifiedName}, ${districtName}, Andhra Pradesh, India`);
    queries.push(`${simplifiedName}, Andhra Pradesh, India`);
  }

  queries.push(`${cleanName}, Andhra Pradesh, India`);
  queries.push(`${simplifiedName || cleanName}, India`);

  return [...new Set(queries)];
}

async function repair() {
  console.log('Starting Geospatial Repair...');

  if (!fs.existsSync(VERIFIED_COORDS_FILE)) {
    console.error(`Verified coordinates file not found. Let's create an empty one first.`);
    fs.writeFileSync(VERIFIED_COORDS_FILE, '{}', 'utf-8');
  }

  const verifiedCoordinates = JSON.parse(fs.readFileSync(VERIFIED_COORDS_FILE, 'utf-8'));
  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));

  const allPlaces = [];
  const coordsUsage = new Map();

  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    try {
      const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(places)) {
        places.forEach(p => {
          allPlaces.push(p);
          const current = verifiedCoordinates[p.slug] || { longitude: p.location.coordinates[0], latitude: p.location.coordinates[1] };
          const coordStr = `${current.longitude.toFixed(4)},${current.latitude.toFixed(4)}`;
          if (!coordsUsage.has(coordStr)) {
            coordsUsage.set(coordStr, []);
          }
          coordsUsage.get(coordStr).push(p.slug);
        });
      }
    } catch (err) {
      console.error(`Error reading ${file}: ${err.message}`);
    }
  });

  console.log(`Loaded ${allPlaces.length} attractions.`);

  let fixCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < allPlaces.length; i++) {
    const place = allPlaces[i];
    const slug = place.slug;
    const name = place.name;
    const districtName = place.districtName;
    const stored = place.location.coordinates; // [lng, lat]

    // Determine current coordinate values (prefer verified-coordinates.json if exists)
    let currentLng = stored[0];
    let currentLat = stored[1];
    if (verifiedCoordinates[slug]) {
      currentLng = verifiedCoordinates[slug].longitude;
      currentLat = verifiedCoordinates[slug].latitude;
    }

    // Check if this coordinate needs repair
    let needsRepair = false;
    let reason = '';

    // Check A: Centroid overlap (within 6km of any district centroid)
    const centroid = districtCentroids[districtName];
    if (centroid) {
      const distToCentroid = getHaversineDistance(currentLng, currentLat, centroid[0], centroid[1]);
      const exceptions = [
        'tirupati-city-center', 'kurnool-city-center', 'srikakulam-city-center',
        'vijayawada-city-center', 'kadapa-city-center', 'kakinada-city-center',
        'bapatla-city-center', 'ongole-city-center', 'bhimavaram-city-center',
        'parvathipuram-town-center', 'nandyal-town-center'
      ];
      if (distToCentroid < 6.0 && !exceptions.includes(slug)) {
        needsRepair = true;
        reason = `Centroid overlap (distance ${distToCentroid.toFixed(2)} km)`;
      }
    }

    // Check B: Duplicate coordinates check
    const coordStr = `${currentLng.toFixed(4)},${currentLat.toFixed(4)}`;
    const usage = coordsUsage.get(coordStr) || [];
    if (usage.length > 1 && !needsRepair) {
      needsRepair = true;
      reason = `Duplicate coordinates shared with: ${usage.filter(u => u !== slug).join(', ')}`;
    }

    // Check C: Out of bounds AP bounds
    if (!isWithinAP(currentLat, currentLng) && !needsRepair) {
      needsRepair = true;
      reason = `Out of AP bounds [${currentLng}, ${currentLat}]`;
    }

    if (!needsRepair) {
      // Already clean! Just write back to map
      verifiedCoordinates[slug] = {
        latitude: parseFloat(currentLat.toFixed(4)),
        longitude: parseFloat(currentLng.toFixed(4)),
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${parseFloat(currentLat.toFixed(4))},${parseFloat(currentLng.toFixed(4))}`
      };
      skippedCount++;
      continue;
    }

    console.log(`\n[REPAIR REQUIRED] ${i + 1}/${allPlaces.length}: "${name}" (${slug}) in ${districtName}. Reason: ${reason}`);

    // Resolve coordinates:
    let resolvedLng = null;
    let resolvedLat = null;
    let resolvedSource = '';

    // 1. Check curatedOverrides first
    if (curatedOverrides[slug]) {
      resolvedLng = curatedOverrides[slug][0];
      resolvedLat = curatedOverrides[slug][1];
      resolvedSource = 'curated-override';
      console.log(`  ✓ Resolved via Curated Override: [${resolvedLng}, ${resolvedLat}]`);
    } else {
      // 2. Query OSM Nominatim
      const candidateQueries = getSearchQueries(name, districtName);
      let osmResult = null;
      let usedQuery = '';

      for (let q = 0; q < candidateQueries.length; q++) {
        const query = candidateQueries[q];
        console.log(`  [OSM Query] Geocoding: "${query}"...`);
        await sleep(1000); // 1s rate limit
        const res = await fetchGeocodeFromOSM(query);
        if (res) {
          const latVal = parseFloat(res.lat);
          const lngVal = parseFloat(res.lon);
          if (isWithinAP(latVal, lngVal)) {
            // Distance check to district centroid
            if (centroid) {
              const dist = getHaversineDistance(lngVal, latVal, centroid[0], centroid[1]);
              const isGeneric = name.toLowerCase().includes('center') || name.toLowerCase().includes('town') || name.toLowerCase().includes('market') || name.toLowerCase().includes('parklands') || name.toLowerCase().includes('ghats') || name.toLowerCase().includes('temple tank') || name.toLowerCase().includes('riverfront');
              const limit = isGeneric ? 30.0 : 150.0;
              if (dist <= limit) {
                osmResult = res;
                usedQuery = query;
                break;
              } else {
                console.log(`    ⚠ Rejected: resolved coordinates are ${dist.toFixed(1)} km away from centroid (limit ${limit} km for generic name).`);
              }
            } else {
              osmResult = res;
              usedQuery = query;
              break;
            }
          }
        }
      }

      if (osmResult) {
        resolvedLat = parseFloat(osmResult.lat);
        resolvedLng = parseFloat(osmResult.lon);
        resolvedSource = `osm-resolved (${usedQuery})`;
        console.log(`  ✓ Resolved via OSM: [${resolvedLng}, ${resolvedLat}]`);
      } else {
        // 3. Fallback: use current but warn
        resolvedLng = currentLng;
        resolvedLat = currentLat;
        resolvedSource = 'fallback-unresolved';
        console.warn(`  [WARNING] Could not resolve coordinate for "${name}". Using current [${resolvedLng}, ${resolvedLat}].`);
      }
    }

    verifiedCoordinates[slug] = {
      latitude: parseFloat(resolvedLat.toFixed(4)),
      longitude: parseFloat(resolvedLng.toFixed(4)),
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${parseFloat(resolvedLat.toFixed(4))},${parseFloat(resolvedLng.toFixed(4))}`
    };
    fixCount++;
  }

  // Save back to verified-coordinates.json
  fs.writeFileSync(VERIFIED_COORDS_FILE, JSON.stringify(verifiedCoordinates, null, 2), 'utf-8');
  console.log(`\n✓ Geospatial Repair Complete!`);
  console.log(`- Clean places skipped: ${skippedCount}`);
  console.log(`- Places repaired: ${fixCount}`);
}

repair();
