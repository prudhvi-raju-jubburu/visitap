const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

// Define Schemas inline to keep script self-contained
const DistrictSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: String
});

const PlaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  districtName: { type: String, required: true },
  category: String
});

const District = mongoose.model('District', DistrictSchema);
const Place = mongoose.model('Place', PlaceSchema);

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    const districts = await District.find().sort({ name: 1 });
    const places = await Place.find().sort({ name: 1 });

    console.log(`Found ${districts.length} districts and ${places.length} places.\n`);

    // Group places by districtName
    const districtMap = {};
    districts.forEach(d => {
      districtMap[d.name] = [];
    });

    places.forEach(p => {
      if (!districtMap[p.districtName]) {
        districtMap[p.districtName] = [];
      }
      districtMap[p.districtName].push(p);
    });

    // Generate Markdown output
    let output = "# Active Tourism Dataset — Districts & Places\n\n";
    output += `Total Districts: ${districts.length} | Total Places: ${places.length}\n\n`;

    districts.forEach((d, idx) => {
      const pList = districtMap[d.name] || [];
      output += `### ${idx + 1}. ${d.name} District (${pList.length} places)\n`;
      if (pList.length === 0) {
        output += `*No places found under this district.*\n\n`;
      } else {
        pList.forEach(p => {
          output += `- **${p.name}** [${p.category || 'Attraction'}]\n`;
        });
        output += `\n`;
      }
    });

    fs.writeFileSync(path.join(__dirname, '../districts_and_places.md'), output);
    console.log('Markdown generated successfully in backend/districts_and_places.md!');

  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
