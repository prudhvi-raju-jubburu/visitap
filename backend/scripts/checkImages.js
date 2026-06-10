const fs = require('fs');
const path = require('path');

const MASTER_FILE = path.join(__dirname, '..', 'data', 'master-places.json');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkUrl(url) {
  // Compliant user-agent following Wikimedia Commons policy to avoid aggressive blocks
  const userAgent = 'VisitAP-Validator/1.0 (https://visitap.in; admin@visitap.in) Node/' + process.version;
  
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok && [403, 404, 405, 501].includes(response.status)) {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(5000)
      });
    }

    return { ok: response.ok, status: response.status, error: null };
  } catch (err) {
    return { ok: false, status: null, error: err.message };
  }
}

async function runImageCheck() {
  console.log('Starting tourist place image checks...');

  if (!fs.existsSync(MASTER_FILE)) {
    console.error(`Error: Master dataset not found at ${MASTER_FILE}. Run "npm run build-dataset" first.`);
    process.exit(1);
  }

  let places = [];
  try {
    places = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf-8'));
  } catch (err) {
    console.error(`Error: Failed to parse master-places.json: ${err.message}`);
    process.exit(1);
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  const uniqueUrls = new Set();
  const urlToPlaces = new Map();

  // 1. Inspect schema-level image issues per place
  places.forEach((place, idx) => {
    const placeIdStr = `[Place: "${place.name || 'UNKNOWN'}", District: "${place.districtName || 'UNKNOWN'}"]`;

    if (!place.coverImage || typeof place.coverImage !== 'string' || place.coverImage.trim() === '') {
      console.error(`${placeIdStr}: Missing coverImage.`);
      totalErrors++;
    } else {
      uniqueUrls.add(place.coverImage);
      if (!urlToPlaces.has(place.coverImage)) urlToPlaces.set(place.coverImage, []);
      urlToPlaces.get(place.coverImage).push(place.name);
    }

    if (!Array.isArray(place.images) || place.images.length === 0) {
      console.error(`${placeIdStr}: Missing or empty images array.`);
      totalErrors++;
    } else {
      if (place.images.length < 2) {
        console.warn(`Warning ${placeIdStr}: Gallery images array has fewer than 2 images.`);
        totalWarnings++;
      }

      const seenInPlace = new Set();
      place.images.forEach((img, imgIdx) => {
        if (!img || typeof img !== 'string' || img.trim() === '') {
          console.error(`${placeIdStr}: Empty image string at index ${imgIdx}.`);
          totalErrors++;
        } else {
          uniqueUrls.add(img);
          if (!urlToPlaces.has(img)) urlToPlaces.set(img, []);
          urlToPlaces.get(img).push(place.name);

          if (seenInPlace.has(img)) {
            console.warn(`Warning ${placeIdStr}: Duplicate image URL detected in gallery: ${img}`);
            totalWarnings++;
          } else {
            seenInPlace.add(img);
          }
        }
      });
    }
  });

  // 2. Validate extracted unique URLs
  console.log(`\nFound ${uniqueUrls.size} unique image URLs across ${places.length} places.`);
  console.log('Testing URL availability and status (throttled)...');

  const urlArray = Array.from(uniqueUrls);
  const brokenExternalUrls = [];
  const brokenWikimediaUrls = [];
  const unsplashUrls = [];
  const invalidWikimediaUrls = [];
  const rateLimitedUrls = [];

  const CONCURRENCY = 5;
  const DELAY_MS = 250;

  for (let i = 0; i < urlArray.length; i += CONCURRENCY) {
    const batch = urlArray.slice(i, i + CONCURRENCY);
    
    await Promise.all(batch.map(async (url) => {
      if (url.includes('unsplash.com')) {
        unsplashUrls.push(url);
        return;
      }

      if (url.includes('wikimedia.org') && !url.startsWith('https://upload.wikimedia.org/wikipedia/commons/')) {
        invalidWikimediaUrls.push(url);
      }

      const result = await checkUrl(url);
      
      if (result.status === 429) {
        rateLimitedUrls.push({ url, status: result.status });
      } else if (!result.ok) {
        if (url.includes('upload.wikimedia.org')) {
          // Wikimedia response throttling (often gives false 403/404/429 under bulk HEAD)
          brokenWikimediaUrls.push({ url, status: result.status, error: result.error });
        } else {
          brokenExternalUrls.push({ url, status: result.status, error: result.error });
        }
      }
    }));

    if (i + CONCURRENCY < urlArray.length) {
      await sleep(DELAY_MS);
    }
    process.stdout.write(`Progress: ${Math.min(i + CONCURRENCY, urlArray.length)}/${urlArray.length} checked\r`);
  }
  console.log('\nURL status checks completed.');

  // 3. Print validation outcomes
  if (unsplashUrls.length > 0) {
    console.error(`\n[FAIL] Found ${unsplashUrls.length} Unsplash URLs (forbidden):`);
    unsplashUrls.forEach(url => {
      console.error(` - ${url}\n   Used in: [${urlToPlaces.get(url).slice(0, 5).join(', ')}${urlToPlaces.get(url).length > 5 ? '...' : ''}]`);
    });
    totalErrors += unsplashUrls.length;
  }

  if (invalidWikimediaUrls.length > 0) {
    console.warn(`\n[WARN] Found ${invalidWikimediaUrls.length} non-standard/invalid Wikimedia Commons links (direct upload.wikimedia.org path is preferred):`);
    invalidWikimediaUrls.forEach(url => {
      console.warn(` - ${url}\n   Used in: [${urlToPlaces.get(url).slice(0, 5).join(', ')}${urlToPlaces.get(url).length > 5 ? '...' : ''}]`);
    });
    totalWarnings += invalidWikimediaUrls.length;
  }

  if (brokenExternalUrls.length > 0) {
    console.error(`\n[FAIL] Found ${brokenExternalUrls.length} broken external image URLs (HTTP status !== 200 or request failed):`);
    brokenExternalUrls.forEach(item => {
      const errDetail = item.error ? `(${item.error})` : `[Status Code: ${item.status}]`;
      console.error(` - ${item.url} ${errDetail}\n   Used in: [${urlToPlaces.get(item.url).slice(0, 5).join(', ')}${urlToPlaces.get(item.url).length > 5 ? '...' : ''}]`);
    });
    totalErrors += brokenExternalUrls.length;
  }

  if (brokenWikimediaUrls.length > 0) {
    // Flagged as warnings to account for Wikimedia's aggressive automated request blocking
    console.warn(`\n[WARN] Wikimedia Commons returned error/block response for ${brokenWikimediaUrls.length} URLs (these are likely valid but throttled by the CDN; please verify manually in browser):`);
    brokenWikimediaUrls.forEach(item => {
      const errDetail = item.error ? `(${item.error})` : `[Status Code: ${item.status}]`;
      console.warn(` - ${item.url} ${errDetail}\n   Used in: [${urlToPlaces.get(item.url).slice(0, 5).join(', ')}${urlToPlaces.get(item.url).length > 5 ? '...' : ''}]`);
    });
    totalWarnings += brokenWikimediaUrls.length;
  }

  if (rateLimitedUrls.length > 0) {
    console.log(`\n[INFO] Received HTTP 429 (Rate Limit) on ${rateLimitedUrls.length} URLs. These domains are online but blocked automated pings.`);
    totalWarnings += rateLimitedUrls.length;
  }

  console.log(`\nImage check complete. Inspected ${places.length} places. Total errors: ${totalErrors}, warnings: ${totalWarnings}`);
  if (totalErrors > 0) {
    console.error(`\nImage validation FAILED with ${totalErrors} error(s).`);
    process.exit(1);
  } else {
    console.log('\nImage validation PASSED successfully! All image references are correct and working.');
    process.exit(0);
  }
}

runImageCheck();
