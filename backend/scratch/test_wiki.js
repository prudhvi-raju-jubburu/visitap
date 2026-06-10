const crypto = require('crypto');

function getWikiUrl(filename) {
  let formatted = filename.trim().replace(/\s+/g, '_');
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  const hash = crypto.createHash('md5').update(formatted).digest('hex');
  const h1 = hash.substring(0, 1);
  const h2 = hash.substring(0, 2);
  return `https://upload.wikimedia.org/wikipedia/commons/${h1}/${h2}/${formatted}`;
}

async function checkUrl(url) {
  const userAgent = 'VisitAP-Validator/1.0 (https://visitap.in; admin@visitap.in) Node/' + process.version;
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(8000)
    });
    console.log('HEAD status:', response.status);
    return response.ok || response.status === 429;
  } catch (err) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(8000)
      });
      console.log('GET status:', response.status);
      return response.ok || response.status === 429;
    } catch (err2) {
      console.log('Fetch error:', err2.message);
      return false;
    }
  }
}

async function run() {
  const url = getWikiUrl('MAREDUMILLI - forest area.jpg');
  console.log('URL:', url);
  const ok = await checkUrl(url);
  console.log('OK:', ok);
}
run();
