const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DISTRICTS_DIR = path.join(DATA_DIR, 'districts');
const MASTER_FILE = path.join(DATA_DIR, 'master-places.json');

function buildMasterDataset() {
  console.log('Compiling master dataset...');

  if (!fs.existsSync(DISTRICTS_DIR)) {
    console.error(`Error: Districts directory does not exist at ${DISTRICTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DISTRICTS_DIR).filter(file => file.endsWith('.json'));
  if (files.length === 0) {
    console.error('Error: No JSON files found in districts directory.');
    process.exit(1);
  }

  const masterList = [];

  files.forEach(file => {
    const filePath = path.join(DISTRICTS_DIR, file);
    try {
      const places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(places)) {
        masterList.push(...places);
        console.log(`Added ${places.length} places from ${file}`);
      } else {
        console.warn(`Warning: File ${file} did not contain an array. Skipping.`);
      }
    } catch (err) {
      console.error(`Error: Failed to read/parse ${file}: ${err.message}`);
      process.exit(1);
    }
  });

  // Ensure data folder exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Write master dataset
  try {
    fs.writeFileSync(MASTER_FILE, JSON.stringify(masterList, null, 2), 'utf-8');
    console.log(`\nSuccessfully compiled ${masterList.length} total places into ${MASTER_FILE}!`);
    process.exit(0);
  } catch (err) {
    console.error(`Error: Failed to write master dataset: ${err.message}`);
    process.exit(1);
  }
}

buildMasterDataset();
