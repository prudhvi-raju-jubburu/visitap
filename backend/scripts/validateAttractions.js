const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');

const VALID_CATEGORIES = [
  'Temple / Religious', 'Beach', 'Hill Station', 'Historical', 'Nature', 'Waterfalls', 
  'Wildlife', 'Adventure', 'City', 'Culture', 'Heritage', 'Backwaters', 'Tribal', 'Pilgrimage', 'Other'
];

const VALID_DISTRICTS = [
  'Visakhapatnam', 'Tirupati', 'Alluri Sitharama Raju', 'Anantapur', 'Kurnool', 
  'Dr. B.R. Ambedkar Konaseema', 'Srikakulam', 'NTR', 'YSR Kadapa', 'SPSR Nellore', 
  'Guntur', 'Anakapalli', 'Nandyal', 'Eluru', 'Kakinada', 'Krishna', 'Palnadu', 
  'Bapatla', 'Prakasam', 'West Godavari', 'East Godavari', 'Annamayya', 
  'Sri Sathya Sai', 'Parvathipuram Manyam', 'Vizianagaram', 'Chittoor'
];

function validateAttractions() {
  console.log('Starting Phase 5: Attraction Validation...');

  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Error: Districts directory does not exist at ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  if (files.length === 0) {
    console.error('Error: No district JSON files found.');
    process.exit(1);
  }

  let totalErrors = 0;
  let totalPlaces = 0;
  const globalSlugs = new Map(); // slug -> placeKey

  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    let places = [];
    try {
      places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error(`Error: Failed to parse ${file}: ${err.message}`);
      totalErrors++;
      return;
    }

    places.forEach((place, index) => {
      totalPlaces++;
      const placeIdStr = `[File: ${file}, Index: ${index}, Name: "${place.name || 'UNKNOWN'}"]`;

      // 1. Name Accuracy
      if (!place.name || typeof place.name !== 'string' || place.name.trim() === '') {
        console.error(`${placeIdStr}: Missing or invalid place name`);
        totalErrors++;
      }

      // 2. District Mapping Accuracy
      if (!place.districtName || !VALID_DISTRICTS.includes(place.districtName)) {
        console.error(`${placeIdStr}: Invalid district mapping "${place.districtName}".`);
        totalErrors++;
      }

      // 3. Category Accuracy
      if (!place.category || !VALID_CATEGORIES.includes(place.category)) {
        console.error(`${placeIdStr}: Invalid category "${place.category}". Must be one of [${VALID_CATEGORIES.join(', ')}]`);
        totalErrors++;
      }

      // 4. Description Accuracy & Generic Template Check
      const desc = place.description || '';
      const shortDesc = place.shortDescription || '';
      if (!desc || typeof desc !== 'string' || desc.trim() === '') {
        console.error(`${placeIdStr}: Description is missing or empty.`);
        totalErrors++;
      } else {
        // Template checks (e.g. "A beautiful [category] spot in [district]")
        const templatePattern1 = /a beautiful .* spot in/i;
        const templatePattern2 = /explore .* in/i;
        const templatePattern3 = /a popular .* spot in/i;

        if (templatePattern1.test(desc) || templatePattern2.test(desc) || templatePattern3.test(desc) || desc.length < 30) {
          console.warn(`[WARN] ${placeIdStr}: Description might be template-generated or too brief: "${desc}"`);
        }
      }

      // 5. Slug Uniqueness
      if (!place.slug || typeof place.slug !== 'string' || place.slug.trim() === '') {
        console.error(`${placeIdStr}: Slug is missing.`);
        totalErrors++;
      } else {
        const slug = place.slug.toLowerCase().trim();
        const placeKey = `${place.name} (${place.districtName})`;
        if (globalSlugs.has(slug)) {
          console.error(`${placeIdStr}: Duplicate slug "${place.slug}" also defined in ${globalSlugs.get(slug)}.`);
          totalErrors++;
        } else {
          globalSlugs.set(slug, placeKey);
        }
      }

      // 6. Image Count & Validity
      if (!place.coverImage || typeof place.coverImage !== 'string' || place.coverImage.trim() === '') {
        console.error(`${placeIdStr}: Missing coverImage.`);
        totalErrors++;
      } else if (place.coverImage.includes('unsplash.com')) {
        console.error(`${placeIdStr}: Unsplash coverImage URL is forbidden.`);
        totalErrors++;
      } else if (place.coverImage.includes('Macaca_mulatta_eating_a_Citrus.jpg')) {
        console.error(`${placeIdStr}: Monkey placeholder image is forbidden as coverImage.`);
        totalErrors++;
      }

      const gallery = place.images || [];
      if (!Array.isArray(gallery) || gallery.length < 3 || gallery.length > 5) {
        console.error(`${placeIdStr}: Gallery image count must be between 3 and 5. Current count: ${gallery.length}`);
        totalErrors++;
      } else {
        gallery.forEach((img, idx) => {
          if (!img || img.trim() === '') {
            console.error(`${placeIdStr}: Gallery image at index ${idx} is empty.`);
            totalErrors++;
          } else {
            if (img.includes('unsplash.com')) {
              console.error(`${placeIdStr}: Gallery image at index ${idx} is Unsplash (forbidden).`);
              totalErrors++;
            }
            if (img.includes('Macaca_mulatta_eating_a_Citrus.jpg')) {
              console.error(`${placeIdStr}: Gallery image at index ${idx} is a monkey placeholder (forbidden).`);
              totalErrors++;
            }
          }
        });
      }

      // 7. Coordinate Validity
      if (!place.location || typeof place.location !== 'object') {
        console.error(`${placeIdStr}: Missing location object.`);
        totalErrors++;
      } else {
        const coords = place.location.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2) {
          console.error(`${placeIdStr}: Coordinates must be an array of [lng, lat]`);
          totalErrors++;
        } else {
          const [lng, lat] = coords;
          if (typeof lng !== 'number' || typeof lat !== 'number') {
            console.error(`${placeIdStr}: Coordinate values must be numeric. Got [${lng}, ${lat}]`);
            totalErrors++;
          } else {
            // AP boundaries check: Lat [12, 20], Lng [76, 85]
            if (lat < 12 || lat > 20 || lng < 76 || lng > 85) {
              console.error(`${placeIdStr}: Coordinates [${lng}, ${lat}] are outside Andhra Pradesh bounds.`);
              totalErrors++;
            }
          }
        }
      }
    });
  });

  console.log(`\nAttraction validation complete. Inspected ${totalPlaces} attractions in ${files.length} files.`);
  if (totalErrors > 0) {
    console.error(`\nValidation FAILED with ${totalErrors} error(s).`);
    process.exit(1);
  } else {
    console.log('\nValidation PASSED successfully! All attractions are structurally valid.');
    process.exit(0);
  }
}

validateAttractions();
