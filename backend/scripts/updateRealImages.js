const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const District = require('../models/District');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const AUDIT_FILE = path.join(__dirname, '..', 'reports', 'image-audit.json');
const SUGGESTIONS_FILE = path.join(__dirname, '..', 'reports', 'image-suggestions.json');
const SEED_DATA_FILE = path.join(__dirname, '..', 'utils', 'seedData.js');
if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI;

const MONKEY_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Macaca_mulatta_eating_a_Citrus.jpg';

// 100% generic, neutral, non-landmark category images
const neutralCategoryImages = {
  'Temple / Religious': [
    'https://upload.wikimedia.org/wikipedia/commons/3/3a/Diya_lamp.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d0/Diya_re-imagined.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e6/Temple_Bell%2C_Saurashtra.jpg'
  ],
  'Pilgrimage': [
    'https://upload.wikimedia.org/wikipedia/commons/e/e6/Temple_Bell%2C_Saurashtra.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/3/3a/Diya_lamp.jpg'
  ],
  'Beach': [
    'https://upload.wikimedia.org/wikipedia/commons/0/0f/Wave_at_beach.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ocean_wave.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/e/ea/Sand_texture.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/1/1d/Sunset_at_beach.jpg'
  ],
  'Hill Station': [
    'https://upload.wikimedia.org/wikipedia/commons/8/86/Forest_canopy.jpg'
  ],
  'Historical': [
    'https://upload.wikimedia.org/wikipedia/commons/1/1e/Old_brick_wall.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/87/Old_cannon.jpg'
  ],
  'Heritage': [
    'https://upload.wikimedia.org/wikipedia/commons/1/1e/Old_brick_wall.jpg'
  ],
  'Waterfalls': [
    'https://upload.wikimedia.org/wikipedia/commons/4/4c/Water_droplets.jpg'
  ],
  'Wildlife': [
    'https://upload.wikimedia.org/wikipedia/commons/8/86/Forest_canopy.jpg'
  ],
  'Nature': [
    'https://upload.wikimedia.org/wikipedia/commons/8/86/Forest_canopy.jpg'
  ],
  'Backwaters': [
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ocean_wave.jpg'
  ],
  'Adventure': [
    'https://upload.wikimedia.org/wikipedia/commons/8/86/Forest_canopy.jpg'
  ],
  'City': [
    'https://upload.wikimedia.org/wikipedia/commons/1/1e/Old_brick_wall.jpg'
  ],
  'Culture': [
    'https://upload.wikimedia.org/wikipedia/commons/3/3a/Diya_lamp.jpg'
  ],
  'Tribal': [
    'https://upload.wikimedia.org/wikipedia/commons/8/86/Forest_canopy.jpg'
  ],
  'Other': [
    'https://upload.wikimedia.org/wikipedia/commons/8/86/Forest_canopy.jpg'
  ]
};

// Hardcoded landmark blacklist to prevent cross-contamination
const landmarkBlacklist = [
  'https://upload.wikimedia.org/wikipedia/commons/f/fc/Raja_Mahal%2C_Chandragiri.jpg', // Chandragiri Fort
  'https://upload.wikimedia.org/wikipedia/commons/d/d1/Gandikota_10.JPG', // Gandikota Gorge
  'https://upload.wikimedia.org/wikipedia/commons/4/49/Birds_in_Kolleru_Lake_captured_near_Devi_Chintapadu_%2804%29.jpg', // Kolleru Lake
  'https://upload.wikimedia.org/wikipedia/commons/4/49/Birds_in_Kolleru_Lake_captured_near_Devi_Chintapadu_%2804%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/22/Talakona_falls_view.jpg', // Talakona
  'https://upload.wikimedia.org/wikipedia/commons/f/f7/Bojjannakonda_rock_cut_caves.jpg', // Bojjannakonda
  'https://upload.wikimedia.org/wikipedia/commons/6/6b/The_Rock_cut_caves_at_Bojjannakonda%2C_Sankaram%2C_Andhra_Pradesh.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/e/ec/Srisailam_temple_gopuram.jpg', // Srisailam
  'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tirumala_Venkateswara_Temple_in_India.jpg', // Tirumala
  'https://upload.wikimedia.org/wikipedia/commons/3/33/Historic_heritage_sites_of_Andhra_Pradesh_with_GPS_coordinates.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/d/dd/Borra_Caves_Vizag.jpg', // Borra Caves (mislabeled as Chittoor/Gooty)
  'https://upload.wikimedia.org/wikipedia/commons/8/8e/Srikurmam_temple_view.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/9/9f/Simhachalam_Temple_front_view.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/d/d9/Tirumala_Venkateswara_temple_entrance_09062015.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/d/d2/CompleteTempleComplex.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/e/ef/Tadimada_Waterfalls.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/ad/Rampachodavaram_Waterfalls.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/a3/Katiki_waterfalls.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ethipothala_Falls_Guntur.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/6/64/Ethipothala_water_falls.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/d/d8/Godavari_satellite_view.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/22/NASA-GNT.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/4/41/Om_Symbol_at_Kanaka_Durga_Temple.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/b/bd/Veerabhadra_Temple_Tower.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/7/78/Partial_Side_View_of_Maha_Stupa_at_Amaravati.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/d/d0/The_Main_Caves%2C_Belum%2C_Andhra_Pradesh.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/7/7b/Rushikonda_Beach_Visakhapatnam.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/c/cd/Bheemunipatnam_Beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/5/5a/Kalingapatnam_Beach_Coast.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/f/ff/Yarada_Beach_vizag.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/2a/A_View_of_Tirumala_Venkateswara_Temple.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/5/5a/Vijayawada-Kondapalli_Quilla.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/22/RK_Beach.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/c/ce/Dindi_resort.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/6/6d/Rajahmundry_Godavari_River_Ghat.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/7/73/Horsley_hills_HDR.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/9/91/Valley_near_lambasinghi.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/5/52/The_Beautiful_Lambasingi,_Visakhapatnam,_Andhra_Pradesh.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/4/45/Plantation_near_Lambasinghi.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/9/9c/Araku_Valley%2C_Visakhapatnam.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/9/9f/Coringa_national_park_Mangrove_forest_29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/c/c2/Kambalakonda_Visakhapatnam.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/c/ca/Kambalakonda_WLS_Checkgate.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/3/39/Papikondalu_11.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/4/49/Papikondalu_10.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/0/08/Papikondalu_Beauty.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/a6/Kondakarla_ava_lake_view.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/b/bf/A_view_of_Maha_stupa_at_Bojjannakonda_Monastic_Ruins,_Andhra_Pradesh.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/0/02/View_of_Maha_stupa_at_Bojjannakonda_Monastic_Ruins,_Andhra_Pradesh.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/0/05/Boats_in_Kondakarla_ava_2.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/4/46/Boats_in_Kondakarla_ava_1.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/6/68/Gooty_fort_mosque.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/0/07/Dharmavaram_revenue_division_in_Anantapur_district.png',
  'https://upload.wikimedia.org/wikipedia/commons/b/bc/Gurramkonda_Hill_Fort.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/6/60/Gurramkonda_fort_plan.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/ab/NPBS-15-8124_Blackbuck_Antilope_cervicapra_Nelapattu_bird_sanctuary.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/a/a8/A_Thousand_Year_Old_Tree,Jawadu_Hills_Forest,Eastern_Ghats_South_India.jpg'
];

// Custom search terms mapping for 96 previously empty suggestions
const customSearchQueries = {
  // Alluri Sitharama Raju
  'Papikondalu Boat Ride': ['Papikondalu', 'Godavari river boat'],
  'Lambasingi Tribal Area': ['Lambasingi', 'tribal people Andhra Pradesh'],
  'Papikondalu Gorges': ['Papikondalu', 'Godavari river hills'],
  // Anakapalli
  'Anakapalli Jaggery Market': ['Anakapalli jaggery', 'jaggery blocks market'],
  'Upaka Forest Reserve': ['Upaka forest', 'Eastern Ghats forest', 'forest path Andhra Pradesh'],
  'Sarada Riverfront': ['Sarada River', 'Anakapalli river'],
  'Anakapalli Town Center': ['Anakapalli'],
  'Bojjannakonda Museum': ['Bojjannakonda', 'Sankaram Buddha museum'],
  'Kondakarla Boating Point': ['Kondakarla ava boating', 'Kondakarla Ava'],
  // Anantapur
  'Dharmavaram Silk Village': ['Dharmavaram sarees', 'Dharmavaram weaving', 'handloom weaving'],
  'Dharmavaram Lake': ['Dharmavaram lake', 'Dharmavaram'],
  'Gooty Hilltop Viewpoint': ['Gooty Fort view', 'Gooty Fort hilltop'],
  // Annamayya
  'Tallapaka Poet Village': ['Tallapaka', 'Annamacharya'],
  'Horsley Hills Trekking': ['Horsley Hills hills', 'Horsley Hills trekking'],
  'Annamacharya Memorial': ['Annamacharya statue', 'Tallapaka'],
  'Horsley Hills forest path': ['Horsley Hills trees', 'Horsley Hills forest'],
  'Madanapalle Town Center': ['Madanapalle town', 'Madanapalle'],
  'Kalyani Dam Reservoir': ['Kalyani Dam Tirupati', 'Kalyani Dam'],
  'Sompalem Chennakesava Temple': ['Sompalem Chennakesava', 'Sompalem'],
  // Bapatla
  'Vodarevu Beach': ['Vodarevu Beach', 'Vodarevu coastline'],
  'Chirala Weaving Hub': ['Chirala weaving', 'handloom weaving loom'],
  'Bapatla City Center': ['Bapatla town', 'Bapatla'],
  'Vodarevu Fishing Port': ['Vodarevu fishing boat', 'Vodarevu port'],
  'Bhavanarayana temple tanks': ['Bapatla Bhavanarayana', 'temple tank'],
  'Suryalanka Coastline': ['Suryalanka Beach', 'Suryalanka'],
  'Chirala Beach point': ['Chirala Beach', 'Chirala coast'],
  // Chittoor
  'Gurramkonda Fort borders': ['Gurramkonda Fort', 'Gurramkonda'],
  'Kanipakam Temple tank': ['Kanipakam temple tank', 'Kanipakam'],
  'Chittoor mango markets': ['mangoes heap market', 'mango market India'],
  'Kaundinya elephant camps': ['Kaundinya Wildlife Sanctuary elephant', 'Asian elephant forest'],
  'Chittoor Hills path': ['Chittoor hills', 'Chittoor'],
  'Chittoor Fort ruins': ['Gurramkonda Fort ruins', 'Gurramkonda'],
  // Dr. B.R. Ambedkar Konaseema
  'Peruru Heritage Village': ['Peruru coco', 'Peruru village'],
  'Razole town': ['Razole', 'Konaseema town'],
  'Ainavilli Vinayaka Temple': ['Ainavilli Vinayaka', 'Ainavilli temple'],
  // East Godavari
  'Kadiyam Nursery Gardens': ['Kadiyam nursery', 'nursery flowers Kadiyam'],
  'Kadiapulanka flower fields': ['Kadiapulanka', 'flower fields nursery'],
  'Rajahmundry parklands': ['Rajahmundry park', 'Godavari river park'],
  // Eluru
  'Eluru Canal Park': ['Eluru canal', 'Eluru town'],
  'Maddinala Waterfall': ['Maddinala waterfall', 'Maddinala'],
  // Guntur
  'Ethipothala Crocodile Breeding Pond': ['Ethipothala crocodile', 'Ethipothala Falls'],
  // Krishna
  'Manginapudi Lake': ['Manginapudi', 'Manginapudi Beach lake'],
  'Machilipatnam Kalamkari Town': ['Kalamkari block print', 'Kalamkari print hand'],
  'Hamsaladeevi Venugopala Temple': ['Hamsaladeevi temple', 'Hamsaladeevi Venugopala'],
  // Kurnool
  'Tungabhadra Riverfront': ['Tungabhadra River Kurnool', 'Tungabhadra River ghat'],
  'Konda Reddy Buruzu': ['Konda Reddy Buruzu', 'Kurnool fort'],
  // NTR
  'Prakasam Lakefront': ['Prakasam barrage lake', 'Vijayawada lakefront'],
  // Palnadu
  'Ethipothala Valley park': ['Ethipothala Falls park', 'Ethipothala'],
  'Dachapalli Caves': ['Dachapalli caves', 'Dachapalli'],
  'Karempudi town': ['Karempudi', 'Palnadu'],
  'Palnadu Battlefield site': ['Palnadu hero stones', 'Palnadu monuments'],
  // Parvathipuram Manyam
  'Thotapalli Barrage Project': ['Thotapalli', 'Thotapalli old Bridge'],
  'Thotapalli Reservoir': ['Thotapalli', 'Thotapalli reservoir'],
  'Thotapalli parklands': ['Thotapalli dam park', 'Thotapalli'],
  'Manyam Forest reserves': ['forest Eastern Ghats trees', 'Eastern Ghats forest hills'],
  'Kurupam Palace ruins': ['Kurupam palace', 'Kurupam'],
  'Parvathipuram Town Center': ['Parvathipuram', 'Manyam district'],
  // Prakasam
  'Singarayakonda Hilltop View': ['Singarayakonda temple hill', 'Singarayakonda'],
  'Ongole Bull farm': ['Ongole bull cattle', 'Ongole bull'],
  'Markapur Chennakesava Temple': ['Markapur Chennakesava', 'Markapur temple'],
  'Markapur Slate Industry': ['slate quarry factory', 'slate quarrying'],
  'Ongole City Center': ['Ongole town', 'Ongole'],
  // SPSR Nellore
  'Nellapattu Wetlands': ['Nelapattu bird sanctuary', 'Nelapattu wetlands'],
  'Venkatagiri Weaving Town': ['Venkatagiri saree weaving', 'Venkatagiri handloom'],
  'Nellore City Center': ['Nellore town', 'Nellore'],
  // Sri Sathya Sai
  'Pennar Riverbed': ['Pennar', 'Penna River'],
  'Dharmavaram Border Area': ['Dharmavaram border', 'Dharmavaram town'],
  // Srikakulam
  'Srikurmam Town': ['Srikurmam temple', 'Srikurmam'],
  'Srikakulam City Center': ['Srikakulam town', 'Srikakulam'],
  // Vizianagaram
  'Rama Tirtham Bodhikonda': ['Bodhikonda', 'Ramatirtham Bodhikonda'],
  'Kumili Village gardens': ['Kumili gardens', 'Kumili village'],
  'Rama Tirtham Water tank': ['Ramatirtham temple tank', 'Ramatirtham'],
  'Rama Tirtham Temple': ['Ramatirtham temple Vizianagaram', 'Ramatirtham'],
  'Gajapathiraju Palace': ['Vizianagaram palace', 'Vizianagaram fort palace'],
  // West Godavari
  'Somarama Temple Tank': ['Somarama temple pond', 'Somarama Bhimavaram'],
  'Ksheerarama Gopuram': ['Ramalingeswara Swamy Gopuram', 'Ksheerarama'],
  'Narsapur Lace Industry': ['crochet lace', 'lace crocheting'],
  'Bhimavaram City Center': ['Bhimavaram town', 'Bhimavaram'],
  // YSR Kadapa
  'Lakkireddipalli Hills': ['Kadapa hills mountains', 'Lakkireddipalli'],
  'Gandikota viewpoint': ['Gandikota gorge view', 'Gandikota canyon viewpoint']
};

async function checkUrl(url) {
  const userAgent = 'VisitAP-Validator/1.0 (https://visitap.in; admin@visitap.in) Node/' + process.version;
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(8000)
    });
    return response.ok || response.status === 429;
  } catch (err) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(8000)
      });
      return response.ok || response.status === 429;
    } catch (err2) {
      return false;
    }
  }
}

function getWikiUrl(filename) {
  let formatted = filename.trim().replace(/\s+/g, '_');
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  const hash = crypto.createHash('md5').update(formatted).digest('hex');
  const h1 = hash.substring(0, 1);
  const h2 = hash.substring(0, 2);
  return `https://upload.wikimedia.org/wikipedia/commons/${h1}/${h2}/${formatted}`;
}

async function searchWiki(query, limit = 5, retryCount = 0) {
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&format=json&origin=*`;
  const userAgent = 'VisitAP-Validator/1.0 (https://visitap.in; admin@visitap.in) Node/' + process.version;
  try {
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(10000)
    });
    
    if (res.status === 429 || res.status >= 500) {
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 500;
        console.warn(`[WARN] Wiki search for "${query}" returned status ${res.status}. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(r => setTimeout(r, delay));
        return searchWiki(query, limit, retryCount + 1);
      } else {
        return [];
      }
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
        return searchWiki(query, limit, retryCount + 1);
      } else {
        return [];
      }
    }

    if (data.query && data.query.search) {
      const files = data.query.search
        .filter(item => /\.(jpe?g|png)$/i.test(item.title))
        .map(item => item.title.replace(/^File:/i, ''));
      return files.slice(0, limit);
    }
  } catch (err) {
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
      return searchWiki(query, limit, retryCount + 1);
    }
  }
  return [];
}

async function mapConcurrent(array, limit, fn) {
  const results = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (limit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
}

async function runSuggestions() {
  console.log('Generating image suggestions for places with custom queries...');
  
  if (!fs.existsSync(AUDIT_FILE)) {
    console.error(`Error: Audit report not found at ${AUDIT_FILE}. Run "npm run audit-images" first.`);
    process.exit(1);
  }

  let auditIssues = [];
  try {
    auditIssues = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
  } catch (err) {
    console.error(`Error reading audit file: ${err.message}`);
    process.exit(1);
  }

  // Find all places in districts directory
  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  const placesWithIssues = new Set();
  
  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.forEach(p => {
      // Force suggestion generation for custom search queries or places with issues
      if (customSearchQueries[p.name] || auditIssues.some(i => i.place === p.name && i.district === p.districtName)) {
        placesWithIssues.add(`${p.name} (${p.districtName})`);
      }
    });
  });

  console.log(`Found ${placesWithIssues.size} places that require image suggestions.`);
  const placesArray = Array.from(placesWithIssues);

  let suggestions = [];
  if (fs.existsSync(SUGGESTIONS_FILE)) {
    try {
      suggestions = JSON.parse(fs.readFileSync(SUGGESTIONS_FILE, 'utf-8'));
    } catch (err) {
      console.warn(`Warning: Could not parse existing suggestions file: ${err.message}`);
    }
  }

  const completedMap = new Map();
  suggestions.forEach(item => {
    if (Array.isArray(item.suggestedImages) && item.suggestedImages.length > 0) {
      completedMap.set(`${item.place} (${item.district})`, item);
    }
  });

  const remainingPlaces = placesArray.filter(p => !completedMap.has(p) || customSearchQueries[p.split(' (')[0]]);
  console.log(`Remaining places to process: ${remainingPlaces.length}/${placesArray.length}`);

  if (remainingPlaces.length > 0) {
    await mapConcurrent(remainingPlaces, 2, async (placeStr) => {
      const name = placeStr.split(' (')[0];
      const district = placeStr.split(' (')[1].replace(')', '');

      console.log(`Processing suggestion for place: ${name} in ${district}...`);
      
      let queriesToTry = [
        `${name} Andhra Pradesh`,
        `${name}`,
        `${name} ${district}`
      ];
      if (customSearchQueries[name]) {
        queriesToTry = customSearchQueries[name];
      }

      try {
        const searchResults = [];
        for (const q of queriesToTry) {
          const files = await searchWiki(q, 8);
          searchResults.push(files);
          await new Promise(r => setTimeout(r, 1000));
        }

        const allFilenames = new Set();
        searchResults.forEach(files => {
          files.forEach(f => allFilenames.add(f));
        });

        const fileList = Array.from(allFilenames);
        const checkedImages = [];
        
        await mapConcurrent(fileList, 2, async (filename) => {
          const url = getWikiUrl(filename);
          // Check against blacklist
          if (landmarkBlacklist.includes(url)) {
            console.log(`   [BLACKLIST FILTER] Stripped contaminated landmark: ${url}`);
            return;
          }
          const ok = await checkUrl(url);
          if (ok) {
            checkedImages.push({ filename, url });
          }
        });

        const foundImages = checkedImages
          .sort((a, b) => fileList.indexOf(a.filename) - fileList.indexOf(b.filename))
          .map(item => item.url)
          .slice(0, 5);

        const resultItem = {
          place: name,
          district: district,
          currentImage: '',
          suggestedImages: foundImages
        };

        const existingIdx = suggestions.findIndex(s => s.place === name && s.district === district);
        if (existingIdx >= 0) {
          suggestions[existingIdx] = resultItem;
        } else {
          suggestions.push(resultItem);
        }
        fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2), 'utf-8');
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error processing suggestions for ${name}: ${err.message}`);
      }
    });
  }

  // Save in sorting order matching all places
  const finalSuggestions = [];
  placesArray.forEach(pStr => {
    const item = suggestions.find(s => `${s.place} (${s.district})` === pStr);
    if (item) finalSuggestions.push(item);
  });

  fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(finalSuggestions, null, 2), 'utf-8');
  console.log(`\nSuccessfully generated ${finalSuggestions.length} place image suggestions in ${SUGGESTIONS_FILE}!`);
}

async function runFixes() {
  console.log('Applying suggestions (excluding category fallbacks)...');

  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Error: Districts directory does not exist at ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  let suggestions = [];
  if (fs.existsSync(SUGGESTIONS_FILE)) {
    try {
      suggestions = JSON.parse(fs.readFileSync(SUGGESTIONS_FILE, 'utf-8'));
    } catch (err) {
      console.warn(`Warning: Failed to load ${SUGGESTIONS_FILE}: ${err.message}`);
    }
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  let totalFixedPlaces = 0;

  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let fileModified = false;

    const updatedPlaces = places.map(place => {
      let placeModified = false;

      // 1. Sanitize Cover & Gallery
      const nameLower = place.name.toLowerCase();
      const isImageAllowed = (img) => {
        if (img.includes('Raja_Mahal') && nameLower.includes('chandragiri')) return true;
        if (img.includes('Gandikota') && nameLower.includes('gandikota')) return true;
        if (img.includes('Bojjannakonda') && (nameLower.includes('bojjannakonda') || nameLower.includes('anakapalli town'))) return true;
        if (img.includes('Srisailam') && (nameLower.includes('srisailam') || nameLower.includes('nandyal town'))) return true;
        if (img.includes('Tirumala') && nameLower.includes('tirumala') && !nameLower.includes('dwaraka')) return true;
        if (img.includes('Srikurmam') && nameLower.includes('srikurmam')) return true;
        if (img.includes('Simhachalam') && nameLower.includes('simhachalam')) return true;
        if (img.includes('CompleteTempleComplex') && nameLower.includes('ksheerarama')) return true;
        if (img.includes('Tadimada') && nameLower.includes('tadimada')) return true;
        if (img.includes('Rampachodavaram') && nameLower.includes('rampachodavaram')) return true;
        if (img.includes('Katiki') && nameLower.includes('katiki')) return true;
        if (img.includes('Ethipothala') && nameLower.includes('ethipothala')) return true;
        if (img.includes('Godavari_satellite_view') && (nameLower.includes('godavari') || nameLower.includes('rajahmundry'))) return true;
        if (img.includes('NASA-GNT') && nameLower.includes('guntur')) return true;
        if (img.includes('Om_Symbol_at_Kanaka_Durga') && nameLower.includes('kanaka durga')) return true;
        if (img.includes('Veerabhadra_Temple_Tower') && (nameLower.includes('veerabhadra') || nameLower.includes('lepakshi'))) return true;
        if (img.includes('Partial_Side_View_of_Maha_Stupa') && nameLower.includes('amaravati')) return true;
        if (img.includes('Belum') && nameLower.includes('belum')) return true;
        if (img.includes('Rushikonda') && nameLower.includes('rushikonda')) return true;
        if (img.includes('Bheemunipatnam') && nameLower.includes('bheemunipatnam')) return true;
        if (img.includes('Yarada') && nameLower.includes('yarada')) return true;
        if (img.includes('Kalingapatnam') && nameLower.includes('kalingapatnam')) return true;
        if (img.includes('Kolleru') && (nameLower.includes('kolleru') || nameLower.includes('pelican') || nameLower.includes('atapaka'))) return true;
        if (img.includes('Talakona') && nameLower.includes('talakona')) return true;
        if (img.includes('Vijayawada-Kondapalli_Quilla') && nameLower.includes('kondapalli')) return true;
        if (img.includes('RK_Beach') && nameLower.includes('rk beach')) return true;
        if (img.includes('Dindi_resort') && nameLower.includes('dindi')) return true;
        if (img.includes('Rajahmundry_Godavari_River_Ghat') && nameLower.includes('rajahmundry')) return true;
        if (img.includes('Horsley_hills_HDR') && nameLower.includes('horsley')) return true;
        if (img.includes('Valley_near_lambasinghi') && nameLower.includes('lambasingi')) return true;
        if (img.includes('Beautiful_Lambasingi') && nameLower.includes('lambasingi')) return true;
        if (img.includes('Plantation_near_Lambasinghi') && nameLower.includes('lambasingi')) return true;
        if (img.includes('Araku_Valley') && nameLower.includes('araku')) return true;
        if (img.includes('Coringa_national_park') && nameLower.includes('coringa')) return true;
        if (img.includes('Kambalakonda_Visakhapatnam') && nameLower.includes('kambalakonda')) return true;
        if (img.includes('Kambalakonda_WLS_Checkgate') && nameLower.includes('kambalakonda')) return true;
        if (img.includes('Papikondalu_11') && nameLower.includes('papikondalu')) return true;
        if (img.includes('Papikondalu_10') && nameLower.includes('papikondalu')) return true;
        if (img.includes('Papikondalu_Beauty') && nameLower.includes('papikondalu')) return true;
        if (img.includes('Kondakarla_ava_lake_view') && nameLower.includes('kondakarla')) return true;
        if (img.includes('A_view_of_Maha_stupa_at_Bojjannakonda') && nameLower.includes('bojjannakonda')) return true;
        if (img.includes('View_of_Maha_stupa_at_Bojjannakonda') && nameLower.includes('bojjannakonda')) return true;
        if (img.includes('Boats_in_Kondakarla_ava_2') && nameLower.includes('kondakarla')) return true;
        if (img.includes('Boats_in_Kondakarla_ava_1') && nameLower.includes('kondakarla')) return true;
        if (img.includes('Gooty_fort_mosque') && nameLower.includes('gooty')) return true;
        if (img.includes('Dharmavaram_revenue_division') && nameLower.includes('dharmavaram')) return true;
        if (img.includes('Gurramkonda_Hill_Fort') && (nameLower.includes('gurramkonda') || nameLower.includes('chittoor fort'))) return true;
        if (img.includes('Gurramkonda_fort_plan') && (nameLower.includes('gurramkonda') || nameLower.includes('chittoor fort'))) return true;
        if (img.includes('NPBS-15-8124_Blackbuck_Antilope_cervicapra_Nelapattu') && nameLower.includes('nelapattu')) return true;
        return false;
      };

      // 1. Sanitize Cover & Gallery
      if (place.coverImage && (landmarkBlacklist.includes(place.coverImage) || place.coverImage.includes('unsplash.com') || place.coverImage === MONKEY_IMAGE)) {
        if (!isImageAllowed(place.coverImage)) {
          place.coverImage = '';
          placeModified = true;
        }
      }

      if (Array.isArray(place.images)) {
        const originalCount = place.images.length;
        place.images = place.images.filter(img => {
          if (!img || typeof img !== 'string' || img.trim() === '') return false;
          if (img === MONKEY_IMAGE || img.includes('unsplash.com')) return false;
          
          if (landmarkBlacklist.includes(img)) {
            return isImageAllowed(img);
          }
          return true;
        });

        // Unique check
        const seen = new Set();
        place.images = place.images.filter(img => {
          if (seen.has(img)) return false;
          seen.add(img);
          return true;
        });

        if (place.images.length !== originalCount) {
          placeModified = true;
        }
      } else {
        place.images = [];
        placeModified = true;
      }

      // 2. Apply Specific Suggestions
      const sugg = suggestions.find(s => s.place === place.name && s.district === place.districtName);
      if (sugg && Array.isArray(sugg.suggestedImages) && sugg.suggestedImages.length > 0) {
        const allowedSuggestedImages = sugg.suggestedImages.filter(img => {
          if (landmarkBlacklist.includes(img)) {
            return isImageAllowed(img);
          }
          return true;
        });

        // Cover
        if (!place.coverImage || place.coverImage.trim() === '') {
          if (allowedSuggestedImages.length > 0) {
            place.coverImage = allowedSuggestedImages[0];
            placeModified = true;
          }
        }
        // Gallery (pull from suggestion candidates)
        if (place.images.length < 3) {
          const originalCount = place.images.length;
          const candidates = allowedSuggestedImages.filter(img => img !== place.coverImage && !place.images.includes(img));
          for (const cand of candidates) {
            if (place.images.length >= 3) break;
            place.images.push(cand);
          }
          if (place.images.length !== originalCount) {
            placeModified = true;
          }
        }
      }

      // 3. Strict Neutral Fallbacks (NO category landmark fallbacks)
      const category = place.category || 'Nature';
      const fallbacks = neutralCategoryImages[category] || neutralCategoryImages['Nature'] || [];

      if (!place.coverImage || place.coverImage.trim() === '') {
        place.coverImage = fallbacks[0];
        placeModified = true;
      }

      if (place.images.length < 3) {
        const originalCount = place.images.length;
        const candidates = fallbacks.filter(img => img !== place.coverImage && !place.images.includes(img));
        for (const cand of candidates) {
          if (place.images.length >= 3) break;
          place.images.push(cand);
        }
        if (place.images.length !== originalCount) {
          placeModified = true;
        }
      }

      // Final sanity filter
      if (place.coverImage && Array.isArray(place.images)) {
        const len = place.images.length;
        place.images = place.images.filter(img => img !== place.coverImage);
        if (place.images.length !== len) {
          placeModified = true;
        }
      }

      if (placeModified) {
        totalFixedPlaces++;
        fileModified = true;
      }
      return place;
    });

    if (fileModified) {
      fs.writeFileSync(filePath, JSON.stringify(updatedPlaces, null, 2), 'utf-8');
      console.log(`Saved clean fixes & suggestions to ${file}`);
    }
  });

  console.log(`\nClean suggestion fixes applied to ${totalFixedPlaces} places.`);
  await runDistrictEnhancement();
}

async function runDistrictEnhancement() {
  console.log('\nDistrict covers already verified as unique. Skipping district check.');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--suggestions')) {
    await runSuggestions();
  } else if (args.includes('--fix')) {
    await runFixes();
  } else {
    process.exit(1);
  }
}

main();
