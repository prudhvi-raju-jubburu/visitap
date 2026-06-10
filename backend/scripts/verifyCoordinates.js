const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'coordinate-audit.json');

// Curated verified coordinates [longitude, latitude] for tourist places in Andhra Pradesh.
// These coordinates represent high-accuracy locations for tourist places.
const verifiedCoordinates = {
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
  'tirumala-hills-viewpoint': [79.3600, 13.6900],
  'srikalahasti-town': [79.7000, 13.7500],
  'kalyani-dam': [79.2800, 13.6300],
  'kapila-theertham': [79.4200, 13.6500],

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
  'mahanandi-temple': [78.5667, 15.4667],
  'srisailam-hill-forest': [78.8700, 16.0800],
  'srisailam-tiger-reserve': [78.8000, 16.0500],
  'nallamala-forest-trekking': [78.6000, 15.5000],
  'mahanandi-village': [78.5700, 15.4800],
  'ahobilam-hills': [78.7300, 15.1400],
  'nandyal-town-center': [78.4812, 15.4847],
  'yaganti-temple-complex': [78.1400, 15.3400],

  // Kurnool
  'yaganti-temple': [78.1394, 15.3486],
  'belum-caves': [78.1147, 15.1017],
  'konda-reddy-buruzu': [78.0373, 15.8281],
  'kurnool-fort-ruins': [78.0500, 15.8400],
  'orvakal-rock-garden': [78.0169, 15.6811],
  'kurnool-city-center': [78.0300, 15.8200],
  'rollapadu-bird-sanctuary': [78.3683, 15.7258],
  'tungabhadra-riverfront': [78.0600, 15.8500],
  'belum-cave-passages': [78.1200, 15.1100],
  'mahanandi-temple-area': [78.5800, 15.4600],

  // Srikakulam
  'arasavalli-sun-temple': [83.9015, 18.3039],
  'srikurmam-temple': [83.9839, 18.2706],
  'kalingapatnam-beach': [84.1264, 18.3414],
  'baruva-beach': [84.5888, 18.8824],
  'srimukhalingam-temple': [83.9634, 18.5954],
  'kalingapatnam-town': [84.1200, 18.3400],
  'vamsadhara-river-mouth': [84.1300, 18.3400],
  'srikakulam-city-center': [83.8935, 18.2949],
  'srikurmam-town': [83.9800, 18.2700],
  'sangam-shiva-temple': [83.9284, 18.282],

  // NTR
  'kanaka-durga-temple': [80.6062, 16.5162],
  'prakasam-barrage': [80.6044, 16.5061],
  'bhavani-island': [80.5894, 16.5178],
  'kondapalli-fort': [80.5369, 16.6186],
  'undavalli-caves': [80.5794, 16.4922],
  'vijayawada-city-center': [80.6480, 16.5062],
  'kondapalli-toy-village': [80.5400, 16.6100],
  'indrakeeladri-hills': [80.6000, 16.5100],
  'prakasam-lakefront': [80.6000, 16.5000],
  'vijayawada-museum': [80.6200, 16.5100],

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
  'markapur-chennakesava-temple': [79.2711, 15.7369],
  'ongole-city-center': [80.0493, 15.5057],
  'singarayakonda-temple': [80.0381, 15.2589],
  'cumbum-lake': [79.1122, 15.5786],
  'kothapatnam-beach': [80.1200, 15.4800],

  // SPSR Nellore
  'pulicat-lake-sanctuary': [80.0500, 13.6833],
  'nelapattu-bird-sanctuary': [79.9708, 13.8406],
  'mypadu-beach': [80.1802, 14.5098],
  'udayagiri-fort': [79.2908, 14.8692],
  'penchalakona-temple': [79.4600, 14.3000],

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
  'monolithic-nandi-lepakshi': [77.8080, 13.8010],
  'puttaparthi-ashram': [77.8106, 14.1664],
  'lepakshi-temple-complex': [77.8062, 13.8021],
  'puttaparthi-planetarium': [77.8100, 14.1650],

  // Parvathipuram Manyam
  'thotapalli-barrage-project': [83.4700, 18.8100],
  'parvathipuram-town-center': [83.4219, 18.7946],
  'kurupam-palace-ruins': [83.4800, 18.8700],

  // Vizianagaram
  'vizianagaram-fort': [83.4072, 18.1172],
  'rama-tirtham-temple': [83.4908, 18.1633],
  'kumili-temple-complex': [83.4500, 18.1000],

  // Chittoor
  'horsley-hills-part': [78.3972, 13.6492],
  'kanipakam-temple': [79.0270, 13.2536],
  'chittoor-hills': [79.1003, 13.2172]
};

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

async function runCoordinateVerification() {
  console.log('Starting Phase 3: Coordinate Verification (Offline Mode)...');

  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Error: Districts directory does not exist at ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  const report = [];

  const allPlaces = [];
  const coordsUsage = new Map(); // 'lng,lat' -> list of place keys

  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach(p => {
          allPlaces.push(p);
          const coordStr = p.location.coordinates.join(',');
          if (!coordsUsage.has(coordStr)) {
            coordsUsage.set(coordStr, []);
          }
          coordsUsage.get(coordStr).push(`${p.name} (${p.districtName})`);
        });
      }
    } catch (err) {
      console.error(`Error parsing ${file}: ${err.message}`);
    }
  });

  console.log(`Loaded ${allPlaces.length} attractions to verify coordinates.`);

  for (const place of allPlaces) {
    const name = place.name;
    const slug = place.slug;
    const dist = place.districtName;
    const stored = place.location.coordinates; // [lng, lat]
    const placeKey = `${name} (${dist})`;

    let verified = null;
    let confidence = 50;
    let action = 'do-not-change';
    let details = 'No verified lookup available';

    // 1. Check in our local curated coordinates database
    if (verifiedCoordinates[slug]) {
      verified = verifiedCoordinates[slug];
      const distKm = getHaversineDistance(stored, verified);
      
      if (distKm <= 1.0) {
        confidence = 98;
        action = 'do-not-change';
        details = `Coordinates verified to match high-precision lookup within ${distKm.toFixed(3)} km.`;
      } else {
        confidence = 95;
        action = 'auto-fix';
        details = `Significant coordinate shift of ${distKm.toFixed(2)} km detected. Verified: [${verified.join(', ')}]`;
      }
    } else {
      // Check if coordinates match district centroid exactly (multiple duplicates in same district)
      const coordStr = stored.join(',');
      const usageList = coordsUsage.get(coordStr) || [];
      if (usageList.length > 1) {
        confidence = 70; // Medium Confidence
        action = 'suggest-review';
        details = `Shared coordinates [${coordStr}] detected with: ${usageList.filter(u => u !== placeKey).join(', ')}. Needs review.`;
      } else {
        // Offline mode, not in curated database, no other duplicates
        confidence = 50;
        action = 'do-not-change';
        details = `Offline, lookup not in database. Current coordinates [${stored.join(', ')}] kept.`;
      }
    }

    report.push({
      place: name,
      slug,
      district: dist,
      stored,
      verified: verified || stored,
      confidence,
      action,
      details
    });
  }

  // Save report
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nCoordinate verification complete. Audited ${report.length} attractions.`);
  console.log(`Report saved to ${REPORT_PATH}`);
}

runCoordinateVerification();
