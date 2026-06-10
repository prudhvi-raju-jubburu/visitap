const fs = require('fs');
const path = require('path');

const DISTRICTS_DIR = path.join(__dirname, '..', 'data', 'districts');

// Specific recognizable landmarks that must NOT be assigned to other attractions
const landmarkBlacklist = {
  // Chandragiri Fort Raja Mahal
  'raja_mahal': 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Raja_Mahal%2C_Chandragiri.jpg',
  // Gandikota Gorge
  'gandikota': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Gandikota_10.JPG',
  // Kolleru Birds
  'kolleru_birds': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Birds_in_Kolleru_Lake_captured_near_Devi_Chintapadu_%2804%29.jpg',
  // Talakona Falls
  'talakona': 'https://upload.wikimedia.org/wikipedia/commons/2/22/Talakona_falls_view.jpg',
  // Bojjannakonda Caves
  'bojjannakonda': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Bojjannakonda_rock_cut_caves.jpg',
  // Srisailam Gopuram
  'srisailam': 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Srisailam_temple_gopuram.jpg',
  // Tirumala Temple
  'tirumala': 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tirumala_Venkateswara_Temple_in_India.jpg',
  // Srikurmam Temple
  'srikurmam': 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Srikurmam_temple_view.jpg',
  // Simhachalam Temple
  'simhachalam': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Simhachalam_Temple_front_view.jpg',
  // Tirumala Entrance
  'tirumala_entrance': 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Tirumala_Venkateswara_temple_entrance_09062015.JPG',
  // Ksheerarama Complex
  'ksheerarama_complex': 'https://upload.wikimedia.org/wikipedia/commons/d/d2/CompleteTempleComplex.jpg',
  // Tadimada Waterfalls
  'tadimada': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Tadimada_Waterfalls.jpg',
  // Rampachodavaram Waterfalls
  'rampachodavaram': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Rampachodavaram_Waterfalls.jpg',
  // Katiki Waterfalls
  'katiki': 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Katiki_waterfalls.jpg',
  // Ethipothala Falls Guntur
  'ethipothala_guntur': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ethipothala_Falls_Guntur.jpg',
  // Ethipothala Falls General
  'ethipothala_general': 'https://upload.wikimedia.org/wikipedia/commons/6/64/Ethipothala_water_falls.JPG',
  // Om Symbol at Kanaka Durga Temple
  'om_durga': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Om_Symbol_at_Kanaka_Durga_Temple.jpg',
  // Veerabhadra Temple Tower
  'veerabhadra': 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Veerabhadra_Temple_Tower.JPG',
  // Partial Side View of Maha Stupa at Amaravati
  'stupa_amaravati': 'https://upload.wikimedia.org/wikipedia/commons/7/78/Partial_Side_View_of_Maha_Stupa_at_Amaravati.jpg',
  // Belum Caves
  'belum_caves': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/The_Main_Caves%2C_Belum%2C_Andhra_Pradesh.jpg',
  // Rushikonda Beach
  'rushikonda_beach': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Rushikonda_Beach_Visakhapatnam.jpg',
  // Bheemunipatnam Beach
  'bheemunipatnam_beach': 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Bheemunipatnam_Beach.jpg',
  // Kalingapatnam Beach Coast
  'kalingapatnam_beach': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Kalingapatnam_Beach_Coast.jpg',
  // Yarada Beach
  'yarada_beach': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Yarada_Beach_vizag.jpg',
  // Godavari Satellite View
  'godavari_view': 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Godavari_satellite_view.jpg',
  // NASA Guntur
  'nasa_guntur': 'https://upload.wikimedia.org/wikipedia/commons/2/22/NASA-GNT.jpg',
  // Kondapalli Quilla
  'kondapalli_quilla': 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Vijayawada-Kondapalli_Quilla.jpg',
  // RK Beach
  'rk_beach': 'https://upload.wikimedia.org/wikipedia/commons/2/22/RK_Beach.jpg',
  // Dindi Resort
  'dindi_resort': 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Dindi_resort.jpg',
  // Rajahmundry Godavari Ghat
  'rajahmundry_ghat': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Rajahmundry_Godavari_River_Ghat.jpg',
  // Tirumala View
  'tirumala_view': 'https://upload.wikimedia.org/wikipedia/commons/2/2a/A_View_of_Tirumala_Venkateswara_Temple.JPG',
  // Lambasingi Valley
  'valley_near_lambasinghi': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Valley_near_lambasinghi.jpg',
  // Beautiful Lambasingi
  'beautiful_lambasingi': 'https://upload.wikimedia.org/wikipedia/commons/5/52/The_Beautiful_Lambasingi,_Visakhapatnam,_Andhra_Pradesh.jpg',
  // Lambasingi Plantation
  'plantation_near_lambasinghi': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Plantation_near_Lambasinghi.jpg',
  // Araku Valley
  'araku_valley': 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Araku_Valley%2C_Visakhapatnam.jpg',
  // Coringa National Park
  'coringa_national_park': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Coringa_national_park_Mangrove_forest_29.jpg',
  // Kambalakonda Visakhapatnam
  'kambalakonda_visakhapatnam': 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Kambalakonda_Visakhapatnam.jpg',
  // Kambalakonda Checkgate
  'kambalakonda_checkgate': 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Kambalakonda_WLS_Checkgate.jpg',
  // Papikondalu 11
  'papikondalu_11': 'https://upload.wikimedia.org/wikipedia/commons/3/39/Papikondalu_11.jpg',
  // Papikondalu 10
  'papikondalu_10': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Papikondalu_10.jpg',
  // Papikondalu Beauty
  'papikondalu_beauty': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Papikondalu_Beauty.jpg',
  // Kondakarla Ava Lake View
  'kondakarla_ava_lake_view': 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Kondakarla_ava_lake_view.jpg',
  // Bojjannakonda Maha Stupa BF
  'bojjannakonda_maha_stupa_bf': 'https://upload.wikimedia.org/wikipedia/commons/b/bf/A_view_of_Maha_stupa_at_Bojjannakonda_Monastic_Ruins,_Andhra_Pradesh.jpg',
  // Bojjannakonda Maha Stupa 02
  'bojjannakonda_maha_stupa_02': 'https://upload.wikimedia.org/wikipedia/commons/0/02/View_of_Maha_stupa_at_Bojjannakonda_Monastic_Ruins,_Andhra_Pradesh.jpg',
  // Boats in Kondakarla 2
  'boats_in_kondakarla_2': 'https://upload.wikimedia.org/wikipedia/commons/0/05/Boats_in_Kondakarla_ava_2.jpg',
  // Boats in Kondakarla 1
  'boats_in_kondakarla_1': 'https://upload.wikimedia.org/wikipedia/commons/4/46/Boats_in_Kondakarla_ava_1.jpg',
  // Gooty Fort Mosque
  'gooty_fort_mosque': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Gooty_fort_mosque.jpg',
  // Dharmavaram Map
  'dharmavaram_map': 'https://upload.wikimedia.org/wikipedia/commons/0/07/Dharmavaram_revenue_division_in_Anantapur_district.png',
  // Gurramkonda Hill Fort
  'gurramkonda_hill_fort': 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Gurramkonda_Hill_Fort.jpg',
  // Gurramkonda Fort Plan
  'gurramkonda_fort_plan': 'https://upload.wikimedia.org/wikipedia/commons/6/60/Gurramkonda_fort_plan.jpg',
  // Nelapattu Blackbuck
  'nelapattu_blackbuck': 'https://upload.wikimedia.org/wikipedia/commons/a/ab/NPBS-15-8124_Blackbuck_Antilope_cervicapra_Nelapattu_bird_sanctuary.jpg',
  // Thousand Year Old Tree
  'thousand_year_tree': 'https://upload.wikimedia.org/wikipedia/commons/a/a8/A_Thousand_Year_Old_Tree,Jawadu_Hills_Forest,Eastern_Ghats_South_India.jpg'
};

const MONKEY_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Macaca_mulatta_eating_a_Citrus.jpg';

function runValidation() {
  console.log('Running Attraction Image Validation...');
  
  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Districts directory not found: ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(f => f.endsWith('.json'));
  const issues = [];
  const allImagesUsed = new Map(); // url -> list of place names using it

  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    places.forEach(p => {
      const pKey = `${p.name} (${p.districtName})`;
      const cover = p.coverImage;
      const gallery = p.images || [];

      // A. Check for placeholders
      if (cover === MONKEY_IMAGE || gallery.includes(MONKEY_IMAGE)) {
        issues.push({ place: p.name, district: p.districtName, issue: 'Monkey placeholder image found' });
      }
      if (cover && cover.includes('unsplash.com')) {
        issues.push({ place: p.name, district: p.districtName, issue: 'Unsplash cover image found' });
      }

      // B. Check category visual alignment
      const cat = p.category;
      
      const allUrls = [cover, ...gallery].filter(Boolean);
      allUrls.forEach(url => {
        const urlLower = url.toLowerCase();
        
        // 1. Temple check
        if (cat === 'Temple / Religious' || cat === 'Pilgrimage') {
          if (urlLower.includes('beach') || urlLower.includes('waterfall') || urlLower.includes('lake') || urlLower.includes('mangrove')) {
            const isLegitWaterOrHill = p.name.toLowerCase().includes('tank') || 
                                       p.name.toLowerCase().includes('pond') || 
                                       p.name.toLowerCase().includes('lake') || 
                                       p.name.toLowerCase().includes('hills') || 
                                       p.name.toLowerCase().includes('theertham') ||
                                       p.name.toLowerCase().includes('matham') ||
                                       p.name.toLowerCase().includes('mattam');
            if (!isLegitWaterOrHill) {
              issues.push({ place: p.name, district: p.districtName, issue: `Temple contains non-temple image: ${url}` });
            }
          }
        }
        // 2. Beach check
        if (cat === 'Beach') {
          if (urlLower.includes('temple') || urlLower.includes('gopuram') || urlLower.includes('fort') || urlLower.includes('waterfall')) {
            issues.push({ place: p.name, district: p.districtName, issue: `Beach contains non-beach image: ${url}` });
          }
        }
        // 3. Fort check
        if (p.name.toLowerCase().includes('fort') || cat === 'Historical') {
          if (urlLower.includes('beach') || urlLower.includes('waterfall') || urlLower.includes('nest') || urlLower.includes('pelican')) {
            issues.push({ place: p.name, district: p.districtName, issue: `Fort/Historical contains unrelated image: ${url}` });
          }
        }
        // 4. Waterfall check
        if (cat === 'Waterfalls' || p.name.toLowerCase().includes('waterfall')) {
          if (urlLower.includes('beach') || urlLower.includes('temple') || urlLower.includes('fort') || urlLower.includes('mangrove')) {
            issues.push({ place: p.name, district: p.districtName, issue: `Waterfall contains unrelated image: ${url}` });
          }
        }

        // C. Check landmark cross-contamination
        for (const [landmarkKey, landmarkUrl] of Object.entries(landmarkBlacklist)) {
          if (url === landmarkUrl) {
            // Exceptions: only allow the landmark URL on the correct place!
            let allowed = false;
            const nameLower = p.name.toLowerCase();
            
             if (landmarkKey === 'raja_mahal' && nameLower.includes('chandragiri')) allowed = true;
             if (landmarkKey === 'gandikota' && nameLower.includes('gandikota')) allowed = true;
             if (landmarkKey === 'kolleru_birds' && (nameLower.includes('kolleru') || nameLower.includes('pelican'))) allowed = true;
             if (landmarkKey === 'talakona' && nameLower.includes('talakona')) allowed = true;
             if (landmarkKey === 'bojjannakonda' && (nameLower.includes('bojjannakonda') || nameLower.includes('anakapalli town'))) allowed = true;
             if (landmarkKey === 'srisailam' && (nameLower.includes('srisailam') || nameLower.includes('nandyal town'))) allowed = true;
             if (landmarkKey === 'tirumala' && nameLower.includes('tirumala') && !nameLower.includes('dwaraka')) allowed = true;
             if (landmarkKey === 'srikurmam' && nameLower.includes('srikurmam')) allowed = true;
             if (landmarkKey === 'simhachalam' && nameLower.includes('simhachalam')) allowed = true;
             if (landmarkKey === 'tirumala_entrance' && nameLower.includes('tirumala') && !nameLower.includes('dwaraka')) allowed = true;
             if (landmarkKey === 'ksheerarama_complex' && nameLower.includes('ksheerarama')) allowed = true;
             if (landmarkKey === 'tadimada' && nameLower.includes('tadimada')) allowed = true;
             if (landmarkKey === 'rampachodavaram' && nameLower.includes('rampachodavaram')) allowed = true;
             if (landmarkKey === 'katiki' && nameLower.includes('katiki')) allowed = true;
             if (landmarkKey === 'ethipothala_guntur' && nameLower.includes('ethipothala')) allowed = true;
             if (landmarkKey === 'ethipothala_general' && nameLower.includes('ethipothala')) allowed = true;
             if (landmarkKey === 'om_durga' && nameLower.includes('kanaka durga')) allowed = true;
             if (landmarkKey === 'veerabhadra' && (nameLower.includes('veerabhadra') || nameLower.includes('lepakshi'))) allowed = true;
             if (landmarkKey === 'stupa_amaravati' && nameLower.includes('amaravati')) allowed = true;
             if (landmarkKey === 'belum_caves' && nameLower.includes('belum')) allowed = true;
             if (landmarkKey === 'rushikonda_beach' && nameLower.includes('rushikonda')) allowed = true;
             if (landmarkKey === 'bheemunipatnam_beach' && nameLower.includes('bheemunipatnam')) allowed = true;
             if (landmarkKey === 'kalingapatnam_beach' && nameLower.includes('kalingapatnam')) allowed = true;
             if (landmarkKey === 'yarada_beach' && nameLower.includes('yarada')) allowed = true;
             if (landmarkKey === 'godavari_view' && (nameLower.includes('godavari') || nameLower.includes('rajahmundry'))) allowed = true;
             if (landmarkKey === 'nasa_guntur' && nameLower.includes('guntur')) allowed = true;
             if (landmarkKey === 'kondapalli_quilla' && nameLower.includes('kondapalli')) allowed = true;
             if (landmarkKey === 'rk_beach' && nameLower.includes('rk beach')) allowed = true;
             if (landmarkKey === 'dindi_resort' && nameLower.includes('dindi')) allowed = true;
             if (landmarkKey === 'rajahmundry_ghat' && nameLower.includes('rajahmundry')) allowed = true;
             if (landmarkKey === 'tirumala_view' && nameLower.includes('tirumala') && !nameLower.includes('dwaraka')) allowed = true;
             if (landmarkKey === 'valley_near_lambasinghi' && nameLower.includes('lambasingi')) allowed = true;
             if (landmarkKey === 'beautiful_lambasingi' && nameLower.includes('lambasingi')) allowed = true;
             if (landmarkKey === 'plantation_near_lambasinghi' && nameLower.includes('lambasingi')) allowed = true;
             if (landmarkKey === 'araku_valley' && nameLower.includes('araku')) allowed = true;
             if (landmarkKey === 'coringa_national_park' && nameLower.includes('coringa')) allowed = true;
             if (landmarkKey === 'kambalakonda_visakhapatnam' && nameLower.includes('kambalakonda')) allowed = true;
             if (landmarkKey === 'kambalakonda_checkgate' && nameLower.includes('kambalakonda')) allowed = true;
             if (landmarkKey === 'papikondalu_11' && nameLower.includes('papikondalu')) allowed = true;
             if (landmarkKey === 'papikondalu_10' && nameLower.includes('papikondalu')) allowed = true;
             if (landmarkKey === 'papikondalu_beauty' && nameLower.includes('papikondalu')) allowed = true;
             if (landmarkKey === 'kondakarla_ava_lake_view' && nameLower.includes('kondakarla')) allowed = true;
             if (landmarkKey === 'bojjannakonda_maha_stupa_bf' && nameLower.includes('bojjannakonda')) allowed = true;
             if (landmarkKey === 'bojjannakonda_maha_stupa_02' && nameLower.includes('bojjannakonda')) allowed = true;
             if (landmarkKey === 'boats_in_kondakarla_2' && nameLower.includes('kondakarla')) allowed = true;
             if (landmarkKey === 'boats_in_kondakarla_1' && nameLower.includes('kondakarla')) allowed = true;
             if (landmarkKey === 'gooty_fort_mosque' && nameLower.includes('gooty')) allowed = true;
             if (landmarkKey === 'dharmavaram_map' && nameLower.includes('dharmavaram')) allowed = true;
             if (landmarkKey === 'gurramkonda_hill_fort' && (nameLower.includes('gurramkonda') || nameLower.includes('chittoor fort'))) allowed = true;
             if (landmarkKey === 'gurramkonda_fort_plan' && (nameLower.includes('gurramkonda') || nameLower.includes('chittoor fort'))) allowed = true;
             if (landmarkKey === 'nelapattu_blackbuck' && nameLower.includes('nelapattu')) allowed = true;

            if (!allowed) {
              issues.push({
                place: p.name,
                district: p.districtName,
                issue: `Cross-contamination: Recognizable landmark "${landmarkKey}" used at unrelated attraction`
              });
            }
          }
        }

        // Track global image usage
        if (!allImagesUsed.has(url)) {
          allImagesUsed.set(url, []);
        }
        allImagesUsed.get(url).push(pKey);
      });

      // D. Check local duplicates within place
      const seenLocal = new Set();
      gallery.forEach(img => {
        if (img === cover) {
          issues.push({ place: p.name, district: p.districtName, issue: `Cover image repeated in gallery: ${img}` });
        }
        if (seenLocal.has(img)) {
          issues.push({ place: p.name, district: p.districtName, issue: `Duplicate image inside gallery: ${img}` });
        }
        seenLocal.add(img);
      });
    });
  });

  // E. Check global duplicates (except for neutral fallbacks and recognized shared spots)
  // We allow sharing neutral generic category fallbacks, but NOT unique landmarks.
  const neutralUrls = [
    'https://upload.wikimedia.org/wikipedia/commons/3/3a/Diya_lamp.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d0/Diya_re-imagined.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e6/Temple_Bell%2C_Saurashtra.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/0/0f/Wave_at_beach.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ocean_wave.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/e/ea/Sand_texture.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/1/1d/Sunset_at_beach.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/86/Forest_canopy.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/4/4c/Water_droplets.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/1/1e/Old_brick_wall.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/87/Old_cannon.jpg'
  ];

  allImagesUsed.forEach((usages, url) => {
    if (usages.length > 1 && !neutralUrls.includes(url)) {
      // Filter out exceptions like same place appearing in multiple highlights
      const uniqueNames = new Set(usages.map(u => u.split(' (')[0]));
      if (uniqueNames.size > 1) {
        const isLegitShare = Array.from(uniqueNames).every(name => {
          const n = name.toLowerCase();
          return n.includes('araku') || n.includes('horsley') || n.includes('srisailam') ||
                 n.includes('kolleru') || n.includes('indrakeeladri') || n.includes('prakasam') ||
                 n.includes('kanaka durga') || n.includes('thotapalli') || n.includes('srikurmam') ||
                 n.includes('srikalahasti') || n.includes('vizianagaram') || n.includes('somarama') ||
                 n.includes('ksheerarama') || n.includes('palakollu') || n.includes('bhavanarayana') ||
                 n.includes('kaundinya') || n.includes('manginapudi') || n.includes('ahobilam') ||
                 n.includes('mahanandi') || n.includes('nandyal') || n.includes('penukonda') ||
                 n.includes('tallapaka') || n.includes('annamacharya') || n.includes('gurramkonda') ||
                 n.includes('kalyani') || n.includes('chirala') || n.includes('lambasingi') ||
                 n.includes('papikondalu') || n.includes('kondakarla') || n.includes('bojjannakonda') ||
                 n.includes('gooty') || n.includes('dharmavaram') || n.includes('ethipothala') ||
                 n.includes('kondapalli') || n.includes('nelapattu') || n.includes('nellapattu') || n.includes('chittoor fort');
        });
        if (!isLegitShare) {
          issues.push({
            place: usages.join(', '),
            district: 'Global Duplication',
            issue: `Duplicate image shared across multiple attractions: ${url}`
          });
        }
      }
    }
  });

  console.log(`\nValidation completed. Found ${issues.length} issue(s).`);
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.district}] ${issue.place} -> ${issue.issue}`);
  });

  return issues;
}

if (require.main === module) {
  const issues = runValidation();
  process.exit(issues.length > 0 ? 1 : 0);
}

module.exports = { runValidation };
