const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');

const VALID_CATEGORIES = [
  'Temple / Religious', 'Beach', 'Hill Station', 'Historical', 'Nature', 'Waterfalls', 
  'Wildlife', 'Adventure', 'City', 'Culture', 'Heritage', 'Backwaters', 'Tribal', 'Pilgrimage', 'Other'
];

function validateDataset() {
  console.log('Starting dataset validation...');

  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Error: Districts directory does not exist at ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  if (files.length === 0) {
    console.error('Error: No JSON files found in districts directory.');
    process.exit(1);
  }

  let totalErrors = 0;
  let totalPlaces = 0;

  const globalSlugs = new Map(); // slug -> { file, placeName }
  
  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    let districtPlaces = [];

    try {
      districtPlaces = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (err) {
      console.error(`Error: Failed to parse JSON file ${file}: ${err.message}`);
      totalErrors++;
      return;
    }

    if (!Array.isArray(districtPlaces)) {
      console.error(`Error in ${file}: Expected top-level array of places.`);
      totalErrors++;
      return;
    }

    const districtPlaceNames = new Set();

    districtPlaces.forEach((place, index) => {
      totalPlaces++;
      const placeIdStr = `[File: ${file}, Index: ${index}, Name: "${place.name || 'UNKNOWN'}"]`;

      // 1. Check name
      if (!place.name || typeof place.name !== 'string' || place.name.trim() === '') {
        console.error(`${placeIdStr}: Missing or invalid name.`);
        totalErrors++;
      }

      // 2. Check duplicate place name within the same district
      if (place.name) {
        const normalizedName = place.name.toLowerCase().trim();
        if (districtPlaceNames.has(normalizedName)) {
          console.error(`${placeIdStr}: Duplicate place name "${place.name}" in district file ${file}.`);
          totalErrors++;
        } else {
          districtPlaceNames.add(normalizedName);
        }
      }

      // 3. Check slug
      if (!place.slug || typeof place.slug !== 'string' || place.slug.trim() === '') {
        console.error(`${placeIdStr}: Missing or invalid slug.`);
        totalErrors++;
      } else {
        const normalizedSlug = place.slug.toLowerCase().trim();
        if (globalSlugs.has(normalizedSlug)) {
          const original = globalSlugs.get(normalizedSlug);
          console.error(`${placeIdStr}: Duplicate slug "${place.slug}". Already defined in ${original.file} for place "${original.placeName}".`);
          totalErrors++;
        } else {
          globalSlugs.set(normalizedSlug, { file, placeName: place.name });
        }
      }

      // 4. Check districtName
      if (!place.districtName || typeof place.districtName !== 'string' || place.districtName.trim() === '') {
        console.error(`${placeIdStr}: Missing or invalid districtName.`);
        totalErrors++;
      }

      // 5. Check description
      if (!place.description || typeof place.description !== 'string' || place.description.trim() === '') {
        console.error(`${placeIdStr}: Missing or invalid description.`);
        totalErrors++;
      }

      // 6. Check category
      if (!place.category || !VALID_CATEGORIES.includes(place.category)) {
        console.error(`${placeIdStr}: Invalid category "${place.category}". Must be one of: [${VALID_CATEGORIES.join(', ')}]`);
        totalErrors++;
      }

      // 7. Check location and coordinates
      if (!place.location || typeof place.location !== 'object') {
        console.error(`${placeIdStr}: Missing or invalid location object.`);
        totalErrors++;
      } else {
        if (place.location.type !== 'Point') {
          console.error(`${placeIdStr}: Location type must be "Point". Got "${place.location.type}".`);
          totalErrors++;
        }
        if (!Array.isArray(place.location.coordinates) || place.location.coordinates.length !== 2) {
          console.error(`${placeIdStr}: Coordinates must be an array of [longitude, latitude].`);
          totalErrors++;
        } else {
          const [lng, lat] = place.location.coordinates;
          if (typeof lng !== 'number' || isNaN(lng) || typeof lat !== 'number' || isNaN(lat)) {
            console.error(`${placeIdStr}: Coordinates must be valid numbers. Got [${lng}, ${lat}].`);
            totalErrors++;
          } else {
            // Verify AP boundary limits roughly: Longitude [76, 85], Latitude [12, 20]
            if (lng < 70 || lng > 90 || lat < 10 || lat > 22) {
              console.warn(`Warning: Coordinate values [${lng}, ${lat}] might be outside Andhra Pradesh boundaries.`);
            }
          }
        }
      }

      // 8. Check coverImage
      if (!place.coverImage || typeof place.coverImage !== 'string' || place.coverImage.trim() === '') {
        console.error(`${placeIdStr}: Missing coverImage.`);
        totalErrors++;
      } else {
        if (place.coverImage.includes('unsplash.com')) {
          console.error(`${placeIdStr}: Cover image URL must not be from Unsplash: ${place.coverImage}`);
          totalErrors++;
        }
      }

      // 9. Check images array
      if (!Array.isArray(place.images) || place.images.length === 0) {
        console.error(`${placeIdStr}: Missing or empty images array.`);
        totalErrors++;
      } else {
        place.images.forEach((img, idx) => {
          if (!img || typeof img !== 'string' || img.trim() === '') {
            console.error(`${placeIdStr}: Image at index ${idx} is empty or invalid.`);
            totalErrors++;
          } else if (img.includes('unsplash.com')) {
            console.error(`${placeIdStr}: Image URL at index ${idx} must not be from Unsplash: ${img}`);
            totalErrors++;
          }
        });
      }
    });
  });

  console.log(`\nValidation complete. Inspected ${totalPlaces} attractions in ${files.length} district files.`);
  if (totalErrors > 0) {
    console.error(`\nValidation FAILED with ${totalErrors} error(s). Please fix the issues before proceeding.`);
    process.exit(1);
  } else {
    console.log('\nValidation PASSED successfully! All data conforms to standard requirements.');
    process.exit(0);
  }
}

validateDataset();
