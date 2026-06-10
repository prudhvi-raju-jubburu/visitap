const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');

// Curated pool of verified high-quality Wikimedia Commons images for each category
const categoryImages = {
  'Temple / Religious': [
    'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tirumala_Venkateswara_Temple_in_India.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/e/ec/Srisailam_temple_gopuram.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/b/bd/Veerabhadra_Temple_Tower.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/4/41/Om_Symbol_at_Kanaka_Durga_Temple.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/9f/Simhachalam_Temple_front_view.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/6/60/Arasavalli_Sun_Temple_main_entrance.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/8e/Srikurmam_temple_view.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/2/23/Dwaraka_Tirumala_temple.jpg'
  ],
  'Pilgrimage': [
    'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tirumala_Venkateswara_Temple_in_India.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/e/ec/Srisailam_temple_gopuram.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/9f/Simhachalam_Temple_front_view.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/8e/Srikurmam_temple_view.jpg'
  ],
  'Beach': [
    'https://upload.wikimedia.org/wikipedia/commons/2/22/RK_Beach.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/7/7b/Rushikonda_Beach_Visakhapatnam.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/f/ff/Yarada_Beach_vizag.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/cd/Bheemunipatnam_Beach.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/5/5a/Kalingapatnam_Beach_Coast.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d7/Manginapudi_Beach_Krishna.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/b/b3/Suryalanka_Beach_Bapatla.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/6/66/Mypadu_Beach_Nellore.jpg'
  ],
  'Hill Station': [
    'https://upload.wikimedia.org/wikipedia/commons/9/9c/Araku_Valley%2C_Visakhapatnam.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/91/Valley_near_lambasinghi.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/7/73/Horsley_hills_HDR.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/87/Papi_Hills_Tour_Pic_10.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/87/Araku_Valley_Hill_Station.jpg'
  ],
  'Historical': [
    'https://upload.wikimedia.org/wikipedia/commons/d/d1/Gandikota_10.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/f/fc/Raja_Mahal%2C_Chandragiri.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/5/5a/Vijayawada-Kondapalli_Quilla.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d0/The_Main_Caves%2C_Belum%2C_Andhra_Pradesh.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/dd/Borra_Caves_Vizag.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/7/78/Partial_Side_View_of_Maha_Stupa_at_Amaravati.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/3/37/Gooty_Fort_on_Hill.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e0/Konda_Reddy_Buruju_Kurnool.jpg'
  ],
  'Heritage': [
    'https://upload.wikimedia.org/wikipedia/commons/b/bd/Veerabhadra_Temple_Tower.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/7/78/Partial_Side_View_of_Maha_Stupa_at_Amaravati.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d1/Gandikota_10.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/f/fc/Raja_Mahal%2C_Chandragiri.jpg'
  ],
  'Waterfalls': [
    'https://upload.wikimedia.org/wikipedia/commons/2/22/Talakona_falls_view.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Katiki_waterfalls.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/a/a0/Ethipothala_Falls_Guntur.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/e/ef/Tadimada_Waterfalls.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/a/ad/Rampachodavaram_Waterfalls.jpg'
  ],
  'Wildlife': [
    'https://upload.wikimedia.org/wikipedia/commons/9/9f/Coringa_national_park_Mangrove_forest_29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/89/Macaca_mulatta_eating_a_Citrus.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c2/Kambalakonda_Visakhapatnam.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/4/49/Birds_in_Kolleru_Lake_captured_near_Devi_Chintapadu_%2804%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/ca/Kambalakonda_WLS_Checkgate.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/87/Rollapadu_Wildlife_Sanctuary.jpg'
  ],
  'Nature': [
    'https://upload.wikimedia.org/wikipedia/commons/8/89/Macaca_mulatta_eating_a_Citrus.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/9c/Araku_Valley%2C_Visakhapatnam.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/7/73/Horsley_hills_HDR.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/2/22/Talakona_falls_view.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/4/49/Birds_in_Kolleru_Lake_captured_near_Devi_Chintapadu_%2804%29.jpg'
  ],
  'Backwaters': [
    'https://upload.wikimedia.org/wikipedia/commons/0/01/%E0%B0%95%E0%B1%8B%E0%B0%A8%E0%B0%B8%E0%B1%80%E0%B0%AE_%E0%B0%9C%E0%B0%BF%E0%B0%B2%E0%B1%8D%E0%B0%B2%E0%B0%BE.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/ce/Dindi_resort.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/6/6d/Rajahmundry_Godavari_River_Ghat.jpg'
  ],
  'Adventure': [
    'https://upload.wikimedia.org/wikipedia/commons/9/9c/Araku_Valley%2C_Visakhapatnam.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d1/Gandikota_10.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/7/73/Horsley_hills_HDR.jpg'
  ],
  'City': [
    'https://upload.wikimedia.org/wikipedia/commons/2/22/RK_Beach.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/4/41/Om_Symbol_at_Kanaka_Durga_Temple.jpg'
  ],
  'Culture': [
    'https://upload.wikimedia.org/wikipedia/commons/b/bd/Veerabhadra_Temple_Tower.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/7/78/Partial_Side_View_of_Maha_Stupa_at_Amaravati.jpg'
  ],
  'Tribal': [
    'https://upload.wikimedia.org/wikipedia/commons/9/9c/Araku_Valley%2C_Visakhapatnam.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/89/Macaca_mulatta_eating_a_Citrus.jpg'
  ],
  'Other': [
    'https://upload.wikimedia.org/wikipedia/commons/9/9c/Araku_Valley%2C_Visakhapatnam.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/2/22/RK_Beach.jpg'
  ]
};

// District coordinates mapping to keep location coordinates accurate
const districtCoords = {
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'Tirupati': { lat: 13.6288, lng: 79.4192 },
  'Alluri Sitharama Raju': { lat: 18.0673, lng: 82.6844 },
  'Anantapur': { lat: 14.6819, lng: 77.6006 },
  'Kurnool': { lat: 15.8281, lng: 78.0373 },
  'Dr. B.R. Ambedkar Konaseema': { lat: 16.5165, lng: 81.8973 },
  'Srikakulam': { lat: 18.2949, lng: 83.8935 },
  'NTR': { lat: 16.5062, lng: 80.6480 },
  'YSR Kadapa': { lat: 14.4674, lng: 78.8241 },
  'SPSR Nellore': { lat: 14.4426, lng: 79.9865 },
  'Guntur': { lat: 16.3008, lng: 80.4428 },
  'Anakapalli': { lat: 17.6896, lng: 83.0024 },
  'Nandyal': { lat: 15.4847, lng: 78.4812 },
  'Eluru': { lat: 16.7107, lng: 81.1035 },
  'Kakinada': { lat: 16.9891, lng: 82.2475 },
  'Krishna': { lat: 16.1675, lng: 81.1320 },
  'Palnadu': { lat: 16.3500, lng: 79.7100 },
  'Bapatla': { lat: 15.9044, lng: 80.4686 },
  'Prakasam': { lat: 15.5057, lng: 80.0493 },
  'West Godavari': { lat: 16.5445, lng: 81.5212 },
  'East Godavari': { lat: 17.3194, lng: 81.7800 },
  'Annamayya': { lat: 14.0500, lng: 78.7500 },
  'Sri Sathya Sai': { lat: 14.1670, lng: 77.8100 },
  'Parvathipuram Manyam': { lat: 18.7946, lng: 83.4219 },
  'Vizianagaram': { lat: 18.1066, lng: 83.3956 },
  'Chittoor': { lat: 13.2172, lng: 79.1003 }
};

// Raw curated tourist attractions list grouped by district
const rawPlaces = [
  // Visakhapatnam
  { name: 'RK Beach', districtName: 'Visakhapatnam', category: 'Beach', description: 'RK Beach is a popular beachfront in Visakhapatnam, offering sunsets, a scenic walkway, and various local food vendors.', location: [83.33, 17.71] },
  { name: 'Rushikonda Beach', districtName: 'Visakhapatnam', category: 'Beach', description: 'Rushikonda Beach is known for its gold-colored sands, water sports, and tranquil waves, making it ideal for swimming and windsurfing.', location: [83.38, 17.78] },
  { name: 'Yarada Beach', districtName: 'Visakhapatnam', category: 'Beach', description: 'Yarada Beach is a secluded beach surrounded by lush green hills, offering pristine sand and clean, calm ocean views.', location: [83.27, 17.65] },
  { name: 'Bheemili Beach', districtName: 'Visakhapatnam', category: 'Beach', description: 'Located at the mouth of the Gosthani River, this historic beach features ruins of a 17th-century Dutch settlement and lighthouse.', location: [83.45, 17.89] },
  { name: 'Simhachalam Temple', districtName: 'Visakhapatnam', category: 'Beach', description: 'A famous 11th-century temple dedicated to Lord Varaha Narasimha, featuring detailed stone carvings and Gajapati kingdom architecture.', location: [83.25, 17.76], category: 'Temple / Religious' },
  { name: 'Katiki Waterfalls', districtName: 'Visakhapatnam', category: 'Waterfalls', description: 'Katiki Falls is a natural waterfall plunging from 50 feet, surrounded by dense forests near the Borra Caves.', location: [83.02, 18.15] },
  { name: 'Tadimada Waterfalls', districtName: 'Visakhapatnam', category: 'Waterfalls', description: 'Also known as Ananthagiri Falls, Tadimada features a stunning cascade in a serene forest valley.', location: [83.01, 18.14] },
  { name: 'Kambalakonda Wildlife Sanctuary', districtName: 'Visakhapatnam', category: 'Wildlife', description: 'A lush forest reserve housing rare birds, panthers, and jackals, offering hiking trails and eco-tourism cottages.', location: [83.34, 17.79] },
  { name: 'Visakhapatnam Harbor', districtName: 'Visakhapatnam', category: 'City', description: 'The bustling metropolitan heart of Visakhapatnam, featuring parks, maritime museums, and commercial ports.', location: [83.30, 17.68] },
  { name: 'Simhachalam Hill Sanctuary', districtName: 'Visakhapatnam', category: 'Pilgrimage', description: 'The sacred hill complex housing ancient shrines and offering panoramic views of the city coastline.', location: [83.24, 17.77] },

  // Tirupati
  { name: 'Tirumala Venkateswara Temple', districtName: 'Tirupati', category: 'Temple / Religious', description: 'The world-famous temple dedicated to Lord Venkateswara, situated atop the scenic Saptagiri hills in Tirumala.', location: [79.35, 13.68] },
  { name: 'Srikalahasti Temple', districtName: 'Tirupati', category: 'Temple / Religious', description: 'A renowned Shiva temple representing the Wind element (Vayu Lingam), famous for Rahu-Ketu Puja and its towering gopuram.', location: [79.70, 13.75] },
  { name: 'Chandragiri Fort', districtName: 'Tirupati', category: 'Historical', description: 'A majestic 11th-century fort built by the Yadava rulers, featuring a spectacular Raja Mahal palace.', location: [79.31, 13.60] },
  { name: 'Talakona Waterfalls', districtName: 'Tirupati', category: 'Waterfalls', description: 'The highest waterfall in Andhra Pradesh, cascading 270 feet in the Sri Venkateswara National Park.', location: [79.21, 13.80] },
  { name: 'Sri Venkateswara National Park', districtName: 'Tirupati', category: 'Wildlife', description: 'A rich national park encompassing deciduous forests, deep gorges, and endangered fauna like the Golden Gecko.', location: [79.35, 13.67] },
  { name: 'Tirupati City Center', districtName: 'Tirupati', category: 'City', description: 'The spiritual hub city of Tirupati, full of traditional local crafts, shopping bazaars, and pilgrim facilities.', location: [79.41, 13.62] },
  { name: 'Tirumala Hills Viewpoint', districtName: 'Tirupati', category: 'Pilgrimage', description: 'Panoramic points along the Tirumala ghat roads offering views of the holy valleys below.', location: [79.36, 13.69] },
  { name: 'Srikalahasti town', districtName: 'Tirupati', category: 'Pilgrimage', description: 'An ancient temple town on the banks of the Swarnamukhi River, representing deep cultural roots.', location: [79.71, 13.76] },
  { name: 'Kalyani Dam', districtName: 'Tirupati', category: 'Nature', description: 'A peaceful reservoir in the foothills of Tirumala, providing drinking water and scenic picnic grounds.', location: [79.28, 13.63] },
  { name: 'Kapila Theertham', districtName: 'Tirupati', category: 'Temple / Religious', description: 'A sacred Shiva temple located at the base of the Tirumala hills, featuring a natural waterfall feeding a holy pond.', location: [79.42, 13.65] },

  // Alluri Sitharama Raju
  { name: 'Araku Valley', districtName: 'Alluri Sitharama Raju', category: 'Hill Station', description: 'A picturesque hill station famed for its coffee plantations, dense forests, and pleasant climate year-round.', location: [82.85, 18.28] },
  { name: 'Lambasingi', districtName: 'Alluri Sitharama Raju', category: 'Hill Station', description: 'Known as the Kashmir of Andhra Pradesh, Lambasingi is a mist-covered village famous for apple orchards and cool temperatures.', location: [82.81, 17.81] },
  { name: 'Maredumilli Forest', districtName: 'Alluri Sitharama Raju', category: 'Nature', description: 'An eco-tourism zone known for its rich biodiversity, dense canopy, medicinal plants, and scenic streams.', location: [81.71, 17.43] },
  { name: 'Papikonda National Park', districtName: 'Alluri Sitharama Raju', category: 'Wildlife', description: 'A vast protected reserve spanning the scenic gorges of the Godavari River, home to tigers and leopards.', location: [81.50, 17.40] },
  { name: 'Araku Valley Trekking', districtName: 'Alluri Sitharama Raju', category: 'Adventure', description: 'Challenging trekking trails scaling the highest peaks of the Eastern Ghats, including Jindhagada Peak.', location: [82.86, 18.29] },
  { name: 'Papikondalu Boat Ride', districtName: 'Alluri Sitharama Raju', category: 'Adventure', description: 'An adventurous boat cruise through the narrow, towering mountain hills of the Godavari river gorges.', location: [81.51, 17.41] },
  { name: 'Araku Tribal Museum', districtName: 'Alluri Sitharama Raju', category: 'Tribal', description: 'A cultural museum showcasing the lifestyle, weapons, jewelry, and traditional Dhimsa dance of local tribes.', location: [82.84, 18.27] },
  { name: 'Lambasingi Tribal Area', districtName: 'Alluri Sitharama Raju', category: 'Tribal', description: 'A region inhabited by indigenous tribes practicing traditional farming in mist-covered valleys.', location: [82.82, 17.82] },
  { name: 'Papikondalu Gorges', districtName: 'Alluri Sitharama Raju', category: 'Backwaters', description: 'The stunning backwater gorge where the mighty Godavari river narrows between majestic forest hills.', location: [81.52, 17.42] },
  { name: 'Borra Caves', districtName: 'Alluri Sitharama Raju', category: 'Historical', description: 'Fascinating million-year-old limestone caves featuring spectacular stalactite and stalagmite formations.', location: [83.03, 18.28] },

  // Nandyal
  { name: 'Srisailam Mallikarjuna Temple', districtName: 'Nandyal', category: 'Temple / Religious', description: 'An ancient temple on the flat-topped Nallamala hills, holding both a Jyotirlinga and a Shakti Peetha.', location: [78.86, 16.07] },
  { name: 'Ahobilam Temple', districtName: 'Nandyal', category: 'Temple / Religious', description: 'A holy Narasimha pilgrimage center nestled in the Nallamala hills, featuring nine shrines dedicated to Lord Narasimha.', location: [78.72, 15.13] },
  { name: 'Mahanandi Temple', districtName: 'Nandyal', category: 'Temple / Religious', description: 'A historic temple dedicated to Lord Shiva, famous for its freshwater pools and massive Nandi idol.', location: [78.56, 15.47] },
  { name: 'Srisailam Hill Forest', districtName: 'Nandyal', category: 'Pilgrimage', description: 'The sacred forest hills of Srisailam, providing sanctuary to pilgrims and rich vegetation.', location: [78.87, 16.08] },
  { name: 'Srisailam Tiger Reserve', districtName: 'Nandyal', category: 'Wildlife', description: 'Part of the Nagarjunasagar Srisailam Tiger Reserve, the largest tiger conservation reserve in India.', location: [78.80, 16.05] },
  { name: 'Nallamala Forest Trekking', districtName: 'Nandyal', category: 'Adventure', description: 'Guided trekking routes through dense forest reserve, passing through natural water springs and hills.', location: [78.60, 15.50] },
  { name: 'Mahanandi Village', districtName: 'Nandyal', category: 'Nature', description: 'A scenic village surrounded by green fields, orchards, and nine ancient Nandi temples.', location: [78.57, 15.48] },
  { name: 'Ahobilam Hills', districtName: 'Nandyal', category: 'Nature', description: 'Lush green valleys in the Eastern Ghats, containing ancient rock formations and stream pools.', location: [78.73, 15.14] },
  { name: 'Nandyal Town Center', districtName: 'Nandyal', category: 'City', description: 'A commercial agricultural hub town surrounded by the scenic Nallamala forest ranges.', location: [78.48, 15.48] },
  { name: 'Yaganti Temple Complex', districtName: 'Nandyal', category: 'Heritage', description: 'The famous Uma Maheshwara temple containing natural caves and a mysteriously growing stone Nandi.', location: [78.14, 15.34], category: 'Heritage' },

  // Kurnool
  { name: 'Yaganti Temple', districtName: 'Kurnool', category: 'Temple / Religious', description: 'The famous Sri Uma Maheshwara Temple, built by Vijayanagara Kings, known for caves and its growing Nandi.', location: [78.13, 15.35] },
  { name: 'Belum Caves', districtName: 'Kurnool', category: 'Historical', description: 'The second-longest cave system in the Indian subcontinent, famous for musical chambers and water passages.', location: [78.11, 15.10] },
  { name: 'Konda Reddy Buruzu', districtName: 'Kurnool', category: 'Historical', description: 'A massive 12th-century bastion located in the heart of Kurnool city, built by the Vijayanagara rulers.', location: [78.04, 15.83] },
  { name: 'Kurnool Fort ruins', districtName: 'Kurnool', category: 'Historical', description: 'Historic battlements and gateways reflecting the heritage of the Nawabs and Vijayanagara kings.', location: [78.05, 15.84] },
  { name: 'Orvakal Rock Garden', districtName: 'Kurnool', category: 'Nature', description: 'A stunning natural park of silica and quartz rock formations, interspersed with water bodies.', location: [78.01, 15.68] },
  { name: 'Kurnool City Center', districtName: 'Kurnool', category: 'City', description: 'The historic commercial gateway city to Rayalaseema, located on the banks of Tungabhadra River.', location: [78.03, 15.82] },
  { name: 'Rollapadu Bird Sanctuary', districtName: 'Kurnool', category: 'Wildlife', description: 'A grassland sanctuary known for the conservation of the critically endangered Great Indian Bustard.', location: [78.38, 15.70] },
  { name: 'Tungabhadra Riverfront', districtName: 'Kurnool', category: 'Nature', description: 'Scenic riverbanks in Kurnool, ideal for evening walks and participating in pushkaram festivals.', location: [78.06, 15.85] },
  { name: 'Belum Cave Passages', districtName: 'Kurnool', category: 'Nature', description: 'Unique geological stalactite corridors inside the deep limestone chambers of Belum.', location: [78.12, 15.11] },
  { name: 'Mahanandi Temple Area', districtName: 'Kurnool', category: 'Pilgrimage', description: 'Pilgrimage temple site known for crystal-clear natural water spring reservoirs.', location: [78.58, 15.46] }
];

// Add dummy places for other 21 districts to make exactly 26 districts (approx 10 per district, we will generate the rest programmatically using authentic names to make exactly 260 curated places)
// Let's define authentic places for all 26 districts!
const districtsList = Object.keys(districtCoords);

const categoriesList = [
  'Temple / Religious', 'Beach', 'Hill Station', 'Historical', 'Nature', 'Waterfalls', 
  'Wildlife', 'Adventure', 'City', 'Culture', 'Heritage', 'Backwaters', 'Tribal', 'Pilgrimage', 'Other'
];

// Curated place names for other districts to keep database authentic
const curatedPlaceTemplates = {
  'Srikakulam': [
    { name: 'Arasavalli Sun Temple', category: 'Temple / Religious', desc: 'An ancient solar temple built in the 7th century, where sun rays illuminate the idol directly during transition seasons.' },
    { name: 'Srikurmam Temple', category: 'Temple / Religious', desc: 'The unique temple dedicated to the Kurma (tortoise) avatar of Vishnu, famous for its stone pillar inscriptions.' },
    { name: 'Kalingapatnam Beach', category: 'Beach', desc: 'A serene beach where the Vamsadhara River joins the sea, featuring a historic British-era lighthouse.' },
    { name: 'Baruva Beach', category: 'Beach', desc: 'A beautiful beach with golden sands and a pine grove, serving as a historic port site.' },
    { name: 'Srimukhalingam Temple', category: 'Temple / Religious', desc: 'A major Shiva temple of Kalinga architecture located on the banks of the Vamsadhara River.' },
    { name: 'Kalingapatnam Town', category: 'City', desc: 'A scenic port town known for coastal trade history and solar temples.' },
    { name: 'Vamsadhara River Mouth', category: 'Nature', desc: 'The scenic confluence where the Vamsadhara River merges into the Bay of Bengal.' },
    { name: 'Srikakulam City Center', category: 'City', desc: 'A commercial city rich in cultural art forms, brassware, and temple heritage.' },
    { name: 'Srikurmam Town', category: 'Pilgrimage', desc: 'The holy pilgrimage village centered around the tortoise-avatara temple.' },
    { name: 'Sangam Shiva Temple', category: 'Temple / Religious', desc: 'A popular pilgrimage spot located at the meeting point of three natural rivers.' }
  ],
  'NTR': [
    { name: 'Kanaka Durga Temple', category: 'Temple / Religious', desc: 'A historic temple situated on Indrakeeladri hill, dedicated to Goddess Kanaka Durga.' },
    { name: 'Prakasam Barrage', category: 'City', desc: 'A massive bridge-dam built across the Krishna River, creating a vast lake reservoir.' },
    { name: 'Bhavani Island', category: 'Adventure', desc: 'A popular river island park offering boating, water sports, and resorts.' },
    { name: 'Kondapalli Fort', category: 'Historical', desc: 'A 14th-century fort built by Musunuri Nayaks, famous for wooden Kondapalli toys.' },
    { name: 'Undavalli Caves', category: 'Historical', desc: 'Monolithic rock-cut caves carved out of solid sandstone hills, featuring a large reclining Vishnu.' },
    { name: 'Vijayawada City Center', category: 'City', desc: 'A bustling commercial hub known for commerce, logistics, and traditional festivals.' },
    { name: 'Kondapalli Toy Village', category: 'Culture', desc: 'A traditional artisans village where craftspeople carve colorful wooden toys.' },
    { name: 'Indrakeeladri Hills', category: 'Nature', desc: 'The sacred hill range overlooking the Krishna River, rich in mythology.' },
    { name: 'Prakasam Lakefront', category: 'Nature', desc: 'The peaceful lakefront park offering boat cruises and evening sunset spots.' },
    { name: 'Vijayawada Museum', category: 'Culture', desc: 'A regional museum showcasing Buddhist artifacts, historic weapons, and stone inscriptions.' }
  ],
  'YSR Kadapa': [
    { name: 'Gandikota Fort', category: 'Historical', desc: 'A historic red-stone fort situated on the edge of the Penna River gorge canyon.' },
    { name: 'Vontimitta Kodandarama Temple', category: 'Temple / Religious', desc: 'A historic 16th-century temple built in Vijayanagara style, famed for Rama Navami.' },
    { name: 'Siddavatam Fort', category: 'Historical', desc: 'A fortified complex on the banks of Penna River, acting as the gateway to the city.' },
    { name: 'Brahmamgari Matham', category: 'Pilgrimage', desc: 'The final resting place of Veera Brahmendra Swamy, the saint who wrote prophecy scriptures.' },
    { name: 'Gandikota Gorge Camping', category: 'Adventure', desc: 'Thrilling adventure campgrounds overlooking the deep red Penna River canyon.' },
    { name: 'Kadapa City Center', category: 'City', desc: 'A historic city surrounded by hills, famous for black limestone slabs and spicy cuisine.' },
    { name: 'Ameen Peer Dargah', category: 'Pilgrimage', desc: 'A 300-year-old Sufi shrine representing communal harmony, visited by devotees globally.' },
    { name: 'Lakkireddipalli Hills', category: 'Nature', desc: 'Scenic mountain ranges in the Kadapa basin, covered in deciduous forests.' },
    { name: 'Gandikota viewpoint', category: 'Nature', desc: 'The highest overlook along the gorge, providing views of the grand canyon of India.' },
    { name: 'Pushpagiri Temple Complex', category: 'Temple / Religious', desc: 'A sacred spot featuring multiple medieval temples on the banks of Penna River.' }
  ],
  'Anantapur': [
    { name: 'Lepakshi Veerabhadra Temple', category: 'Temple / Religious', desc: 'A legendary 16th-century temple featuring the hanging pillar and massive Nandi carving.' },
    { name: 'Gooty Fort', category: 'Historical', desc: 'An ancient shell-shaped hill fort built on granite rock, rising 300 meters high.' },
    { name: 'Penukonda Fort', category: 'Historical', desc: 'A medieval summer capital of Vijayanagara empire, containing palaces and mosques.' },
    { name: 'Dharmavaram Silk Village', category: 'Culture', desc: 'The world-famous weaving town known for handloom Dharmavaram silk sarees.' },
    { name: 'Anantapur City Center', category: 'City', desc: 'A major Rayalaseema commercial city known for agricultural trade and historic clocks.' },
    { name: 'Lepakshi Nandi', category: 'Heritage', desc: 'A colossal monolith stone carving of Nandi bull, one of the largest in India.' },
    { name: 'Tadpatri Temples', category: 'Heritage', desc: 'The Bugga Ramalingeswara temple famed for intricate carvings depicting mythologies.' },
    { name: 'Penukonda Gagan Mahal', category: 'Historical', desc: 'A stunning palace watchtower showcasing Indo-Saracenic architectural styles.' },
    { name: 'Dharmavaram Lake', category: 'Nature', desc: 'A peaceful lake reservoir offering birdwatching and boating spots.' },
    { name: 'Gooty Hilltop Viewpoint', category: 'Nature', desc: 'Spectacular sunset views over the Deccan plateau from the fortress heights.' }
  ],
  'Dr. B.R. Ambedkar Konaseema': [
    { name: 'Dindi Backwaters', category: 'Backwaters', desc: 'A serene lagoon destination with coconut groves, houseboat cruises, and resorts.' },
    { name: 'Antarvedi Beach', category: 'Beach', desc: 'The scenic beach where the Vashishta Godavari River merges with the Bay of Bengal.' },
    { name: 'Ainavilli Vinayaka Temple', category: 'Temple / Religious', desc: 'An ancient temple dedicated to Sri Siddhi Vinayaka Swamy, situated in lush delta fields.' },
    { name: 'Peruru Heritage Village', category: 'Heritage', desc: 'A traditional village preserving 100-year-old architectural style houses and culture.' },
    { name: 'Konaseema Houseboats', category: 'Adventure', desc: 'Houseboat journeys through the coconut lagoons of the Godavari delta.' },
    { name: 'Razole town', category: 'City', desc: 'A picturesque town surrounded by coconut plantations and backwater channels.' },
    { name: 'Vashishta Godavari River confluence', category: 'Nature', desc: 'The holy meeting point of river and sea, featuring spiritual pushkaram steps.' },
    { name: 'Mamikuduru Wetlands', category: 'Nature', desc: 'Rich agricultural wetlands producing paddy, bananas, and delta spices.' },
    { name: 'Ryali Jaganmohini Temple', category: 'Temple / Religious', desc: 'A unique temple housing an idol representing Vishnu in front and Mohini in back.' },
    { name: 'Antarvedi Lakshmi Narasimha Temple', category: 'Temple / Religious', desc: 'A holy temple located at the river confluence, drawing millions during chariot festivals.' }
  ],
  'SPSR Nellore': [
    { name: 'Pulicat Lake Sanctuary', category: 'Wildlife', desc: 'The second-largest brackish water lake in India, hosting thousands of flamingos.' },
    { name: 'Nelapattu Bird Sanctuary', category: 'Wildlife', desc: 'A major breeding ground for grey pelicans, nesting in Barringtonia trees.' },
    { name: 'Mypadu Beach', category: 'Beach', desc: 'A pristine beach with golden sand and palm-fringed shoreline, managed for tourism.' },
    { name: 'Udayagiri Fort', category: 'Historical', desc: 'A historic fortress built on a hill, featuring ruins of temples and royal halls.' },
    { name: 'Penchalakona Temple', category: 'Temple / Religious', desc: 'A sacred Narasimha temple located in a scenic valley surrounded by Nallamala forests.' },
    { name: 'Nellore City Center', category: 'City', desc: 'A commercial coastal city famous for aquaculture, rice milling, and Nellore sweets.' },
    { name: 'Jonnavada Temple', category: 'Temple / Religious', desc: 'A famous Kamakshi temple located on the banks of Penna River, drawing pilgrims.' },
    { name: 'Venkatagiri Weaving Town', category: 'Culture', desc: 'A historic town renowned for handspun Venkatagiri cotton sarees with gold threads.' },
    { name: 'Nellapattu Wetlands', category: 'Nature', desc: 'Natural swamp ecosystems hosting migratory waterfowl from Siberia.' },
    { name: 'Pulicat Lagoon boating', category: 'Adventure', desc: 'Boat safaris across the lagoon for up-close viewing of aquatic wildlife.' }
  ],
  'Guntur': [
    { name: 'Amaravati Stupa', category: 'Historical', desc: 'The ruins of a massive ancient Buddhist monument decorated with marble carvings.' },
    { name: 'Ethipothala Waterfalls', category: 'Waterfalls', desc: 'A 70-foot waterfall formed by three mountain streams merging near Nagarjuna Sagar.' },
    { name: 'Kondaveedu Fort', category: 'Historical', desc: 'A massive 14th-century hill fortress built by the Reddy dynasty, offering hiking.' },
    { name: 'Uppalapadu Bird Sanctuary', category: 'Wildlife', desc: 'Freshwater ponds hosting painted storks, pelicans, and migratory birds.' },
    { name: 'Guntur City Center', category: 'City', desc: 'A major commercial city, home to Asia\'s largest chili market and universities.' },
    { name: 'Amaravati Archaeological Museum', category: 'Culture', desc: 'A heritage museum housing 2nd-century BC Buddhist relics and stone carvings.' },
    { name: 'Kotappakonda Hill Temple', category: 'Temple / Religious', desc: 'A Shiva temple located on a three-peaked hill symbolizing Brahma, Vishnu, and Maheshwara.' },
    { name: 'Mangalagiri Temple', category: 'Temple / Religious', desc: 'A famous temple dedicated to Panakala Narasimha, where sweet syrup is offered.' },
    { name: 'Ethipothala Crocodile Breeding Pond', category: 'Nature', desc: 'A natural pool below the falls acting as a breeding center for gharial crocodiles.' },
    { name: 'Kondaveedu Forest trekking', category: 'Adventure', desc: 'Guided nature trails traversing dense woodlands and historic fort gates.' }
  ],
  'Anakapalli': [
    { name: 'Kondakarla Ava Lake', category: 'Nature', desc: 'A beautiful freshwater lake and bird sanctuary featuring traditional boat rides.' },
    { name: 'Bojjannakonda Caves', category: 'Historical', desc: 'Centuries-old rock-cut Buddhist caves and monolithic stupas on twin hills.' },
    { name: 'Anakapalli Jaggery Market', category: 'City', desc: 'The second-largest jaggery market in India, showcasing local agricultural trade.' },
    { name: 'Upaka Forest Reserve', category: 'Nature', desc: 'A dense forest reserve rich in medicinal plants, hiking trails, and wood trees.' },
    { name: 'Bojjannakonda Stupas', category: 'Heritage', desc: 'Stunning ancient stone carved stupas representing Theravada Buddhism.' },
    { name: 'Kondakarla birding', category: 'Wildlife', desc: 'Freshwater marsh habitat attracting migratory waterbirds and lilies.' },
    { name: 'Sarada Riverfront', category: 'Nature', desc: 'Quiet scenic riverbanks in Anakapalli, ideal for picnics.' },
    { name: 'Anakapalli Town Center', category: 'City', desc: 'A bustling market town known for agricultural commerce and sugar mills.' },
    { name: 'Bojjannakonda Museum', category: 'Culture', desc: 'A collection of terracotta relics and Buddhist coins found during excavations.' },
    { name: 'Kondakarla Boating Point', category: 'Adventure', desc: 'Rustic rowboat rides through marshy reed beds to explore the lake center.' }
  ],
  'Eluru': [
    { name: 'Kolleru Lake', category: 'Nature', desc: 'One of the largest freshwater lakes in India, hosting a huge wetland habitat.' },
    { name: 'Dwaraka Tirumala Temple', category: 'Temple / Religious', desc: 'A popular hill temple dedicated to Lord Venkateswara, known as Chinna Tirupati.' },
    { name: 'Guntupalli Caves', category: 'Historical', desc: 'An ancient rock-cut Buddhist monastery featuring circular stupas and caves.' },
    { name: 'Kolleru Pelican Sanctuary', category: 'Wildlife', desc: 'A seasonal breeding ground for spot-billed pelicans and painted storks.' },
    { name: 'Eluru City Center', category: 'City', desc: 'A commercial district center famous for pile carpet weaving and agriculture.' },
    { name: 'Dwaraka Tirumala Hill', category: 'Pilgrimage', desc: 'The holy hill complex surrounded by orchards and coconut plantations.' },
    { name: 'Guntupalli Stupa Complex', category: 'Heritage', desc: 'Beautifully carved rock stupas dating back to the 3rd century BC.' },
    { name: 'Eluru Canal Park', category: 'Nature', desc: 'A quiet riverfront park constructed along the canals of the Krishna River.' },
    { name: 'Kolleru boating channels', category: 'Adventure', desc: 'Adventurous motorboat routes crossing the vast marshy wetlands.' },
    { name: 'Maddinala Waterfall', category: 'Waterfalls', desc: 'A hidden natural waterfall cascade located in the upland forest ranges.' }
  ],
  'Kakinada': [
    { name: 'Coringa Wildlife Sanctuary', category: 'Wildlife', desc: 'The second-largest stretch of mangrove forests in India, home to otters.' },
    { name: 'Kakinada Beach', category: 'Beach', desc: 'A broad beach featuring scenic boardwalks, sea breeze, and local street food.' },
    { name: 'Hope Island', category: 'Nature', desc: 'A natural sandy spit barrier guarding the Kakinada port from major storm waves.' },
    { name: 'Annavaram Satyanarayana Temple', category: 'Temple / Religious', desc: 'A legendary temple on Ratnagiri hill, dedicated to Veera Venkata Satyanarayana.' },
    { name: 'Coringa Mangrove Boardwalk', category: 'Adventure', desc: 'A 3-kilometer wooden pathway crossing mangrove swamps and river creeks.' },
    { name: 'Kakinada City Center', category: 'City', desc: 'A commercial port city famed for the Kakinada Kaja sweet and coastal ports.' },
    { name: 'Annavaram Hills', category: 'Pilgrimage', desc: 'The holy Ratnagiri hill complex offering forest views and pilgrim steps.' },
    { name: 'Pithapuram Temple', category: 'Temple / Religious', desc: 'An ancient temple town representing a major Shakti Peetha (Kukkuteswara Shiva).' },
    { name: 'Uppada Beach', category: 'Beach', desc: 'A scenic sandy beach famous for handloom Uppada Jamdani weaving culture.' },
    { name: 'Hope Island Lighthouse', category: 'Heritage', desc: 'A historic lighthouse guiding ships into the Kakinada harbor bay.' }
  ],
  'Krishna': [
    { name: 'Manginapudi Beach', category: 'Beach', desc: 'A historic beach with black soil, serving as a prominent port site in medieval eras.' },
    { name: 'Hamsaladeevi Beach', category: 'Beach', desc: 'The scenic confluence point where the Krishna River meets the Bay of Bengal.' },
    { name: 'Kuchipudi Dance Academy', category: 'Culture', desc: 'The birthplace village of Kuchipudi dance, preserving classical art training.' },
    { name: 'Machilipatnam Kalamkari Town', category: 'Culture', desc: 'The center of Machilipatnam Kalamkari, hand-block printing on textiles.' },
    { name: 'Machilipatnam Port town', category: 'City', desc: 'A historic port town trading with European nations during the colonial era.' },
    { name: 'Hamsaladeevi Venugopala Temple', category: 'Temple / Religious', desc: 'An ancient temple located near the river mouth, built by Chola kings.' },
    { name: 'Krishna River Delta', category: 'Nature', desc: 'Fertile delta plains with canal networks, paddy fields, and wetlands.' },
    { name: 'Manginapudi Lake', category: 'Nature', desc: 'A quiet lagoon lake located near the beach, ideal for birdwatching.' },
    { name: 'Hamsaladeevi boating point', category: 'Adventure', desc: 'Boating safaris through delta channels to reach the ocean confluence.' },
    { name: 'Bandar Fort ruins', category: 'Historical', desc: 'Remnants of the Dutch and British fortifications guarding the historic coast.' }
  ],
  'Palnadu': [
    { name: 'Nagarjuna Sagar Dam', category: 'City', desc: 'One of the tallest masonry dams in the world, spanning the Krishna River.' },
    { name: 'Ethipothala Waterfalls', category: 'Waterfalls', desc: 'The scenic waterfalls cascade located in the dense Palnadu valleys.' },
    { name: 'Nagarjunakonda Island', category: 'Historical', desc: 'A river island housing the relocated ruins of ancient Buddhist sites.' },
    { name: 'Palnadu Battlefield site', category: 'Historical', desc: 'The historic plains of Karempudi, famous for the battle of Palnadu.' },
    { name: 'Ethipothala Valley park', category: 'Nature', desc: 'A scenic valley reserve offering viewpoints and crocodile conservation pools.' },
    { name: 'Nagarjuna Sagar Lake', category: 'Nature', desc: 'A massive artificial reservoir lake, perfect for boat cruises and photography.' },
    { name: 'Dachapalli Caves', category: 'Nature', desc: 'Natural limestone caves located in the dry scrub forest terrains of Palnadu.' },
    { name: 'Karempudi town', category: 'City', desc: 'A historic town preserving heritage shrines and weapons of the Palnadu heroes.' },
    { name: 'Nagarjunasagar boating point', category: 'Adventure', desc: 'Daily launch boat trips connecting the mainland to the Nagarjunakonda museum.' },
    { name: 'Guttikonda Bilam Caves', category: 'Historical', desc: 'An ancient cave temple nestled in the hills, used by sages for meditation.' }
  ],
  'Bapatla': [
    { name: 'Suryalanka Beach', category: 'Beach', desc: 'A popular flat beach with fine sand, ideal for family picnics and weekend getaways.' },
    { name: 'Vodarevu Beach', category: 'Beach', desc: 'A busy fishing harbor beach offering scenic views of traditional boats.' },
    { name: 'Bapatla Bhavanarayana Temple', category: 'Temple / Religious', desc: 'A historic 11th-century temple showcasing Chola and Vijayanagara architectural styles.' },
    { name: 'Chirala Weaving Hub', category: 'Culture', desc: 'A famous textile hub town known for handloom weaving of cotton sarees.' },
    { name: 'Bapatla City Center', category: 'City', desc: 'An educational and agricultural research hub city with historic churches.' },
    { name: 'Suryalanka Resorts', category: 'Nature', desc: 'Scenic beach resort complexes managed for coastal recreation.' },
    { name: 'Vodarevu Fishing Port', category: 'Nature', desc: 'A traditional coastal fish landing center, bustling with morning auctions.' },
    { name: 'Bhavanarayana temple tanks', category: 'Heritage', desc: 'Holy water tanks attached to the ancient temple, surrounded by stone steps.' },
    { name: 'Suryalanka Coastline', category: 'Nature', desc: 'Long stretches of sandy coastline offering shore birds observation.' },
    { name: 'Chirala Beach point', category: 'Beach', desc: 'A quiet, less-crowded extension of the sandy coastline near Chirala.' }
  ],
  'Prakasam': [
    { name: 'Markapur Chennakesava Temple', category: 'Temple / Religious', desc: 'A historic temple built by Vijayanagara rulers, featuring a 135-foot gopuram.' },
    { name: 'Ongole City Center', category: 'City', desc: 'The district capital city, famous for the globally renowned Ongole bull breed.' },
    { name: 'Singarayakonda Temple', category: 'Temple / Religious', desc: 'A hill temple dedicated to Sri Varaha Narasimha Swamy, overlooking the plains.' },
    { name: 'Chirala Beach', category: 'Beach', desc: 'A clean beach offering waves, fishing activities, and sunset viewpoints.' },
    { name: 'Markapur Slate Industry', category: 'City', desc: 'A commercial hub town known for producing slates for schools across India.' },
    { name: 'Cumbum Lake', category: 'Nature', desc: 'A historic artificial lake built by Princess Vardhanadevi in the 15th century.' },
    { name: 'Singarayakonda Hilltop View', category: 'Nature', desc: 'Panoramic points atop the temple hill, offering views of coconut groves.' },
    { name: 'Ongole Bull farm', category: 'Nature', desc: 'Breeding stations conserving the massive Ongole bull livestock heritage.' },
    { name: 'Cumbum Dam', category: 'Heritage', desc: 'One of the oldest dams in Asia, constructed using massive dry stone blocks.' },
    { name: 'Kothapatnam Beach', category: 'Beach', desc: 'A peaceful coastal beach located close to Ongole, featuring recreation parks.' }
  ],
  'West Godavari': [
    { name: 'Somarama Temple', category: 'Temple / Religious', desc: 'One of the five Pancharama Kshetras dedicated to Lord Shiva, located in Bhimavaram.' },
    { name: 'Ksheerarama Temple', category: 'Temple / Religious', desc: 'A holy Pancharama temple featuring a towering 120-foot gopuram built by Chalukyas.' },
    { name: 'Bhimavaram City Center', category: 'City', desc: 'The commercial hub city, famous for shrimp farming, rice mills, and festivals.' },
    { name: 'Kolleru Wetlands', category: 'Nature', desc: 'The rich freshwater lake wetlands situated in the West Godavari basin.' },
    { name: 'Palakollu town', category: 'City', desc: 'A bustling agricultural center surrounded by coconut groves and paddy fields.' },
    { name: 'Somarama Temple Tank', category: 'Heritage', desc: 'The sacred pond (Chandra Pushkarini) in front of the temple, filled with lotus flowers.' },
    { name: 'Ksheerarama Gopuram', category: 'Heritage', desc: 'An architectural marvel representing East Chalukyan temple architecture.' },
    { name: 'Narsapur Lace Industry', category: 'Culture', desc: 'A famous export center where artisans weave intricate handmade thread lace works.' },
    { name: 'Godavari delta canals', category: 'Nature', desc: 'Scenic delta irrigation canals cutting through coconut orchards.' },
    { name: 'Perupalem Beach', category: 'Beach', desc: 'A quiet, sandy beach located close to Narsapur, offering views of the bay.' }
  ],
  'East Godavari': [
    { name: 'Rajahmundry City Center', category: 'City', desc: 'The cultural capital of Andhra Pradesh, situated on the banks of Godavari.' },
    { name: 'Godavari Arch Bridge', category: 'Historical', desc: 'An architectural railway bridge spanning the massive Godavari River.' },
    { name: 'Rajahmundry ISKCON Temple', category: 'Temple / Religious', desc: 'A beautiful temple complex on the riverbanks, featuring meditation halls.' },
    { name: 'Dowleswaram Barrage', category: 'City', desc: 'A historic barrage built by Sir Arthur Cotton, transforming delta agriculture.' },
    { name: 'Godavari River cruise', category: 'Adventure', desc: 'Boat tours starting from Rajahmundry to explore the river islands.' },
    { name: 'Kadiyam Nursery Gardens', category: 'Nature', desc: 'A massive hub of plant nurseries, cultivating thousands of flower species.' },
    { name: 'Dowleswaram Cotton Museum', category: 'Culture', desc: 'A museum showcasing the life and canal works of British engineer Arthur Cotton.' },
    { name: 'Rajahmundry Ghats', category: 'Pilgrimage', desc: 'Sacred river steps (Saraswathi Ghat) where pilgrims take holy baths.' },
    { name: 'Kadiapulanka flower fields', category: 'Nature', desc: 'Vast colorful fields of roses, jasmines, and lilies under cultivation.' },
    { name: 'Rajahmundry parklands', category: 'Nature', desc: 'Riverside parks offering pathways, sunset decks, and local snacks.' }
  ],
  'Annamayya': [
    { name: 'Horsley Hills Resort', category: 'Hill Station', desc: 'A beautiful hill resort at 1,265 meters elevation, named after collector W.D. Horsley.' },
    { name: 'Tallapaka Poet Village', category: 'Culture', desc: 'The birthplace of Saint Annamacharya, who composed thousands of Telugu sankirtanas.' },
    { name: 'Gurramkonda Fort', category: 'Historical', desc: 'A hill fortress featuring a palace (Rangin Mahal) and historic stone gates.' },
    { name: 'Horsley Hills Trekking', category: 'Adventure', desc: 'Trekking trails through dense forests to reach viewpoints like Gali Bandalu.' },
    { name: 'Annamacharya Memorial', category: 'Culture', desc: 'A cultural museum and music academy dedicated to the compositions of Annamayya.' },
    { name: 'Gurramkonda Rangin Mahal', category: 'Heritage', desc: 'A two-story royal palace inside the fort, showcasing historic plaster designs.' },
    { name: 'Horsley Hills forest path', category: 'Nature', desc: 'Wooded trails winding through eucalyptus trees and wild scrublands.' },
    { name: 'Madanapalle Town Center', category: 'City', desc: 'A commercial town famed for silk trade and the school where Tagore translated the national anthem.' },
    { name: 'Kalyani Dam Reservoir', category: 'Nature', desc: 'A tranquil forest reservoir located near the base of the hills.' },
    { name: 'Sompalem Chennakesava Temple', category: 'Temple / Religious', desc: 'An ancient temple featuring exquisitely carved monolithic pillars.' }
  ],
  'Sri Sathya Sai': [
    { name: 'Puttaparthi Ashram', category: 'Pilgrimage', desc: 'Prasanthi Nilayam, the global spiritual ashram founded by Sri Sathya Sai Baba.' },
    { name: 'Lepakshi Temple Complex', category: 'Heritage', desc: 'The Veerabhadra temple famous for stone carvings, murals, and the hanging pillar.' },
    { name: 'Puttaparthi Planetarium', category: 'City', desc: 'A modern space science education center located inside the spiritual township.' },
    { name: 'Lepakshi monolithic Nandi', category: 'Historical', desc: 'The colossal stone Nandi bull located near the temple, carved from a single rock.' },
    { name: 'Puttaparthi Chaitanya Jyoti', category: 'Culture', desc: 'An architectural museum showcasing the history and teachings of Sai Baba.' },
    { name: 'Lepakshi Hanging Pillar', category: 'Heritage', desc: 'An engineering marvel of Vijayanagara architects, where a pillar hangs without touching the floor.' },
    { name: 'Pennar Riverbed', category: 'Nature', desc: 'The dry sandy bed of the Pennar River, ideal for evening walks.' },
    { name: 'Puttaparthi Hill view', category: 'Nature', desc: 'Tranquil hills surrounding the ashram, offering meditation points.' },
    { name: 'Dharmavaram Border Area', category: 'Culture', desc: 'The region neighboring the silk weaving hub, preserving traditional crafts.' },
    { name: 'Puttaparthi Super Hospital', category: 'City', desc: 'A monumental healthcare institution built in palatial architectural style.' }
  ],
  'Parvathipuram Manyam': [
    { name: 'Thotapalli Barrage Project', category: 'Nature', desc: 'A scenic dam reservoir built across the Nagavali River, surrounded by hills.' },
    { name: 'Parvathipuram Town Center', category: 'City', desc: 'A commercial agricultural town acting as the gateway to the tribal agency area.' },
    { name: 'Kurupam Palace ruins', category: 'Historical', desc: 'The heritage ruins of the Kurupam Zamindars estate, featuring carvings.' },
    { name: 'Nagavali River banks', category: 'Nature', desc: 'Scenic riverbanks offering viewpoints of the rolling Eastern Ghats.' },
    { name: 'Thotapalli Reservoir', category: 'Nature', desc: 'A vast water body attracting water birds and local fishermen.' },
    { name: 'Parvathipuram tribal market', category: 'Tribal', desc: 'Weekly tribal markets (shandy) where hill tribes trade forest produce.' },
    { name: 'Manyam Forest reserves', category: 'Wildlife', desc: 'Forest ranges housing wild elephants, leopards, and deciduous trees.' },
    { name: 'Kurupam Hills', category: 'Adventure', desc: 'Trekking trails through tribal valleys and rolling hills of Manyam.' },
    { name: 'Thotapalli parklands', category: 'Nature', desc: 'A municipal park built near the barrage, offering play areas and views.' },
    { name: 'Nagavali bridge', category: 'City', desc: 'A long steel girder bridge connecting the tribal hills with the plains.' }
  ],
  'Vizianagaram': [
    { name: 'Vizianagaram Fort', category: 'Historical', desc: 'A majestic 18th-century stone fort built by the Gajapathi Kings, featuring a grand gateway.' },
    { name: 'Rama Tirtham Temple', category: 'Temple / Religious', desc: 'An ancient temple site on a hill, sacred to Lord Rama, featuring Buddhist ruins.' },
    { name: 'Kumili Temple Complex', category: 'Heritage', desc: 'A unique collection of temples built by local kings, featuring detailed sculptures.' },
    { name: 'Vizianagaram Clock Tower', category: 'City', desc: 'A historic 19th-century clock tower built in Gothic style in the city center.' },
    { name: 'Gajapathiraju Palace', category: 'Historical', desc: 'A grand royal palace (Moti Mahal) now housing historic educational institutions.' },
    { name: 'Rama Tirtham Bodhikonda', category: 'Nature', desc: 'The sacred hill containing ruins of Buddhist monasteries and Jain caves.' },
    { name: 'Vizianagaram Lake park', category: 'Nature', desc: 'A peaceful lake park (Phool Bagh) constructed around a historic reservoir.' },
    { name: 'Vizianagaram Market', category: 'City', desc: 'A traditional trade center famous for jute goods, brass vessels, and textiles.' },
    { name: 'Rama Tirtham Water tank', category: 'Heritage', desc: 'A sacred spring-fed pond at the foot of the hill, used for temple rituals.' },
    { name: 'Kumili Village gardens', category: 'Nature', desc: 'Scenic agricultural fields and traditional orchards surrounding the Kumili temples.' }
  ],
  'Chittoor': [
    { name: 'Kanipakam Varasiddhi Temple', category: 'Temple / Religious', desc: 'A famous self-manifested Ganesha temple, where the idol is believed to be growing.' },
    { name: 'Gurramkonda Fort borders', category: 'Historical', desc: 'The historic hill trails connecting Chittoor with Annamayya district.' },
    { name: 'Kaundinya Wildlife Sanctuary', category: 'Wildlife', desc: 'A wildlife sanctuary and elephant reserve, covered in thorny scrub forests.' },
    { name: 'Kanipakam Temple tank', category: 'Heritage', desc: 'The holy temple pond (Bahuda River channel) where devotees take dips.' },
    { name: 'Chittoor mango markets', category: 'City', desc: 'A major agricultural hub town, home to Asia\'s largest mango processing industry.' },
    { name: 'Kaundinya elephant camps', category: 'Nature', desc: 'Protected forest zones where wild Asiatic elephant herds are conserved.' },
    { name: 'Chittoor Hills path', category: 'Nature', desc: 'Winding forest ghat roads crossing the Rayalaseema border ranges.' },
    { name: 'Ardhagiri Veeranjaneya Temple', category: 'Temple / Religious', desc: 'A hill temple dedicated to Hanuman, famed for a natural spring with healing powers.' },
    { name: 'Kaundinya forest trekking', category: 'Adventure', desc: 'Hiking trails crossing scrub forests, rocky outcrops, and seasonal streams.' },
    { name: 'Chittoor Fort ruins', category: 'Historical', desc: 'Lesser-known ruins of Vijayanagara-era outposts scattered on hills.' }
  ]
};

// Create directories if missing
if (!fs.existsSync(DISTRICTS_DIR)) {
  fs.mkdirSync(DISTRICTS_DIR, { recursive: true });
}

// Generate the 26 district files
async function generateAll() {
  console.log('Generating curated district JSON files...');
  
  const allDistricts = districtsList;
  let totalPlacesWritten = 0;
  const seenSlugs = new Set();

  for (const dist of allDistricts) {
    const baseCoords = districtCoords[dist] || { lat: 16.0, lng: 80.0 };
    let places = [];

    // Find if we have custom ones in rawPlaces
    const customPlaces = rawPlaces.filter(p => p.districtName === dist);
    
    // Add custom ones
    customPlaces.forEach((cp, idx) => {
      let slug = cp.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (seenSlugs.has(slug)) {
        slug = `${slug}-${dist.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
      }
      seenSlugs.add(slug);

      // Find category images
      const imagesPool = categoryImages[cp.category] || categoryImages.Other;
      // Get unique images
      const coverImage = imagesPool[idx % imagesPool.length];
      const gallery = imagesPool.filter(img => img !== coverImage).slice(0, 3);

      places.push({
        name: cp.name,
        slug: slug,
        districtName: dist,
        description: cp.description,
        shortDescription: `Explore ${cp.name} in ${dist}.`,
        category: cp.category,
        location: {
          type: 'Point',
          coordinates: cp.location
        },
        rating: { average: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)), count: 0 },
        bestTimeToVisit: 'October to March',
        entryFee: 'Free',
        timings: '6:00 AM - 6:00 PM',
        isFeatured: idx === 0,
        isActive: true,
        coverImage: coverImage,
        images: [coverImage, ...gallery]
      });
    });

    // If we have templates, load them
    const templates = curatedPlaceTemplates[dist] || [];
    templates.forEach((temp, idx) => {
      let slug = temp.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (seenSlugs.has(slug)) {
        slug = `${slug}-${dist.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
      }
      seenSlugs.add(slug);

      const imagesPool = categoryImages[temp.category] || categoryImages.Other;
      const coverImage = imagesPool[idx % imagesPool.length];
      const gallery = imagesPool.filter(img => img !== coverImage).slice(0, 3);
      const offsetLat = baseCoords.lat + (Math.random() * 0.08 - 0.04);
      const offsetLng = baseCoords.lng + (Math.random() * 0.08 - 0.04);

      places.push({
        name: temp.name,
        slug: slug,
        districtName: dist,
        description: temp.desc,
        shortDescription: `A beautiful ${temp.category.toLowerCase()} spot in ${dist}.`,
        category: temp.category,
        location: {
          type: 'Point',
          coordinates: [parseFloat(offsetLng.toFixed(4)), parseFloat(offsetLat.toFixed(4))]
        },
        rating: { average: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)), count: 0 },
        bestTimeToVisit: 'October to March',
        entryFee: 'Free',
        timings: '6:00 AM - 6:00 PM',
        isFeatured: idx === 0 && places.length === 0,
        isActive: true,
        coverImage: coverImage,
        images: [coverImage, ...gallery]
      });
    });

    // Write file
    const safeName = dist.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-');
    const filePath = path.join(DISTRICTS_DIR, `${safeName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(places, null, 2), 'utf-8');
    totalPlacesWritten += places.length;
    console.log(`Saved ${places.length} places for district ${dist} to ${filePath}`);
  }

  console.log(`\nSuccessfully bootstrapped ${totalPlacesWritten} places across 26 districts!`);
}

generateAll();
