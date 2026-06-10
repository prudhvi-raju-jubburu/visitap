const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const OUTPUT_FILE = path.join(DATA_DIR, 'verified-coordinates.json');

// Curated verified coordinates [longitude, latitude] for famous tourist places in Andhra Pradesh.
// These coordinates represent high-accuracy locations for tourist places.
const curatedCoordinates = {
  // Visakhapatnam
  'rk-beach': [83.3237, 17.7149],
  'rushikonda-beach': [83.3851, 17.7817],
  'yarada-beach': [83.2694, 17.6534],
  'bheemili-beach': [83.4542, 17.8902],
  'simhachalam-temple': [83.2506, 17.7669],
  'katiki-waterfalls': [83.0234, 18.1568],
  'tadimada-waterfalls': [82.9123, 18.2324],
  'kambalakonda-wildlife-sanctuary': [83.3385, 17.7915],
  'visakhapatnam-harbor': [83.2985, 17.6912],
  'simhachalam-hill-sanctuary': [83.2450, 17.7702],

  // Tirupati
  'tirumala-venkateswara-temple': [79.3500, 13.6833],
  'srikalahasti-temple': [79.6983, 13.7498],
  'chandragiri-fort': [79.3175, 13.6019],
  'talakona-waterfalls': [79.2151, 13.8034],
  'sri-venkateswara-national-park': [79.3500, 13.6700],
  'tirupati-city-center': [79.4192, 13.6288],
  'tirumala-hills-viewpoint': [79.3604, 13.6895],
  'srikalahasti-town': [79.7001, 13.7505],
  'kalyani-dam': [79.2804, 13.6308],
  'kapila-theertham': [79.4198, 13.6509],

  // Alluri Sitharama Raju
  'araku-valley': [82.8700, 18.2700],
  'lambasingi': [82.8122, 17.8117],
  'maredumilli-forest': [81.7167, 17.4333],
  'papikonda-national-park': [81.5000, 17.4000],
  'araku-valley-trekking': [82.8600, 18.2900],
  'papikondalu-boat-ride': [81.5100, 17.4100],
  'araku-tribal-museum': [82.8400, 18.2700],
  'lambasingi-tribal-area': [82.8200, 17.8200],
  'papikondalu-gorges': [81.5200, 17.4200],
  'borra-caves': [83.0385, 18.2813],

  // Nandyal
  'srisailam-mallikarjuna-temple': [78.8683, 16.0744],
  'ahobilam-temple': [78.7167, 15.1333],
  'mahanandi-temple': [78.6124, 15.4868],
  'srisailam-hill-forest': [78.8689, 16.0762],
  'srisailam-tiger-reserve': [78.8012, 16.0505],
  'nallamala-forest-trekking': [78.7304, 15.7205],
  'mahanandi-village': [78.6102, 15.4847],
  'ahobilam-hills': [78.7212, 15.1338],
  'nandyal-town-center': [78.4812, 15.4847],
  'yaganti-temple-complex': [78.1394, 15.3486],

  // Kurnool
  'yaganti-temple': [78.1394, 15.3486],
  'belum-caves': [78.1147, 15.1017],
  'konda-reddy-buruzu': [78.0373, 15.8281],
  'kurnool-fort-ruins': [78.0414, 15.8352],
  'orvakal-rock-garden': [78.0169, 15.6811],
  'kurnool-city-center': [78.0378, 15.8289],
  'rollapadu-bird-sanctuary': [78.3683, 15.7258],
  'tungabhadra-riverfront': [78.0556, 15.8451],
  'belum-cave-passages': [78.1171, 15.1032],
  'mahanandi-temple-area': [78.6112, 15.4875],

  // Srikakulam
  'arasavalli-sun-temple': [83.9015, 18.3039],
  'srikurmam-temple': [83.9839, 18.2706],
  'kalingapatnam-beach': [84.1264, 18.3414],
  'baruva-beach': [84.5888, 18.8824],
  'srimukhalingam-temple': [83.9634, 18.5954],
  'kalingapatnam-town': [84.1227, 18.3388],
  'vamsadhara-river-mouth': [84.1368, 18.3495],
  'srikakulam-city-center': [83.8935, 18.2949],
  'srikurmam-town': [83.9815, 18.2720],
  'sangam-shiva-temple': [83.8297, 18.6045],


  // NTR
  'kanaka-durga-temple': [80.6062, 16.5162],
  'prakasam-barrage': [80.6044, 16.5061],
  'bhavani-island': [80.5894, 16.5178],
  'kondapalli-fort': [80.5369, 16.6186],
  'undavalli-caves': [80.5794, 16.4922],
  'vijayawada-city-center': [80.6480, 16.5062],
  'kondapalli-toy-village': [80.5408, 16.6125],
  'indrakeeladri-hills': [80.6036, 16.5154],
  'prakasam-lakefront': [80.6005, 16.5039],
  'vijayawada-museum': [80.6296, 16.5194],

  // YSR Kadapa
  'gandikota-fort': [78.2866, 14.8154],
  'vontimitta-kodandarama-temple': [78.9667, 14.3833],
  'siddavatam-fort': [78.9833, 14.4500],
  'brahmamgari-matham': [78.8500, 14.7800],
  'gandikota-gorge-camping': [78.2880, 14.8160],
  'kadapa-city-center': [78.8241, 14.4674],
  'ameen-peer-dargah': [78.8200, 14.4700],
  'lakkireddipalli-hills': [78.7000, 14.1667],
  'gandikota-viewpoint': [78.2900, 14.8200],
  'pushpagiri-temple-complex': [78.8190, 14.4445],

  // Kakinada
  'coringa-mangrove-boardwalk': [82.2619, 16.9038],
  'kakinada-city-center': [82.2475, 16.9891],
  'annavaram-hills': [82.5085, 17.2811],
  'pithapuram-temple': [82.2568, 17.1147],
  'uppada-beach': [82.3297, 17.0603],
  'hope-island-lighthouse': [82.3400, 16.9500],

  // Krishna
  'manginapudi-beach': [81.2417, 16.1972],
  'hamsaladeevi-beach': [81.0858, 15.9525],
  'kuchipudi-dance-academy': [80.7936, 16.1867],
  'machilipatnam-kalamkari-town': [81.1300, 16.1800],
  'machilipatnam-port-town': [81.1400, 16.1700],
  'bandar-fort-ruins': [81.1667, 16.1833],

  // Bapatla
  'suryalanka-beach': [80.5211, 15.8453],
  'vodarevu-beach': [80.4686, 15.9044],
  'bapatla-city-center': [80.4686, 15.9044],
  'chirala-weaving-hub': [80.3500, 15.8200],

  // Prakasam
  'markapur-chennakesava-temple': [79.2687, 15.7358],
  'ongole-city-center': [80.0499, 15.5057],
  'singarayakonda-temple': [80.0381, 15.2589],
  'cumbum-lake': [79.1122, 15.5786],
  'kothapatnam-beach': [80.1784, 15.4836],
  'chirala-beach': [80.3639, 15.8128],
  'markapur-slate-industry': [79.2709, 15.7352],
  'singarayakonda-hilltop-view': [80.0279, 15.2517],
  'ongole-bull-farm': [80.0499, 15.5157],
  'cumbum-dam': [79.1138, 15.5814],


  // SPSR Nellore
  'pulicat-lake-sanctuary': [80.0500, 13.6833],
  'nelapattu-bird-sanctuary': [79.9708, 13.8406],
  'mypadu-beach': [80.1802, 14.5098],
  'udayagiri-fort': [79.2908, 14.8692],
  'penchalakona-temple': [79.4587, 14.3048],
  'jonnavada-temple': [79.9936, 14.5078],
  'nellore-city-center': [79.9865, 14.4426],
  'venkatagiri-weaving-town': [79.5818, 13.9615],
  'nellapattu-wetlands': [79.9754, 13.8452],
  'pulicat-lagoon-boating': [80.1615, 13.6712],


  // West Godavari
  'somarama-temple': [81.5333, 16.5417],
  'ksheerarama-temple': [81.7289, 16.5208],
  'bhimavaram-city-center': [81.5212, 16.5445],
  'kolleru-wetlands': [81.2500, 16.6333],
  'palakollu-town': [81.7300, 16.5200],
  'perupalem-beach': [81.6000, 16.3500],

  // East Godavari
  'godavari-river-rajahmundry': [81.7611, 17.0083],
  'somarama-temple-tank': [81.5300, 16.5400],
  'ksheerarama-gopuram': [81.7200, 16.5200],
  'dwaraka-tirumala-temple': [81.2558, 16.9458],

  // Annamayya
  'horsley-hills-view': [78.3972, 13.6492],
  'horsley-hills-resort': [78.4000, 13.6500],
  'tallapaka-poet-village': [78.9700, 14.2300],
  'gurramkonda-fort': [78.5800, 13.7800],
  'sompalem-chennakesava-temple': [78.2700, 13.8600],

  // Sri Sathya Sai
  'puttaparthi-ashram': [77.8106, 14.1664],
  'lepakshi-temple-complex': [77.6062, 13.8021],
  'puttaparthi-planetarium': [77.8100, 14.1650],
  'lepakshi-monolithic-nandi': [77.6080, 13.8010],
  'lepakshi-hanging-pillar': [77.6069, 13.8032],
  'pennar-riverbed': [77.8100, 14.1200],
  'puttaparthi-chaitanya-jyoti': [77.8118, 14.1677],
  'puttaparthi-hill-view': [77.8175, 14.1725],
  'dharmavaram-border-area': [77.7208, 14.4145],
  'puttaparthi-super-hospital': [77.8088, 14.1657],


  // Parvathipuram Manyam
  'thotapalli-barrage-project': [83.4703, 18.8129],
  'parvathipuram-town-center': [83.4257, 18.7832],
  'kurupam-palace-ruins': [83.4848, 18.8702],
  'kurupam-hills': [83.5450, 18.8680],
  'manyam-forest-reserves': [83.3800, 18.7600],
  'nagavali-river-banks': [83.4208, 18.8055],
  'nagavali-bridge': [83.4231, 18.8062],
  'parvathipuram-tribal-market': [83.4274, 18.7848],
  'thotapalli-reservoir': [83.4788, 18.8185],
  'thotapalli-parklands': [83.4721, 18.8146],

  // Vizianagaram
  'vizianagaram-fort': [83.4072, 18.1172],
  'rama-tirtham-temple': [83.4908, 18.1633],
  'kumili-temple-complex': [83.4500, 18.1000],

  // Chittoor
  'horsley-hills-part': [78.3972, 13.6492],
  'kanipakam-temple': [79.0270, 13.2536],
  'chittoor-hills': [79.1003, 13.2172],

  // Palnadu
  'nagarjuna-sagar-dam': [79.3124, 16.5757],
  'ethipothala-waterfalls-palnadu': [79.3183, 16.5847],
  'nagarjunakonda-island': [79.3178, 16.5382],
  'palnadu-battlefield-site': [79.7068, 16.5495],
  'ethipothala-valley-park': [79.3175, 16.5856],
  'nagarjuna-sagar-lake': [79.2950, 16.5665],
  'dachapalli-caves': [79.7385, 16.6165],
  'karempudi-town': [79.7027, 16.5468],
  'nagarjunasagar-boating-point': [79.3085, 16.5728],
  'guttikonda-bilam-caves': [79.7315, 16.6408]
};

// OpenStreetMap Nominatim request with User-Agent and retry capability
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

// Returns a list of candidate queries for OSM search
function getSearchQueries(name, districtName) {
  const queries = [];
  
  // Clean name: remove district prefix if any (e.g. "Bapatla Bhavanarayana Temple" -> "Bhavanarayana Temple")
  let cleanName = name;
  const distPrefix = new RegExp(`^${districtName}\\s+`, 'i');
  cleanName = cleanName.replace(distPrefix, '');
  
  // Specific spelling corrections
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

  // Try queries in order of specificity
  queries.push(`${cleanName}, ${districtName} District, Andhra Pradesh, India`);
  queries.push(`${cleanName}, ${districtName}, Andhra Pradesh, India`);
  
  if (cleanName !== name) {
    queries.push(`${cleanName}, Andhra Pradesh, India`);
  }
  
  if (simplifiedName && simplifiedName !== cleanName && simplifiedName.length > 2) {
    queries.push(`${simplifiedName}, ${districtName}, Andhra Pradesh, India`);
    queries.push(`${simplifiedName}, Andhra Pradesh, India`);
  }

  // Fallbacks using broad queries (validated by distance check later)
  queries.push(`${cleanName}, Andhra Pradesh, India`);
  queries.push(`${simplifiedName || cleanName}, India`);

  return [...new Set(queries)];
}

// Delays loop execution by a set number of ms
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('Compiling verified coordinates dataset...');
  
  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Error: Districts directory does not exist at ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  const allPlaces = [];

  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    try {
      const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(places)) {
        allPlaces.push(...places);
      }
    } catch (err) {
      console.error(`Error reading ${file}: ${err.message}`);
    }
  });

  console.log(`Loaded ${allPlaces.length} attractions to process.`);
  
  const verifiedCoordinatesMap = {};
  const googleMapsValidationReport = [];

  // AP bounds check: Lat [12.6, 19.2], Lng [76.7, 84.8]
  const isWithinAP = (lat, lng) => lat >= 12.6 && lat <= 19.2 && lng >= 76.7 && lng <= 84.8;

  let apiHits = 0;
  let countMatchedCurated = 0;
  let countMatchedOSM = 0;
  let countFallback = 0;

  for (let i = 0; i < allPlaces.length; i++) {
    const place = allPlaces[i];
    const slug = place.slug;
    const name = place.name;
    const districtName = place.districtName;
    const storedCoords = place.location.coordinates; // [lng, lat]
    
    let lat = null;
    let lng = null;
    let source = '';

    // 1. First priority: Check in our manually verified curated list
    if (curatedCoordinates[slug]) {
      const coords = curatedCoordinates[slug];
      lng = coords[0];
      lat = coords[1];
      source = 'curated';
      countMatchedCurated++;
    } else {
      // 2. Second priority: Query OSM Nominatim using our candidate queries
      const candidateQueries = getSearchQueries(name, districtName);
      let osmResult = null;
      let usedQuery = '';

      for (let q = 0; q < candidateQueries.length; q++) {
        const query = candidateQueries[q];
        console.log(`[OSM Query] [${i + 1}/${allPlaces.length}] Geocoding: "${query}"...`);
        
        await sleep(1000);
        apiHits++;
        
        const res = await fetchGeocodeFromOSM(query);
        if (res) {
          const osmLat = parseFloat(res.lat);
          const osmLng = parseFloat(res.lon);
          
          // Verify both AP bounds and distance check to avoid false matches
          if (isWithinAP(osmLat, osmLng)) {
            // Check distance to district centroid
            const centroid = districtCentroids[districtName];
            let isCloseToCentroid = true;
            if (centroid) {
              const distToCentroid = getHaversineDistance(osmLng, osmLat, centroid[0], centroid[1]);
              // True places shouldn't match arbitrary centroids, but they must be within 150 km of it
              if (distToCentroid > 150.0) {
                console.log(`  ⚠ OSM match rejected: resolved coords [${osmLng}, ${osmLat}] are ${distToCentroid.toFixed(1)} km away from district centroid (limit 150 km)`);
                isCloseToCentroid = false;
              }
            }
            
            if (isCloseToCentroid) {
              osmResult = res;
              usedQuery = query;
              break; // Found a valid result, stop checking candidates
            }
          }
        }
      }

      if (osmResult) {
        lat = parseFloat(osmResult.lat);
        lng = parseFloat(osmResult.lon);
        source = 'osm';
        countMatchedOSM++;
        console.log(`  ✓ Resolved via OSM using "${usedQuery}": [${lng}, ${lat}]`);
      }

      // 3. Fallback priority: If geosearch fails or yields coordinates outside AP boundaries, fall back to current coordinates
      if (lat === null || lng === null) {
        lng = storedCoords[0];
        lat = storedCoords[1];
        source = 'stored-fallback';
        countFallback++;
        console.log(`  ⚠ OSM failed. Using stored coordinates: [${lng}, ${lat}]`);
        
        // Warn if this fallback coordinate is near centroid
        const centroid = districtCentroids[districtName];
        if (centroid) {
          const distToCentroid = getHaversineDistance(lng, lat, centroid[0], centroid[1]);
          if (distToCentroid < 6.0) {
            console.warn(`  [CENTROID_FALLBACK_WARNING] Fallback coordinates [${lng}, ${lat}] are near district centroid for "${name}" (${districtName})!`);
          }
        }
      }
    }

    // Round coordinates to 4 decimal places for precision consistency
    lat = parseFloat(lat.toFixed(4));
    lng = parseFloat(lng.toFixed(4));

    // Construct correct Google Maps Search URL
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    verifiedCoordinatesMap[slug] = {
      latitude: lat,
      longitude: lng,
      googleMapsUrl
    };

    googleMapsValidationReport.push({
      place: name,
      slug,
      district: districtName,
      coordinates: { latitude: lat, longitude: lng },
      googleMapsUrl,
      source,
      distanceFromOriginalStoredKm: parseFloat(getHaversineDistance(storedCoords[0], storedCoords[1], lng, lat).toFixed(3))
    });
  }

  // Write verified-coordinates.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(verifiedCoordinatesMap, null, 2), 'utf-8');
  console.log(`\n✓ Generated verified coordinates dataset at: ${OUTPUT_FILE}`);

  // Write reports/google-maps-validation.json
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const mapsReportPath = path.join(reportsDir, 'google-maps-validation.json');
  fs.writeFileSync(mapsReportPath, JSON.stringify(googleMapsValidationReport, null, 2), 'utf-8');
  console.log(`✓ Generated Google Maps validation report at: ${mapsReportPath}`);

  console.log(`\nProcessing Summary:`);
  console.log(`- Total processed: ${allPlaces.length}`);
  console.log(`- Curated coordinates matched: ${countMatchedCurated}`);
  console.log(`- OSM Nominatim matches: ${countMatchedOSM}`);
  console.log(`- Fallbacks used: ${countFallback}`);
  console.log(`- Total OSM API requests: ${apiHits}`);
}

run();
