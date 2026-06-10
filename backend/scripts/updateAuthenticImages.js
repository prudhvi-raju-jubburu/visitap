const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const AUDIT_FILE = path.join(__dirname, '..', 'reports', 'place-audit.json');
const SUGGESTIONS_FILE = path.join(__dirname, '..', 'reports', 'image-suggestions.json');

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

const MONKEY_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Macaca_mulatta_eating_a_Citrus.jpg';

function runImageEnhancement() {
  console.log('Starting Phase 4: Image Enhancement (Strict Specific Mapping)...');

  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Error: Districts directory does not exist at ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  // Load suggestion engine database
  let suggestions = [];
  if (fs.existsSync(SUGGESTIONS_FILE)) {
    try {
      suggestions = JSON.parse(fs.readFileSync(SUGGESTIONS_FILE, 'utf-8'));
      console.log(`Loaded ${suggestions.length} image suggestions.`);
    } catch (err) {
      console.error(`Error reading image-suggestions.json: ${err.message}`);
    }
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  let updateCount = 0;

  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    let places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let fileModified = false;

    const updatedPlaces = places.map(place => {
      let placeModified = false;
      const name = place.name;
      const dist = place.districtName;
      const cat = place.category || 'Nature';

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
      const sugg = suggestions.find(s => s.place === name && s.district === dist);
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

      // 3. Strict Neutral Fallbacks (no landmark sharing)
      const fallbacks = neutralCategoryImages[cat] || neutralCategoryImages['Nature'] || [];

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

      // Final cover repetition check
      if (place.coverImage && Array.isArray(place.images)) {
        const len = place.images.length;
        place.images = place.images.filter(img => img !== place.coverImage);
        if (place.images.length !== len) {
          placeModified = true;
        }
      }

      if (placeModified) {
        fileModified = true;
        updateCount++;
      }
      return place;
    });

    if (fileModified) {
      fs.writeFileSync(filePath, JSON.stringify(updatedPlaces, null, 2), 'utf-8');
      console.log(`Saved strictly enhanced images to ${file}`);
    }
  });

  console.log(`\nImage enhancement complete. Corrected/enhanced ${updateCount} places.`);
}

if (require.main === module) {
  runImageEnhancement();
}

module.exports = { runImageEnhancement };
