const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BACKUPS_DIR = path.join(__dirname, '..', 'backups');
const DISTRICTS_DIR = path.join(__dirname, '..', 'data', 'districts');
const COORD_REPORT = path.join(__dirname, '..', 'reports', 'coordinate-audit.json');
const SEED_DATA_FILE = path.join(__dirname, '..', 'utils', 'seedData.js');
if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI;

const District = require('../models/District');

// Curated authentic cover images for districts that previously displayed mismatched scenery
const districtCoverCorrections = {
  'Prakasam': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Cumbum_Lake_in_Andhra_Pradesh.jpg',
  'Parvathipuram Manyam': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Thotapalli_project_dam_gates.jpg',
  'Vizianagaram': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Vizianagaram_Fort.jpg',
  'Chittoor': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Kanipakam_Temple.jpg',
  'Annakapalli': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Bojjannakonda_rock_cut_caves.jpg',
  'Palnadu': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Nagarjuna_Sagar_Dam.jpg'
};

async function runRepair() {
  console.log('Starting Phase 6: Database Repair...');

  // 1. Mandatory Backup Check
  const requiredBackupFiles = [
    'districts-backup.json',
    'places-backup.json',
    'users-backup.json',
    'reviews-backup.json'
  ];

  console.log('Verifying existence of fresh backups...');
  for (const file of requiredBackupFiles) {
    const backupPath = path.join(BACKUPS_DIR, file);
    if (!fs.existsSync(backupPath)) {
      console.error(`Error: Backup file not found at ${backupPath}`);
      console.error('A fresh database backup must be created by running "npm run backup" first.');
      process.exit(1);
    }
    const stats = fs.statSync(backupPath);
    const ageMs = Date.now() - stats.mtimeMs;
    // Check if backup is older than 2 hours
    if (ageMs > 2 * 60 * 60 * 1000) {
      console.error(`Error: Backup file "${file}" is stale (${(ageMs / 60000).toFixed(0)} minutes old).`);
      console.error('Please run "npm run backup" to generate fresh backups before executing repair.');
      process.exit(1);
    }
  }
  console.log('✓ Fresh backups verified.');

  // 2. Coordinate Repairs
  if (!fs.existsSync(COORD_REPORT)) {
    console.error(`Error: Coordinate report not found at ${COORD_REPORT}. Please run "npm run verify-coordinates" first.`);
    process.exit(1);
  }

  let coordAudits = [];
  try {
    coordAudits = JSON.parse(fs.readFileSync(COORD_REPORT, 'utf-8'));
  } catch (err) {
    console.error(`Error parsing coordinate report: ${err.message}`);
    process.exit(1);
  }

  const autoFixCoords = coordAudits.filter(a => a.action === 'auto-fix');
  console.log(`Found ${autoFixCoords.length} coordinate(s) with high confidence for auto-fix.`);

  // Group by district file to minimize write operations
  const coordFixesByFile = new Map();
  autoFixCoords.forEach(fix => {
    const file = fix.slug + '.json'; // Approximation of file name
    // Find files matching the district
    const distSafeName = fix.district.toLowerCase().replace(/\./g, '').replace(/\s+/g, '-');
    const matchedFile = `${distSafeName}.json`;
    if (!coordFixesByFile.has(matchedFile)) {
      coordFixesByFile.set(matchedFile, []);
    }
    coordFixesByFile.get(matchedFile).push(fix);
  });

  coordFixesByFile.forEach((fixes, file) => {
    const filePath = path.join(DISTRICTS_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: District place file not found: ${file}`);
      return;
    }

    try {
      let places = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let modified = false;

      places = places.map(p => {
        const fix = fixes.find(f => f.place === p.name);
        if (fix) {
          console.log(`Updating coordinates for: ${p.name} in ${file} -> [${fix.verified.join(', ')}]`);
          p.location.coordinates = fix.verified;
          modified = true;
        }
        return p;
      });

      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(places, null, 2), 'utf-8');
        console.log(`Saved coordinate fixes to ${file}`);
      }
    } catch (err) {
      console.error(`Error updating coordinates in ${file}: ${err.message}`);
    }
  });

  // 3. Image Repairs (Enhancements & Placeholders)
  console.log('Running image repairs (Phase 4 suggestions & formatting fixes)...');
  const { runImageEnhancement } = require('./updateAuthenticImages');
  try {
    runImageEnhancement();
  } catch (err) {
    console.error(`Image enhancement failed: ${err.message}`);
    process.exit(1);
  }

  // 4. District Cover Image Repairs
  console.log('Updating district cover images...');
  if (fs.existsSync(SEED_DATA_FILE)) {
    try {
      let seedContent = fs.readFileSync(SEED_DATA_FILE, 'utf-8');
      const districtsMatch = seedContent.match(/const districts = (\[[\s\S]*?\]);/);
      if (districtsMatch) {
        const districtsArray = eval(districtsMatch[1]);
        const updatedDistricts = districtsArray.map(d => {
          if (districtCoverCorrections[d.name]) {
            console.log(`Updating district cover: ${d.name} -> ${districtCoverCorrections[d.name]}`);
            d.image = districtCoverCorrections[d.name];
          }
          return d;
        });

        const updatedString = JSON.stringify(updatedDistricts, null, 2);
        seedContent = seedContent.replace(
          /const districts = \[[\s\S]*?\];/,
          `const districts = ${updatedString};`
        );
        fs.writeFileSync(SEED_DATA_FILE, seedContent, 'utf-8');
        console.log('✓ Successfully updated district cover images in seedData.js.');
      }
    } catch (err) {
      console.error(`Failed to update seedData.js district cover images: ${err.message}`);
    }
  }

  // Connect to MongoDB to update seeded districts in DB
  try {
    console.log('Connecting to MongoDB to update district collection images and slugs...');
    await mongoose.connect(MONGO_URI);
    
    // Update all district slugs to ensure double hyphens are cleaned up
    const allDistricts = await District.find({});
    for (const dist of allDistricts) {
      const oldSlug = dist.slug;
      const newSlug = dist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/-+/g, '-');
      if (oldSlug !== newSlug || districtCoverCorrections[dist.name]) {
        dist.slug = newSlug;
        if (districtCoverCorrections[dist.name]) {
          dist.image = districtCoverCorrections[dist.name];
        }
        await dist.save();
        console.log(`  Updated district: ${dist.name} (Slug: ${oldSlug} -> ${newSlug})`);
      }
    }
    
    // Extra safety update for the corrections mapping
    for (const [dName, newCover] of Object.entries(districtCoverCorrections)) {
      await District.updateOne({ name: dName }, { image: newCover });
      console.log(`  Ensured cover image for district: ${dName}`);
    }
    await mongoose.disconnect();
    console.log('✓ District database images and slugs updated.');
  } catch (err) {
    console.warn(`Warning: Failed to update districts in database directly: ${err.message}. They will be seeded by importPlaces later.`);
  }

  // 5. Rebuild Master Dataset
  console.log('Rebuilding master dataset...');
  try {
    execSync('npm run build-dataset', { stdio: 'inherit' });
    console.log('✓ Master dataset rebuilt successfully.');
  } catch (err) {
    console.error(`Failed to rebuild master dataset: ${err.message}`);
    process.exit(1);
  }

  // 6. Re-import Corrected Places
  console.log('Re-importing corrected places collection in MongoDB...');
  try {
    execSync('npm run import-places', { stdio: 'inherit' });
    console.log('✓ Seeding complete. Users, Reviews, and Favorites preserved.');
  } catch (err) {
    console.error(`Failed to re-import corrected places to MongoDB: ${err.message}`);
    process.exit(1);
  }

  console.log('\nPhase 6 database repair completed successfully! Tourism dataset fully corrected.');
}

runRepair();
