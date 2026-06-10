// Using native fetch in Node 18+

const places = [
  { name: 'Vodarevu Beach', queries: ['Vodarevu', 'Chirala Beach', 'Chirala coast'] },
  { name: 'Vodarevu Fishing Port', queries: ['Vodarevu port', 'Vodarevu boat', 'Chirala port'] },
  { name: 'Ainavilli Vinayaka Temple', queries: ['Ainavilli', 'Ayinavilli', 'Ainavilli temple', 'Vigneswara temple Konaseema'] },
  { name: 'Peruru Heritage Village', queries: ['Peruru', 'Peruru village', 'Peruru Konaseema'] },
  { name: 'Maddinala Waterfall', queries: ['Maddinala', 'Yerrakalva', 'Eluru waterfall'] },
  { name: 'Dachapalli Caves', queries: ['Dachapalli', 'Dachapalle', 'Guntur caves'] },
  { name: 'Thotapalli Barrage Project', queries: ['Thotapalli', 'Thotapalle', 'Thotapalli project'] },
  { name: 'Thotapalli Reservoir', queries: ['Thotapalli reservoir', 'Thotapalli lake'] },
  { name: 'Venkatagiri Weaving Town', queries: ['Venkatagiri', 'Venkatagiri weaving', 'Venkatagiri saree'] },
  { name: 'Pennar Riverbed', queries: ['Pennar', 'Penna River', 'Pennar riverbed'] },
  { name: 'Rama Tirtham Temple', queries: ['Ramatirtham', 'Rama Tirtham', 'Ramatirtham temple'] },
  { name: 'Rama Tirtham Bodhikonda', queries: ['Bodhikonda', 'Ramatirtham hills', 'Ramatirtham ruins'] },
  { name: 'Rama Tirtham Water tank', queries: ['Ramatirtham tank', 'Ramatirtham pond'] },
  { name: 'Ksheerarama Gopuram', queries: ['Ksheerarama', 'CompleteTempleComplex', 'Ramalingeswara Swamy Gopuram'] },
  { name: 'Narsapur Lace Industry', queries: ['Narsapur lace', 'crochet lace', 'lace crocheting'] },
  { name: 'Lakkireddipalli Hills', queries: ['Lakkireddipalli', 'Lakkireddipally', 'Kadapa hills'] }
];

async function debug() {
  for (const p of places) {
    console.log(`\nDebugging: ${p.name}`);
    for (const q of p.queries) {
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&format=json&origin=*`;
      try {
        const res = await fetch(searchUrl);
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.log(`Query "${q}" failed to parse JSON. Raw response starts with:\n${text.substring(0, 300)}`);
          continue;
        }
        console.log(`Query "${q}" search results:`);
        if (data.query && data.query.search) {

          const matching = data.query.search.filter(item => /\.(jpe?g|png)$/i.test(item.title));
          if (matching.length > 0) {
            matching.slice(0, 5).forEach(item => {
              console.log(` - Title: ${item.title}`);
            });
          } else {
            console.log(' - No image files found');
          }
        } else {
          console.log(' - No results');
        }
      } catch (err) {
        console.error(`Error for query "${q}":`, err.message);
      }
    }
  }
}

debug();

