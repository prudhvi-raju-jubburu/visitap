const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const District = require('../models/District');
const Place = require('../models/Place');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');

const districts = [
  {
    "name": "Visakhapatnam",
    "description": "The City of Destiny, Visakhapatnam is a beautiful coastal city known for its pristine beaches, lush green hills, and a rich history.",
    "shortDescription": "The Jewel of the East Coast with stunning beaches and hills.",
    "image": "D:\\visitap\\images\\vizag.jpg",
    "highlights": [
      "RK Beach",
      "Kailasagiri",
      "Simhachalam",
      "Rushikonda"
    ],
    "coordinates": {
      "lat": 17.6868,
      "lng": 83.2185
    }
  },
  {
    "name": "Tirupati",
    "description": "The Spiritual Capital of Andhra Pradesh, Tirupati is home to the world-famous Tirumala Venkateswara Temple.",
    "shortDescription": "Abode of Lord Venkateswara and a major spiritual center.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Tirumala_Venkateswara_Temple_in_India.jpg",
    "highlights": [
      "Tirumala Temple",
      "Chandragiri Fort",
      "Srikalahasti",
      "Talakona"
    ],
    "coordinates": {
      "lat": 13.6288,
      "lng": 79.4192
    }
  },
  {
    "name": "Alluri Sitharama Raju",
    "description": "Named after the legendary freedom fighter, this district is a paradise of tribal culture and misty mountains.",
    "shortDescription": "Tribal heartland with misty valleys and coffee gardens.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/8/88/Araku_valley.jpg",
    "highlights": [
      "Araku Valley",
      "Borra Caves",
      "Lambasingi",
      "Maredumilli"
    ],
    "coordinates": {
      "lat": 18.0673,
      "lng": 82.6844
    }
  },
  {
    "name": "Anantapur",
    "description": "Rich in history and spirituality, Anantapur is known for the monumental Lepakshi temple and the Gooty Fort.",
    "shortDescription": "Historical gateway with ancient forts and temples.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Veerabhadra_Temple%2C_Lepakshi.jpg",
    "highlights": [
      "Lepakshi",
      "Gooty Fort",
      "Penukonda",
      "Dharmavaram"
    ],
    "coordinates": {
      "lat": 14.6819,
      "lng": 77.6006
    }
  },
  {
    "name": "Kurnool",
    "description": "The Gateway to Rayalaseema, Kurnool is famous for the stunning Gandikota Canyon and Belum Caves.",
    "shortDescription": "Land of Gandikota Canyon and ancient rock formations.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/9/91/Belum_Caves_Entrance.jpg",
    "highlights": [
      "Gandikota",
      "Belum Caves",
      "Konda Reddy Buruzu",
      "Mantralayam"
    ],
    "coordinates": {
      "lat": 15.8281,
      "lng": 78.0373
    }
  },
  {
    "name": "Dr. B.R. Ambedkar Konaseema",
    "description": "Known as God's Own Creation, Konaseema is a delta region famous for its lush coconut groves and backwaters.",
    "shortDescription": "The lush green paradise of coconut groves and backwaters.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/0/08/Konaseema_Backwaters.jpg",
    "highlights": [
      "Dindi",
      "Antarvedi",
      "Ainavilli",
      "Peruru"
    ],
    "coordinates": {
      "lat": 16.5165,
      "lng": 81.8973
    }
  },
  {
    "name": "Srikakulam",
    "description": "Srikakulam district is home to several famous temples, beautiful beaches, and natural attractions that reflect its rich cultural heritage and scenic beauty.",
    "shortDescription": "Northern coastal beauty with solar temples and beaches.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/60/Arasavalli_Sun_Temple_main_entrance.jpg",
    "highlights": [
      "Arasavalli Sun Temple",
      "Srikurmam Temple",
      "Kalingapatnam Beach",
      "Baruva Beach"
    ],
    "coordinates": {
      "lat": 18.2949,
      "lng": 83.8935
    }
  },
  {
    "name": "NTR",
    "description": "Named after the legendary actor and CM, NTR district features the vibrant city of Vijayawada.",
    "shortDescription": "Dynamic hub of culture, commerce and spirituality.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/8/87/Kanaka_durga_temple_vijayawada.jpg",
    "highlights": [
      "Kanaka Durga Temple",
      "Prakasam Barrage",
      "Bhavani Island",
      "Kondapalli"
    ],
    "coordinates": {
      "lat": 16.5062,
      "lng": 80.648
    }
  },
  {
    "name": "YSR Kadapa",
    "description": "Historical heart of Rayalaseema, Kadapa is known for its ancient temples and forts.",
    "shortDescription": "Land of historic forts and spiritual centers.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/3/30/Gandikota_Fort_Gorge_view.jpg",
    "highlights": [
      "Vontimitta",
      "Gandikota",
      "Siddavatam Fort",
      "Brahmamgari Matham"
    ],
    "coordinates": {
      "lat": 14.4674,
      "lng": 78.8241
    }
  },
  {
    "name": "SPSR Nellore",
    "description": "Famous for its aquaculture and the Pulicat Lake bird sanctuary.",
    "shortDescription": "Coastal district famous for Pulicat Lake and spicy food.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/6/66/Mypadu_Beach_Nellore.jpg",
    "highlights": [
      "Pulicat Lake",
      "Nelapattu",
      "Mypadu Beach",
      "Udayagiri Fort"
    ],
    "coordinates": {
      "lat": 14.4426,
      "lng": 79.9865
    }
  },
  {
    "name": "Guntur",
    "description": "A major educational and commercial hub, Guntur is near the historic Amaravati.",
    "shortDescription": "Heart of Andhra with rich history and chili markets.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Amaravati_Buddhist_Stupa_ruins.jpg",
    "highlights": [
      "Amaravati",
      "Uppalapadu",
      "Kondaveedu Fort",
      "Kotappakonda"
    ],
    "coordinates": {
      "lat": 16.3008,
      "lng": 80.4428
    }
  },
  {
    "name": "Anakapalli",
    "description": "Adjoining Vizag, Anakapalli is famous for its jaggery market and the scenic Kondakarla Ava freshwater lake.",
    "shortDescription": "Jaggery hub with beautiful freshwater lakes.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/f/f7/Bojjannakonda_rock_cut_caves.jpg",
    "highlights": [
      "Kondakarla Ava",
      "Bojjannakonda",
      "Upaka Forest"
    ],
    "coordinates": {
      "lat": 17.6896,
      "lng": 83.0024
    }
  },
  {
    "name": "Nandyal",
    "description": "Recently carved from Kurnool, Nandyal is surrouned by the Nallamala forests and features the sacred Mahanandi temple.",
    "shortDescription": "Forest gateway with ancient Shiva temples.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Srisailam_temple_gopuram.jpg",
    "highlights": [
      "Mahanandi",
      "Ahobilam",
      "Srisailam (part)",
      "Nallamala"
    ],
    "coordinates": {
      "lat": 15.4847,
      "lng": 78.4812
    }
  },
  {
    "name": "Eluru",
    "description": "Home to the massive Kolleru Lake, Eluru is a district of lakes and Buddhist heritage.",
    "shortDescription": "Land of the giant Kolleru freshwater lake.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/5/58/Kolleru_lake_birds.jpg",
    "highlights": [
      "Kolleru Lake",
      "Dwaraka Tirumala",
      "Guntupalli Caves"
    ],
    "coordinates": {
      "lat": 16.7107,
      "lng": 81.1035
    }
  },
  {
    "name": "Kakinada",
    "description": "A major port city known as the Fertilizer City, Kakinada offers beautiful beaches and mangroves.",
    "shortDescription": "Port city with mangroves and scenic beaches.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/c/cd/Coringa_Mangroves_Kakinada.jpg",
    "highlights": [
      "Coringa",
      "Hope Island",
      "Kakinada Beach",
      "Uppada"
    ],
    "coordinates": {
      "lat": 16.9891,
      "lng": 82.2475
    }
  },
  {
    "name": "Krishna",
    "description": "Named after the sacred river, Krishna district is a cultural heartland with a rich tradition of arts.",
    "shortDescription": "Delta district with a rich riverine heritage.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Manginapudi_Beach_Krishna.jpg",
    "highlights": [
      "Machilipatnam",
      "Hamsaladeevi",
      "Kuchipudi"
    ],
    "coordinates": {
      "lat": 16.1675,
      "lng": 81.132
    }
  },
  {
    "name": "Palnadu",
    "description": "Historical region known for the battle of Palnadu, featuring the Nagarjuna Sagar dam.",
    "shortDescription": "Land of historic battles and massive dams.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Nagarjuna_Sagar_Dam.jpg",
    "highlights": [
      "Nagarjuna Sagar",
      "Ethipothala",
      "Amaravati"
    ],
    "coordinates": {
      "lat": 16.35,
      "lng": 79.71
    }
  },
  {
    "name": "Bapatla",
    "description": "A coastal district famous for the Suryalanka beach and historical temples.",
    "shortDescription": "Pristine coastal town with famous sun-kissed beaches.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Suryalanka_Beach_Bapatla.jpg",
    "highlights": [
      "Suryalanka",
      "Vodarevu",
      "Bapatla Temple"
    ],
    "coordinates": {
      "lat": 15.9044,
      "lng": 80.4686
    }
  },
  {
    "name": "Prakasam",
    "description": "Named after the first CM of Andhra state, Prakasam is a large coastal district.",
    "shortDescription": "Coastal land with major spiritual and historical landmarks.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Cumbum_Lake_in_Andhra_Pradesh.jpg",
    "highlights": [
      "Markapur",
      "Ongole",
      "Singarayakonda"
    ],
    "coordinates": {
      "lat": 15.5057,
      "lng": 80.0493
    }
  },
  {
    "name": "West Godavari",
    "description": "Known as the Granary of India, West Godavari is a fertile land of rice fields.",
    "shortDescription": "Emerald green fields and ancient Godavari temples.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/23/Dwaraka_Tirumala_temple.jpg",
    "highlights": [
      "Somarama",
      "Ksheerarama",
      "Bhimavaram"
    ],
    "coordinates": {
      "lat": 16.5445,
      "lng": 81.5212
    }
  },
  {
    "name": "East Godavari",
    "description": "Cultural capital of Andhra Pradesh, Rajahmundry is the heartbeat of this district.",
    "shortDescription": "Culture on the banks of the mighty Godavari.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Godavari_River_Rajahmundry.jpg",
    "highlights": [
      "Rajahmundry",
      "Godavari Bridge",
      "ISKCON"
    ],
    "coordinates": {
      "lat": 17.3194,
      "lng": 81.78
    }
  },
  {
    "name": "Annamayya",
    "description": "Named after the poet saint Annamacharya, it features the beautiful Horsley Hills.",
    "shortDescription": "Land of mountains, forts and spiritual poets.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Horsley_Hills_view.jpg",
    "highlights": [
      "Horsley Hills",
      "Tallapaka",
      "Gurramkonda"
    ],
    "coordinates": {
      "lat": 14.05,
      "lng": 78.75
    }
  },
  {
    "name": "Sri Sathya Sai",
    "description": "Spiritual center of the world with Puttaparthi, and architectural marvels.",
    "shortDescription": "World spiritual hub and architectural masterpiece.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/d/dd/Sri_Veerabhadra_Temple,_Lepakshi,_Sri_Sathya_Sai_district,_Andhra_Pradesh,_India_(2019)_3.jpg",
    "highlights": [
      "Puttaparthi",
      "Lepakshi",
      "Yaganti"
    ],
    "coordinates": {
      "lat": 14.167,
      "lng": 77.81
    }
  },
  {
    "name": "Parvathipuram Manyam",
    "description": "A newly formed tribal district in the North, known for its scenic hills.",
    "shortDescription": "Tribal beauty among the rolling hills of Manyam.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/7/7b/Thotapalli_project_dam_gates.jpg",
    "highlights": [
      "Thotapalli",
      "Parvathipuram",
      "Kurupam"
    ],
    "coordinates": {
      "lat": 18.7946,
      "lng": 83.4219
    }
  },
  {
    "name": "Vizianagaram",
    "description": "The City of Victory, Vizianagaram is rich in history with majestic forts.",
    "shortDescription": "Historical city of forts and cultural victory.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/3/30/Vizianagaram_Fort.jpg",
    "highlights": [
      "Vizianagaram Fort",
      "Rama Tirtham",
      "Kumili"
    ],
    "coordinates": {
      "lat": 18.1066,
      "lng": 83.3956
    }
  },
  {
    "name": "Chittoor",
    "description": "Known for its spiritual depth and natural beauty, Chittoor is a gateway to Horsley hills.",
    "shortDescription": "Spiritual gateway with lush green hill stations.",
    "image": "https://upload.wikimedia.org/wikipedia/commons/5/52/Kanipakam_Temple.jpg",
    "highlights": [
      "Kanipakam",
      "Horsley Hills (part)",
      "Kaundinya"
    ],
    "coordinates": {
      "lat": 13.2172,
      "lng": 79.1003
    }
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();
    await District.deleteMany({});
    await Place.deleteMany({});
    
    console.log('--- Seeding Districts ---');
    const districtsWithSlugs = districts.map(d => ({
      ...d,
      slug: d.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/-+/g, '-'),
    }));
    const createdDistricts = await District.insertMany(districtsWithSlugs);
    console.log(`Successfully seeded ${createdDistricts.length} districts.`);

    console.log('--- Seeding Places ---');
    const masterPath = path.join(__dirname, '..', 'data', 'master-places.json');
    if (!fs.existsSync(masterPath)) {
      throw new Error(`master-places.json not found at ${masterPath}. Please run "npm run build-dataset" first.`);
    }
    
    const placesData = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));
    
    // Create spelling-tolerant district mapping
    const districtMap = new Map();
    createdDistricts.forEach(d => {
      const nameLower = d.name.toLowerCase().trim();
      districtMap.set(nameLower, d._id);
      if (nameLower === 'annakapalli') {
        districtMap.set('anakapalli', d._id);
      } else if (nameLower === 'anakapalli') {
        districtMap.set('annakapalli', d._id);
      }
    });

    const finalPlaces = placesData.map(place => {
      const normName = place.districtName.toLowerCase().trim();
      const districtId = districtMap.get(normName);
      if (!districtId) {
        console.warn(`District not found for place: ${place.name} (${place.districtName})`);
        return null;
      }
      return {
        ...place,
        districtId: districtId,
        rating: place.rating || { average: 0, count: 0 }
      };
    }).filter(p => p !== null);

    console.log(`Prepared ${finalPlaces.length} places for insertion.`);
    await Place.insertMany(finalPlaces);
    console.log(`Successfully seeded ${finalPlaces.length} places.`);
    
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
