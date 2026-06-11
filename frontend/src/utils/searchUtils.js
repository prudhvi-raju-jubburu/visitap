import { fetchDistricts, fetchPlaces } from '../services/api';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

let cachedDistricts = [];
let cachedPlaces = [];
let isLoaded = false;
let loadPromise = null;

export async function loadSearchIndex() {
  if (isLoaded) {
    return { districts: cachedDistricts, places: cachedPlaces };
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const now = Date.now();
    try {
      // Check localStorage cache first
      const cachedDStr = localStorage.getItem('visitap_search_districts');
      const cachedPStr = localStorage.getItem('visitap_search_places');
      
      let cacheValid = false;
      if (cachedDStr && cachedPStr) {
        const cachedD = JSON.parse(cachedDStr);
        const cachedP = JSON.parse(cachedPStr);
        
        if (
          cachedD.timestamp && now - cachedD.timestamp < CACHE_DURATION &&
          cachedP.timestamp && now - cachedP.timestamp < CACHE_DURATION
        ) {
          cachedDistricts = cachedD.data || [];
          cachedPlaces = cachedP.data || [];
          isLoaded = true;
          cacheValid = true;
        }
      }

      if (!cacheValid) {
        const [dRes, pRes] = await Promise.all([
          fetchDistricts(),
          fetchPlaces()
        ]);
        cachedDistricts = dRes.data?.data || [];
        cachedPlaces = pRes.data?.data || [];
        
        // Update localStorage
        localStorage.setItem('visitap_search_districts', JSON.stringify({
          data: cachedDistricts,
          timestamp: now
        }));
        localStorage.setItem('visitap_search_places', JSON.stringify({
          data: cachedPlaces,
          timestamp: now
        }));
        isLoaded = true;
      }
    } catch (error) {
      console.error('Error loading search index, trying fallback:', error);
      // Try loading ANY cached data even if expired
      try {
        const cachedDStr = localStorage.getItem('visitap_search_districts');
        const cachedPStr = localStorage.getItem('visitap_search_places');
        if (cachedDStr) cachedDistricts = JSON.parse(cachedDStr).data || [];
        if (cachedPStr) cachedPlaces = JSON.parse(cachedPStr).data || [];
        if (cachedDistricts.length > 0) {
          isLoaded = true;
        }
      } catch (e) {
        console.error('Failed to read expired cache:', e);
      }
    }
    return { districts: cachedDistricts, places: cachedPlaces };
  })();

  return loadPromise;
}

export function normalizeSearchText(text) {
  if (!text) return '';
  let norm = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "") // remove punctuation
    .replace(/\s+/g, ' ') // normalize spaces
    .trim();

  // Replace common synonyms/variations
  const synonyms = {
    'vizag': 'visakhapatnam',
    'ramakrishna beach': 'rk beach',
    'tirupathi': 'tirupati',
    'vizianagaram': 'vizianagaram',
    'araku': 'araku valley',
    'borra': 'borra caves',
    'gandikota': 'gandikota fort',
    'talakona': 'talakona waterfalls',
  };

  // Replace whole words or match patterns
  for (const [key, val] of Object.entries(synonyms)) {
    if (norm === key) {
      norm = val;
    } else {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      norm = norm.replace(regex, val);
    }
  }

  return norm;
}

export function parseNaturalLanguage(text) {
  let norm = normalizeSearchText(text);

  // Prefixes to strip
  const prefixes = [
    /^show me /,
    /^show /,
    /^open /,
    /^take me to /,
    /^go to /,
    /^navigate to /,
    /^search for /,
    /^search /,
    /^find /,
    /^display /,
    /^redirect to /,
    /^navigate /
  ];

  // Suffixes to strip
  const suffixes = [
    / places$/,
    / locations$/,
    / near me$/,
    / district$/,
    / area$/,
    / region$/
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of prefixes) {
      if (prefix.test(norm)) {
        norm = norm.replace(prefix, '');
        changed = true;
      }
    }
    for (const suffix of suffixes) {
      if (suffix.test(norm)) {
        norm = norm.replace(suffix, '');
        changed = true;
      }
    }
  }

  return norm.trim();
}

export function searchCategories(text) {
  const norm = normalizeSearchText(text);

  // Map keywords to categories
  const categoryKeywords = {
    'Beach': ['beach', 'beaches', 'sea', 'coast', 'shore', 'seashores'],
    'Temple / Religious': ['temple', 'temples', 'religious', 'sacred', 'worship', 'church', 'mosque'],
    'Hill Station': ['hill station', 'hill stations', 'hill', 'hills', 'valley', 'valleys', 'ghat', 'mountain', 'mountains'],
    'Historical': ['historical', 'history', 'fort', 'forts', 'monument', 'monuments', 'palace', 'palaces', 'ruin', 'ruins'],
    'Nature': ['nature', 'natural', 'greenery', 'park', 'parks', 'garden', 'gardens', 'scenic'],
    'Waterfalls': ['waterfall', 'waterfalls', 'falls', 'cascade', 'cascades'],
    'Wildlife': ['wildlife', 'sanctuary', 'sanctuaries', 'zoo', 'safari', 'national park', 'deer park', 'animal', 'animals', 'bird', 'birds'],
    'Adventure': ['adventure', 'trekking', 'trek', 'climbing', 'canyon', 'camping', 'hiking'],
    'City': ['city', 'cities', 'urban', 'town', 'towns'],
    'Culture': ['culture', 'cultural', 'art', 'arts', 'museum', 'museums', 'festival', 'festivals'],
    'Heritage': ['heritage', 'heritage site', 'heritage sites'],
    'Backwaters': ['backwater', 'backwaters', 'lake', 'lakes', 'reservoir', 'reservoirs', 'river', 'rivers', 'boat', 'boating', 'canal', 'canals'],
    'Tribal': ['tribal', 'tribe', 'tribes', 'village', 'villages', 'indigenous'],
    'Pilgrimage': ['pilgrimage', 'pilgrim', 'pilgrims', 'holy']
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => norm === kw || norm.includes(kw))) {
      return category;
    }
  }

  return null;
}

export function findBestMatch(query, districts = [], places = []) {
  const cleanQuery = parseNaturalLanguage(query);
  const normQuery = normalizeSearchText(cleanQuery);

  if (!normQuery) return null;

  // 1. Exact Place Match
  const exactPlace = places.find(p => 
    normalizeSearchText(p.name) === normQuery || 
    p.slug === normQuery
  );
  if (exactPlace) {
    return { type: 'place', data: exactPlace };
  }

  // 2. Exact District Match
  const exactDistrict = districts.find(d => 
    normalizeSearchText(d.name) === normQuery || 
    d.slug === normQuery
  );
  if (exactDistrict) {
    return { type: 'district', data: exactDistrict };
  }

  // 3. Category Match
  const categoryMatch = searchCategories(normQuery);
  if (categoryMatch) {
    return { type: 'category', data: categoryMatch };
  }

  // 4. Partial Place Match
  const partialPlace = places.find(p => {
    const normName = normalizeSearchText(p.name);
    return normName.includes(normQuery) || normQuery.includes(normName);
  });
  if (partialPlace) {
    return { type: 'place', data: partialPlace };
  }

  // 5. Partial District Match
  const partialDistrict = districts.find(d => {
    const normName = normalizeSearchText(d.name);
    return normName.includes(normQuery) || normQuery.includes(normName);
  });
  if (partialDistrict) {
    return { type: 'district', data: partialDistrict };
  }

  return null;
}

export function getSuggestions(query, districts = [], places = []) {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) {
    return {
      places: places.slice(0, 3),
      districts: districts.slice(0, 3),
      categories: ['Beach', 'Temple / Religious', 'Waterfalls']
    };
  }

  const similarPlaces = places.filter(p => {
    const normName = normalizeSearchText(p.name);
    return normName.includes(normQuery) || normQuery.includes(normName) || 
           normQuery.split(' ').some(word => word.length > 2 && normName.includes(word));
  }).slice(0, 3);

  const similarDistricts = districts.filter(d => {
    const normName = normalizeSearchText(d.name);
    return normName.includes(normQuery) || normQuery.includes(normName) ||
           normQuery.split(' ').some(word => word.length > 2 && normName.includes(word));
  }).slice(0, 3);

  const categories = [
    'Beach', 'Temple / Religious', 'Hill Station', 'Historical', 'Nature', 
    'Waterfalls', 'Wildlife', 'Adventure', 'City', 'Culture', 'Heritage', 
    'Backwaters', 'Tribal', 'Pilgrimage'
  ];
  
  const similarCategories = categories.filter(cat => {
    const normCat = normalizeSearchText(cat);
    return normCat.includes(normQuery) || normQuery.includes(normCat) ||
           (cat === 'Temple / Religious' && (normQuery.includes('temple') || normQuery.includes('religious')));
  }).slice(0, 3);

  return {
    places: similarPlaces.length > 0 ? similarPlaces : places.slice(0, 3),
    districts: similarDistricts.length > 0 ? similarDistricts : districts.slice(0, 3),
    categories: similarCategories.length > 0 ? similarCategories : ['Beach', 'Temple / Religious', 'Waterfalls']
  };
}
