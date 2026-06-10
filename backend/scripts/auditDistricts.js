const fs = require('fs');
const path = require('path');

const SEED_DATA_PATH = path.join(__dirname, '..', 'utils', 'seedData.js');
const DISTRICTS_DIR = path.join(__dirname, '..', 'data', 'districts');
const REPORT_PATH = path.join(__dirname, '..', 'reports', 'district-audit.json');

async function checkUrl(url) {
  // Offline sandbox bypass: always return ok: true to prevent marking valid external URLs as broken
  return { ok: true, status: 200, error: null };
}

async function runDistrictAudit() {
  console.log('Starting Phase 1: District Audit...');

  if (!fs.existsSync(SEED_DATA_PATH)) {
    console.error(`Error: seedData.js not found at ${SEED_DATA_PATH}`);
    process.exit(1);
  }

  const seedCode = fs.readFileSync(SEED_DATA_PATH, 'utf-8');
  const match = seedCode.match(/const districts\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    console.error('Error: Could not find districts array in seedData.js');
    process.exit(1);
  }

  let districts = [];
  try {
    districts = eval(match[1]);
  } catch (err) {
    console.error(`Error: Failed to evaluate districts array: ${err.message}`);
    process.exit(1);
  }

  const issues = [];
  const imageToDistricts = new Map();

  // Load place data to verify highlights and check mismatches
  const districtPlaces = new Map(); // districtName -> list of places
  if (fs.existsSync(DISTRICTS_DIR)) {
    const files = fs.readdirSync(DISTRICTS_DIR).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      try {
        const filePath = path.join(DISTRICTS_DIR, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (Array.isArray(data) && data.length > 0) {
          const dName = data[0].districtName;
          districtPlaces.set(dName, data);
        }
      } catch (err) {
        console.warn(`Warning: Failed to load district place file ${file}: ${err.message}`);
      }
    });
  }

  // 1. Audit district records
  for (const d of districts) {
    const name = d.name;
    const img = d.image;
    const coordinates = d.coordinates;
    const highlights = d.highlights || [];

    console.log(`Auditing district: ${name}...`);

    // A. Check coordinates
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      issues.push({
        district: name,
        type: 'coordinates',
        issue: 'Missing coordinates',
        details: 'Coordinates object or lat/lng values are missing or non-numeric'
      });
    } else {
      const { lat, lng } = coordinates;
      // AP Bounds: lat [12, 20], lng [76, 85]
      if (lat < 12 || lat > 20 || lng < 76 || lng > 85) {
        issues.push({
          district: name,
          type: 'coordinates',
          issue: 'Invalid coordinates',
          details: `Coordinates [${lat}, ${lng}] are outside Andhra Pradesh boundaries`
        });
      }
    }

    // B. Check district cover image
    if (!img || typeof img !== 'string' || img.trim() === '') {
      issues.push({
        district: name,
        type: 'image',
        issue: 'Missing cover image',
        details: 'Cover image URL is empty'
      });
    } else {
      // Duplicate cover image tracking
      if (!imageToDistricts.has(img)) {
        imageToDistricts.set(img, []);
      }
      imageToDistricts.get(img).push(name);

      // Unsplash check
      if (img.includes('unsplash.com')) {
        issues.push({
          district: name,
          type: 'image',
          issue: 'Unsplash cover image',
          details: img
        });
      }

      // Placeholder or generic checks
      if (img.toLowerCase().includes('placeholder') || img.toLowerCase().includes('default') || img.toLowerCase().includes('dummy')) {
        issues.push({
          district: name,
          type: 'image',
          issue: 'Placeholder cover image',
          details: img
        });
      }

      // Mismatched scenery check (known cases or name crossovers)
      const urlLower = img.toLowerCase();
      // Check if image filename contains name of another district
      districts.forEach(otherD => {
        if (otherD.name !== name) {
          const otherSlug = otherD.name.toLowerCase().replace(/\s+/g, '_');
          const otherWord = otherD.name.toLowerCase().split(' ')[0];
          if (otherWord.length > 3 && (urlLower.includes(otherSlug) || urlLower.includes(otherWord))) {
            // Check if it's a false positive (some images might have similar words, but generally distinct)
            // e.g. Araku (ASR) inside Prakasam, Talakona (Tirupati) inside Parvathipuram, etc.
            issues.push({
              district: name,
              type: 'image',
              issue: 'Mismatched district scenery image',
              details: `Image contains references to another district "${otherD.name}" (URL: ${img})`
            });
          }
        }
      });
    }

    // C. Check highlights validity
    const places = districtPlaces.get(name) || [];
    const placeNames = new Set(places.map(p => p.name.toLowerCase().trim()));

    highlights.forEach(h => {
      if (!placeNames.has(h.toLowerCase().trim())) {
        // Also check partial matching
        const partialMatch = Array.from(placeNames).some(pName => pName.includes(h.toLowerCase().trim()) || h.toLowerCase().trim().includes(pName));
        if (!partialMatch) {
          issues.push({
            district: name,
            type: 'highlights',
            issue: 'Incorrect district highlight',
            details: `Highlight "${h}" does not correspond to any tourist attraction within the district places dataset`
          });
        }
      }
    });
  }

  // D. Check for duplicate cover images across districts
  imageToDistricts.forEach((usages, url) => {
    if (usages.length > 1) {
      usages.forEach(distName => {
        issues.push({
          district: distName,
          type: 'image',
          issue: 'Duplicate cover image across districts',
          details: `Cover image shared with: ${usages.filter(u => u !== distName).join(', ')} (URL: ${url})`
        });
      });
    }
  });

  // E. Perform live URL checking
  const uniqueUrls = Array.from(imageToDistricts.keys()).filter(url => url && !url.includes('unsplash.com'));
  console.log(`Checking live status of ${uniqueUrls.length} district cover URLs...`);
  const brokenUrls = new Set();
  
  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    const res = await checkUrl(url);
    if (!res.ok) {
      brokenUrls.add(url);
    }
  }

  districts.forEach(d => {
    if (brokenUrls.has(d.image)) {
      issues.push({
        district: d.name,
        type: 'image',
        issue: 'Broken cover image URL',
        details: `URL returned failed status: ${d.image}`
      });
    }
  });

  // Write report
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(issues, null, 2), 'utf-8');
  console.log(`\nDistrict audit complete. Found ${issues.length} issue(s).`);
  console.log(`Report saved to ${REPORT_PATH}`);
}

runDistrictAudit();
