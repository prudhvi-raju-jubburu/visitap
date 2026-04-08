const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const District = require('../models/District');
const Place = require('../models/Place');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');

const districts = [
  { name: 'Visakhapatnam', description: 'The City of Destiny, Visakhapatnam is a beautiful coastal city known for its pristine beaches, lush green hills, and a rich history.', shortDescription: 'The Jewel of the East Coast with stunning beaches and hills.', image: 'https://images.unsplash.com/photo-1597149959822-e3df04f4e20d?w=1200', highlights: ['RK Beach', 'Kailasagiri', 'Simhachalam', 'Rushikonda'], coordinates: { lat: 17.6868, lng: 83.2185 } },
  { name: 'Tirupati', description: 'The Spiritual Capital of Andhra Pradesh, Tirupati is home to the world-famous Tirumala Venkateswara Temple.', shortDescription: 'Abode of Lord Venkateswara and a major spiritual center.', image: 'https://images.unsplash.com/photo-1620668045353-066b69b55239?w=1200', highlights: ['Tirumala Temple', 'Chandragiri Fort', 'Srikalahasti', 'Talakona'], coordinates: { lat: 13.6288, lng: 79.4192 } },
  { name: 'Alluri Sitharama Raju', description: 'Named after the legendary freedom fighter, this district is a paradise of tribal culture and misty mountains.', shortDescription: 'Tribal heartland with misty valleys and coffee gardens.', image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1200', highlights: ['Araku Valley', 'Borra Caves', 'Lambasingi', 'Maredumilli'], coordinates: { lat: 18.0673, lng: 82.6844 } },
  { name: 'Anantapur', description: 'Rich in history and spirituality, Anantapur is known for the monumental Lepakshi temple and the Gooty Fort.', shortDescription: 'Historical gateway with ancient forts and temples.', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200', highlights: ['Lepakshi', 'Gooty Fort', 'Penukonda', 'Dharmavaram'], coordinates: { lat: 14.6819, lng: 77.6006 } },
  { name: 'Kurnool', description: 'The Gateway to Rayalaseema, Kurnool is famous for the stunning Gandikota Canyon and Belum Caves.', shortDescription: 'Land of Gandikota Canyon and ancient rock formations.', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200', highlights: ['Gandikota', 'Belum Caves', 'Konda Reddy Buruzu', 'Mantralayam'], coordinates: { lat: 15.8281, lng: 78.0373 } },
  { name: 'Dr. B.R. Ambedkar Konaseema', description: 'Known as God\'s Own Creation, Konaseema is a delta region famous for its lush coconut groves and backwaters.', shortDescription: 'The lush green paradise of coconut groves and backwaters.', image: 'https://images.unsplash.com/photo-1599930113854-d6d7fd522504?w=1200', highlights: ['Dindi', 'Antarvedi', 'Ainavilli', 'Peruru'], coordinates: { lat: 16.5165, lng: 81.8973 } },
  { name: 'Srikakulam', description: 'Srikakulam district is home to several famous temples, beautiful beaches, and natural attractions that reflect its rich cultural heritage and scenic beauty.', shortDescription: 'Northern coastal beauty with solar temples and beaches.', image: 'https://images.unsplash.com/photo-1611236682696-8a66e34efa62?w=1200', highlights: ['Arasavalli Sun Temple', 'Srikurmam Temple', 'Kalingapatnam Beach', 'Baruva Beach'], coordinates: { lat: 18.2949, lng: 83.8935 } },
  { name: 'NTR', description: 'Named after the legendary actor and CM, NTR district features the vibrant city of Vijayawada.', shortDescription: 'Dynamic hub of culture, commerce and spirituality.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200', highlights: ['Kanaka Durga Temple', 'Prakasam Barrage', 'Bhavani Island', 'Kondapalli'], coordinates: { lat: 16.5062, lng: 80.6480 } },
  { name: 'YSR Kadapa', description: 'Historical heart of Rayalaseema, Kadapa is known for its ancient temples and forts.', shortDescription: 'Land of historic forts and spiritual centers.', image: 'https://images.unsplash.com/photo-1544013919-4bc279585965?w=1200', highlights: ['Vontimitta', 'Gandikota', 'Siddavatam Fort', 'Brahmamgari Matham'], coordinates: { lat: 14.4674, lng: 78.8241 } },
  { name: 'SPSR Nellore', description: 'Famous for its aquaculture and the Pulicat Lake bird sanctuary.', shortDescription: 'Coastal district famous for Pulicat Lake and spicy food.', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200', highlights: ['Pulicat Lake', 'Nelapattu', 'Mypadu Beach', 'Udayagiri Fort'], coordinates: { lat: 14.4426, lng: 79.9865 } },
  { name: 'Guntur', description: 'A major educational and commercial hub, Guntur is near the historic Amaravati.', shortDescription: 'Heart of Andhra with rich history and chili markets.', image: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1200', highlights: ['Amaravati', 'Uppalapadu', 'Kondaveedu Fort', 'Kotappakonda'], coordinates: { lat: 16.3008, lng: 80.4428 } },
  { name: 'Annakapalli', description: 'Adjoining Vizag, Anakapalli is famous for its jaggery market and the scenic Kondakarla Ava freshwater lake.', shortDescription: 'Jaggery hub with beautiful freshwater lakes.', image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200', highlights: ['Kondakarla Ava', 'Bojjannakonda', 'Upaka Forest'], coordinates: { lat: 17.6896, lng: 83.0024 } },
  { name: 'Nandyal', description: 'Recently carved from Kurnool, Nandyal is surrouned by the Nallamala forests and features the sacred Mahanandi temple.', shortDescription: 'Forest gateway with ancient Shiva temples.', image: 'https://images.unsplash.com/photo-1563283256-51268ee70077?w=1200', highlights: ['Mahanandi', 'Ahobilam', 'Srisailam (part)', 'Nallamala'], coordinates: { lat: 15.4847, lng: 78.4812 } },
  { name: 'Eluru', description: 'Home to the massive Kolleru Lake, Eluru is a district of lakes and Buddhist heritage.', shortDescription: 'Land of the giant Kolleru freshwater lake.', image: 'https://images.unsplash.com/photo-1611236682696-8a66e34efa62?w=1200', highlights: ['Kolleru Lake', 'Dwaraka Tirumala', 'Guntupalli Caves'], coordinates: { lat: 16.7107, lng: 81.1035 } },
  { name: 'Kakinada', description: 'A major port city known as the Fertilizer City, Kakinada offers beautiful beaches and mangroves.', shortDescription: 'Port city with mangroves and scenic beaches.', image: 'https://images.unsplash.com/photo-1517245315814-1352bd996452?w=1200', highlights: ['Coringa', 'Hope Island', 'Kakinada Beach', 'Uppada'], coordinates: { lat: 16.9891, lng: 82.2475 } },
  { name: 'Krishna', description: 'Named after the sacred river, Krishna district is a cultural heartland with a rich tradition of arts.', shortDescription: 'Delta district with a rich riverine heritage.', image: 'https://images.unsplash.com/photo-1502726299822-6f583f972e02?w=1200', highlights: ['Machilipatnam', 'Hamsaladeevi', 'Kuchipudi'], coordinates: { lat: 16.1675, lng: 81.1320 } },
  { name: 'Palnadu', description: 'Historical region known for the battle of Palnadu, featuring the Nagarjuna Sagar dam.', shortDescription: 'Land of historic battles and massive dams.', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', highlights: ['Nagarjuna Sagar', 'Ethipothala', 'Amaravati'], coordinates: { lat: 16.3500, lng: 79.7100 } },
  { name: 'Bapatla', description: 'A coastal district famous for the Suryalanka beach and historical temples.', shortDescription: 'Pristine coastal town with famous sun-kissed beaches.', image: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1200', highlights: ['Suryalanka', 'Vodarevu', 'Bapatla Temple'], coordinates: { lat: 15.9044, lng: 80.4686 } },
  { name: 'Prakasam', description: 'Named after the first CM of Andhra state, Prakasam is a large coastal district.', shortDescription: 'Coastal land with major spiritual and historical landmarks.', image: 'https://images.unsplash.com/photo-1597149959822-e3df04f4e20d?w=1200', highlights: ['Markapur', 'Ongole', 'Singarayakonda'], coordinates: { lat: 15.5057, lng: 80.0493 } },
  { name: 'West Godavari', description: 'Known as the Granary of India, West Godavari is a fertile land of rice fields.', shortDescription: 'Emerald green fields and ancient Godavari temples.', image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1200', highlights: ['Somarama', 'Ksheerarama', 'Bhimavaram'], coordinates: { lat: 16.5445, lng: 81.5212 } },
  { name: 'East Godavari', description: 'Cultural capital of Andhra Pradesh, Rajahmundry is the heartbeat of this district.', shortDescription: 'Culture on the banks of the mighty Godavari.', image: 'https://images.unsplash.com/photo-1599930113854-d6d7fd522504?w=1200', highlights: ['Rajahmundry', 'Godavari Bridge', 'ISKCON'], coordinates: { lat: 17.3194, lng: 81.7800 } },
  { name: 'Annamayya', description: 'Named after the poet saint Annamacharya, it features the beautiful Horsley Hills.', shortDescription: 'Land of mountains, forts and spiritual poets.', image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200', highlights: ['Horsley Hills', 'Tallapaka', 'Gurramkonda'], coordinates: { lat: 14.0500, lng: 78.7500 } },
  { name: 'Sri Sathya Sai', description: 'Spiritual center of the world with Puttaparthi, and architectural marvels.', shortDescription: 'World spiritual hub and architectural masterpiece.', image: 'https://images.unsplash.com/photo-1611236682696-8a66e34efa62?w=1200', highlights: ['Puttaparthi', 'Lepakshi', 'Yaganti'], coordinates: { lat: 14.1670, lng: 77.8100 } },
  { name: 'Parvathipuram Manyam', description: 'A newly formed tribal district in the North, known for its scenic hills.', shortDescription: 'Tribal beauty among the rolling hills of Manyam.', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200', highlights: ['Thotapalli', 'Parvathipuram', 'Kurupam'], coordinates: { lat: 18.7946, lng: 83.4219 } },
  { name: 'Vizianagaram', description: 'The City of Victory, Vizianagaram is rich in history with majestic forts.', shortDescription: 'Historical city of forts and cultural victory.', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200', highlights: ['Vizianagaram Fort', 'Rama Tirtham', 'Kumili'], coordinates: { lat: 18.1066, lng: 83.3956 } },
  { name: 'Chittoor', description: 'Known for its spiritual depth and natural beauty, Chittoor is a gateway to Horsley hills.', shortDescription: 'Spiritual gateway with lush green hill stations.', image: 'https://images.unsplash.com/photo-1620668045353-066b69b55239?w=1200', highlights: ['Kanipakam', 'Horsley Hills (part)', 'Kaundinya'], coordinates: { lat: 13.2172, lng: 79.1003 } },
];

const sharedImgs = [
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
  'https://images.unsplash.com/photo-1597149959822-e3df04f4e20d?w=800',
  'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800',
  'https://images.unsplash.com/photo-1611236682696-8a66e34efa62?w=800',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'
];

const generatePlaces = (districtName, names, category = 'Nature') => {
  const district = districts.find(d => d.name === districtName);
  const baseLat = district ? district.coordinates.lat : 16.5;
  const baseLng = district ? district.coordinates.lng : 80.5;

  return names.map((name, i) => ({
    name,
    districtName,
    description: `${name} is a must-visit destination in ${districtName} district, known for its unique character and attraction.`,
    shortDescription: `A beautiful ${category.toLowerCase()} spot in ${districtName}.`,
    category,
    location: { 
      type: 'Point', 
      coordinates: [
        baseLng + (Math.random() * 0.1 - 0.05),
        baseLat + (Math.random() * 0.1 - 0.05)
      ] 
    },
    rating: 4.0 + Math.random(),
    bestTimeToVisit: 'October to March',
    entryFee: 'Free',
    timings: 'Open All Day',
    isFeatured: i === 0,
    coverImage: sharedImgs[i % 5],
    images: sharedImgs
  }));
};

const placesList = [
  ...generatePlaces('Tirupati', ['Tirumala Venkateswara Temple', 'Srikalahasti Temple'], 'Temple / Religious'),
  ...generatePlaces('Nandyal', ['Srisailam Mallikarjuna Temple', 'Ahobilam Temple'], 'Temple / Religious'),
  ...generatePlaces('NTR', ['Kanaka Durga Temple'], 'Temple / Religious'),
  ...generatePlaces('Srikakulam', ['Arasavalli Sun Temple'], 'Temple / Religious'),
  ...generatePlaces('Visakhapatnam', ['Simhachalam Temple'], 'Temple / Religious'),
  ...generatePlaces('Kakinada', ['Annavaram Satyanarayana Temple'], 'Temple / Religious'),
  ...generatePlaces('Kurnool', ['Yaganti Temple'], 'Temple / Religious'),
  ...generatePlaces('Sri Sathya Sai', ['Lepakshi Veerabhadra Temple'], 'Temple / Religious'),

  {
    name: 'RK Beach',
    districtName: 'Visakhapatnam',
    category: 'Beach',
    description: 'RK Beach is a must-visit destination in Visakhapatnam district, known for its unique character and attraction.',
    shortDescription: 'A beautiful coastal spot in Visakhapatnam.',
    location: { type: 'Point', coordinates: [83.33, 17.71] },
    rating: 4.8,
    bestTimeToVisit: 'October to March',
    entryFee: 'Free',
    timings: 'Open All Day',
    isFeatured: true,
    coverImage: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774091010/rk1_cqbmi6.jpg',
    images: ['https://res.cloudinary.com/ddipawlbg/image/upload/v1774091010/rk1_cqbmi6.jpg', ...sharedImgs]
  },
  ...generatePlaces('Visakhapatnam', ['Rushikonda Beach', 'Yarada Beach', 'Bheemili Beach'], 'Beach'),
  ...generatePlaces('Srikakulam', ['Kalingapatnam Beach'], 'Beach'),
  ...generatePlaces('Krishna', ['Manginapudi Beach'], 'Beach'),
  ...generatePlaces('Prakasam', ['Vodarevu Beach'], 'Beach'),
  ...generatePlaces('Bapatla', ['Suryalanka Beach'], 'Beach'),

  ...generatePlaces('Alluri Sitharama Raju', ['Araku Valley', 'Lambasingi'], 'Hill Station'),
  ...generatePlaces('Annamayya', ['Horsley Hills'], 'Hill Station'),
  ...generatePlaces('East Godavari', ['Papi Hills'], 'Hill Station'),

  ...generatePlaces('YSR Kadapa', ['Gandikota Fort'], 'Historical'),
  ...generatePlaces('Tirupati', ['Chandragiri Fort'], 'Historical'),
  ...generatePlaces('Krishna', ['Kondapalli Fort'], 'Historical'),
  ...generatePlaces('SPSR Nellore', ['Udayagiri Fort'], 'Historical'),
  ...generatePlaces('Kurnool', ['Bellam Caves'], 'Historical'), // The user wrote Bellam Caves
  ...generatePlaces('Guntur', ['Amaravati Stupa'], 'Historical'),

  ...generatePlaces('Tirupati', ['Talakona Waterfalls'], 'Nature'),
  ...generatePlaces('Visakhapatnam', ['Katiki Waterfalls', 'Kambalakonda Wildlife Sanctuary'], 'Nature'),
  ...generatePlaces('Guntur', ['Ethipothala Waterfalls'], 'Nature'),
  ...generatePlaces('Alluri Sitharama Raju', ['Maredumilli Forest'], 'Nature'),

  ...generatePlaces('Tirupati', ['Talakona Falls'], 'Waterfalls'),
  ...generatePlaces('Visakhapatnam', ['Katiki Falls', 'Tadimada Falls'], 'Waterfalls'),
  ...generatePlaces('Guntur', ['Ethipothala Falls'], 'Waterfalls'),

  ...generatePlaces('Tirupati', ['Sri Venkateswara National Park'], 'Wildlife'),
  ...generatePlaces('Alluri Sitharama Raju', ['Papikonda National Park'], 'Wildlife'),
  ...generatePlaces('Kakinada', ['Coringa Wildlife Sanctuary'], 'Wildlife'),
  ...generatePlaces('Nandyal', ['Rollapadu Wildlife Sanctuary'], 'Wildlife'),

  ...generatePlaces('Alluri Sitharama Raju', ['Araku Valley Trekking', 'Papikondalu Boat Ride'], 'Adventure'),
  ...generatePlaces('YSR Kadapa', ['Gandikota Camping'], 'Adventure'),
  ...generatePlaces('Annamayya', ['Horsley Hills Trekking'], 'Adventure'),

  ...generatePlaces('Visakhapatnam', ['Visakhapatnam'], 'City'),
  ...generatePlaces('NTR', ['Vijayawada'], 'City'),
  ...generatePlaces('Tirupati', ['Tirupati'], 'City'),
  ...generatePlaces('Kurnool', ['Kurnool'], 'City'),
  ...generatePlaces('Guntur', ['Guntur'], 'City'),

  ...generatePlaces('Krishna', ['Kuchipudi Village'], 'Culture'),
  ...generatePlaces('Guntur', ['Amaravati Museum'], 'Culture'),
  ...generatePlaces('Sri Sathya Sai', ['Lepakshi Cultural Site'], 'Culture'),

  ...generatePlaces('Sri Sathya Sai', ['Lepakshi Temple'], 'Heritage'),
  ...generatePlaces('Guntur', ['Amaravati Stupa'], 'Heritage'),
  ...generatePlaces('YSR Kadapa', ['Gandikota'], 'Heritage'),

  ...generatePlaces('Dr. B.R. Ambedkar Konaseema', ['Konaseema'], 'Backwaters'),
  ...generatePlaces('Alluri Sitharama Raju', ['Papikondalu'], 'Backwaters'),
  ...generatePlaces('East Godavari', ['Godavari River Cruise'], 'Backwaters'),

  ...generatePlaces('Alluri Sitharama Raju', ['Araku Tribal Museum', 'Lambasingi Tribal Area'], 'Tribal'),

  ...generatePlaces('Tirupati', ['Tirumala', 'Srikalahasti'], 'Pilgrimage'),
  ...generatePlaces('Nandyal', ['Srisailam'], 'Pilgrimage'),
  ...generatePlaces('Visakhapatnam', ['Simhachalam'], 'Pilgrimage'),
];

const seedDatabase = async () => {
  try {
    await connectDB();
    await District.deleteMany({});
    await Place.deleteMany({});
    
    console.log('--- Seeding Districts ---');
    const districtsWithSlugs = districts.map(d => ({
      ...d,
      slug: d.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
    }));
    const createdDistricts = await District.insertMany(districtsWithSlugs);
    console.log(`Successfully seeded ${createdDistricts.length} districts.`);

    console.log('--- Seeding Places ---');
    const finalPlaces = placesList.map(place => {
      const district = createdDistricts.find(d => d.name === place.districtName);
      if (!district) {
        console.warn(`District not found for place: ${place.name}`);
        return null;
      }
      return {
        ...place,
        districtId: district._id,
        slug: `${place.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(7)}`
      };
    }).filter(p => p !== null);

    try {
      await Place.insertMany(finalPlaces);
    } catch (e) {
      if (e.name === 'ValidationError') {
        Object.keys(e.errors).forEach(key => {
          console.error(`Validation Error on Place: ${key} - ${e.errors[key].message}`);
        });
      }
      throw e;
    }
    
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      await Admin.create({ username: 'admin', email: 'admin@visitap.in', password: 'admin123', role: 'superadmin' });
    }

    console.log(`SEEDING COMPLETE: ${createdDistricts.length} Districts, ${finalPlaces.length} Places.`);
    process.exit(0);
  } catch (err) {
    if (err.name === 'ValidationError') {
       console.error('Validation Errors:', JSON.stringify(err.errors, null, 2));
    } else {
       console.error('Seeding Failed:', err);
    }
    process.exit(1);
  }
};

seedDatabase();
