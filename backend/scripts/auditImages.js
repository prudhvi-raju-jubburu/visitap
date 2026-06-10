const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const REPORT_FILE = path.join(__dirname, '..', 'reports', 'image-audit.json');
const SEED_DATA_FILE = path.join(__dirname, '..', 'utils', 'seedData.js');

async function checkUrl(url) {
  const userAgent = 'VisitAP-Validator/1.0 (https://visitap.in; admin@visitap.in) Node/' + process.version;
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(4000)
    });
    return { ok: response.ok || response.status === 429, status: response.status, error: null };
  } catch (err) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(4000)
      });
      return { ok: response.ok || response.status === 429, status: response.status, error: null };
    } catch (err2) {
      return { ok: false, status: null, error: err2.message };
    }
  }
}

async function runAudit() {
  console.log('Running authentic image audit...');

  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Error: Districts directory does not exist at ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  const issues = [];
  const allPlaces = [];

  // Track global places image usages
  const coverImageUsage = new Map(); // url -> list of place names
  const galleryImageUsage = new Map(); // url -> list of place names

  // 1. Read all place files
  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    try {
      const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      places.forEach(place => {
        allPlaces.push({ ...place, sourceFile: file });
      });
    } catch (err) {
      console.error(`Error reading/parsing ${file}: ${err.message}`);
    }
  });

  // 2. Perform Place Checks
  allPlaces.forEach(place => {
    const name = place.name;
    const dist = place.districtName;
    const cover = place.coverImage;
    const gallery = place.images || [];

    // A. Check missing cover image
    if (!cover || typeof cover !== 'string' || cover.trim() === '') {
      issues.push({
        type: 'place',
        name,
        district: dist,
        issue: 'Missing cover image',
        details: 'Cover image field is empty'
      });
    } else {
      // Unsplash check
      if (cover.includes('unsplash.com')) {
        issues.push({
          type: 'place',
          name,
          district: dist,
          issue: 'Unsplash cover image',
          details: cover
        });
      }

      // Record cover usage
      if (!coverImageUsage.has(cover)) coverImageUsage.set(cover, []);
      coverImageUsage.get(cover).push(`${name} (${dist})`);
    }

    // B. Check gallery images
    if (gallery.length === 0) {
      issues.push({
        type: 'place',
        name,
        district: dist,
        issue: 'Empty gallery',
        details: 'Gallery images array is empty'
      });
    } else {
      const seenInPlace = new Set();
      gallery.forEach(img => {
        if (!img || typeof img !== 'string' || img.trim() === '') {
          issues.push({
            type: 'place',
            name,
            district: dist,
            issue: 'Empty gallery image entry',
            details: 'Gallery contains an empty string'
          });
          return;
        }

        // Unsplash check
        if (img.includes('unsplash.com')) {
          issues.push({
            type: 'place',
            name,
            district: dist,
            issue: 'Unsplash gallery image',
            details: img
          });
        }

        // Repeat inside gallery check
        if (seenInPlace.has(img)) {
          issues.push({
            type: 'place',
            name,
            district: dist,
            issue: 'Duplicate gallery image inside place',
            details: img
          });
        } else {
          seenInPlace.add(img);
        }

        // Cover image repeated in gallery check
        if (img === cover) {
          issues.push({
            type: 'place',
            name,
            district: dist,
            issue: 'Cover image repeated in gallery',
            details: img
          });
        }

        // Record global gallery usage
        if (!galleryImageUsage.has(img)) galleryImageUsage.set(img, []);
        galleryImageUsage.get(img).push(`${name} (${dist})`);
      });
    }
  });

  // C. Check global image duplication across different places
  coverImageUsage.forEach((usages, url) => {
    if (usages.length > 1) {
      usages.forEach(placeName => {
        issues.push({
          type: 'place',
          name: placeName.split(' (')[0],
          district: placeName.split(' (')[1].replace(')', ''),
          issue: 'Duplicate cover image across places',
          details: `Cover image shared with: ${usages.filter(u => u !== placeName).join(', ')} (URL: ${url})`
        });
      });
    }
  });

  galleryImageUsage.forEach((usages, url) => {
    if (usages.length > 1) {
      usages.forEach(placeName => {
        issues.push({
          type: 'place',
          name: placeName.split(' (')[0],
          district: placeName.split(' (')[1].replace(')', ''),
          issue: 'Duplicate gallery image across places',
          details: `Gallery image shared with: ${usages.filter(u => u !== placeName).join(', ')} (URL: ${url})`
        });
      });
    }
  });

  // 3. Perform District Checks (from seedData.js)
  let seedDistricts = [];
  if (fs.existsSync(SEED_DATA_FILE)) {
    try {
      const seedContent = fs.readFileSync(SEED_DATA_FILE, 'utf-8');
      const districtsMatch = seedContent.match(/const districts = (\[[\s\S]*?\]);/);
      if (districtsMatch) {
        // Safe evaluation to extract array
        seedDistricts = eval(districtsMatch[1]);
      }
    } catch (err) {
      console.warn(`Warning: Failed to parse seedData.js districts array: ${err.message}`);
    }
  }

  const districtImageUsage = new Map(); // url -> list of district names
  seedDistricts.forEach(d => {
    const name = d.name;
    const img = d.image;
    if (img) {
      if (img.includes('unsplash.com')) {
        issues.push({
          type: 'district',
          name,
          issue: 'Unsplash district image',
          details: img
        });
      }
      if (!districtImageUsage.has(img)) districtImageUsage.set(img, []);
      districtImageUsage.get(img).push(name);
    }
  });

  districtImageUsage.forEach((usages, url) => {
    if (usages.length > 1) {
      usages.forEach(distName => {
        issues.push({
          type: 'district',
          name: distName,
          issue: 'District image duplication',
          details: `District image shared with: ${usages.filter(u => u !== distName).join(', ')} (URL: ${url})`
        });
      });
    }
  });

  // 4. Perform URL Status Checks for Unique Images
  const uniqueUrls = new Set();
  allPlaces.forEach(p => {
    if (p.coverImage) uniqueUrls.add(p.coverImage);
    if (Array.isArray(p.images)) {
      p.images.forEach(img => {
        if (img) uniqueUrls.add(img);
      });
    }
  });
  seedDistricts.forEach(d => {
    if (d.image) uniqueUrls.add(d.image);
  });

  console.log(`Checking status of ${uniqueUrls.size} unique URLs...`);
  const urlArray = Array.from(uniqueUrls);
  const brokenUrls = new Set();

  const CONCURRENCY = 8;
  for (let i = 0; i < urlArray.length; i += CONCURRENCY) {
    const batch = urlArray.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (url) => {
      // Exclude Unsplash from URL checks (we already flagged it as an issue)
      if (url.includes('unsplash.com')) return;

      const res = await checkUrl(url);
      if (!res.ok) {
        brokenUrls.add(url);
      }
    }));
    process.stdout.write(`Progress: ${Math.min(i + CONCURRENCY, urlArray.length)}/${urlArray.length} checked\r`);
  }
  console.log('\nURL check finished.');

  // Map broken URLs back to issues
  allPlaces.forEach(place => {
    if (brokenUrls.has(place.coverImage)) {
      issues.push({
        type: 'place',
        name: place.name,
        district: place.districtName,
        issue: 'Broken cover image URL',
        details: place.coverImage
      });
    }
    if (Array.isArray(place.images)) {
      place.images.forEach(img => {
        if (brokenUrls.has(img)) {
          issues.push({
            type: 'place',
            name: place.name,
            district: place.districtName,
            issue: 'Broken gallery image URL',
            details: img
          });
        }
      });
    }
  });

  seedDistricts.forEach(d => {
    if (brokenUrls.has(d.image)) {
      issues.push({
        type: 'district',
        name: d.name,
        issue: 'Broken district image URL',
        details: d.image
      });
    }
  });

  // 5. Output Results
  const reportDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(issues, null, 2), 'utf-8');
  console.log(`\nImage audit completed. Found ${issues.length} issue(s).`);
  console.log(`Detailed report written to ${REPORT_FILE}`);
}

runAudit();
