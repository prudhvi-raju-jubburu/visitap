const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Place = require('../models/Place');
const District = require('../models/District');
const User = require('../models/User');
const Review = require('../models/Review');

if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function runRestore() {
  const args = process.argv.slice(2);
  const restoreAll = args.includes('--all');
  const restorePlaces = args.includes('--places');

  if (!restoreAll && !restorePlaces) {
    console.error('Error: Please specify restore mode: --places or --all');
    console.log('Usage:');
    console.log('  node scripts/restoreBackup.js --places  (Only restores places, preserves other collections)');
    console.log('  node scripts/restoreBackup.js --all     (Full restore of all collections)');
    process.exit(1);
  }

  console.log(`Starting restore in ${restoreAll ? 'FULL ALL-COLLECTIONS' : 'PLACES-ONLY'} mode...`);
  console.log('Connecting to MongoDB...');
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    if (restoreAll) {
      console.log('WARNING: Full restore mode will wipe all districts, users, reviews, and places!');
      
      // Restore Districts
      const districtsPath = path.join(BACKUP_DIR, 'districts-backup.json');
      if (fs.existsSync(districtsPath)) {
        console.log('Clearing District collection...');
        await District.deleteMany({});
        const districtsData = JSON.parse(fs.readFileSync(districtsPath, 'utf-8'));
        if (districtsData.length > 0) {
          await District.insertMany(districtsData);
          console.log(`Restored ${districtsData.length} districts.`);
        }
      } else {
        console.warn('District backup file not found. Skipping.');
      }

      // Restore Users
      const usersPath = path.join(BACKUP_DIR, 'users-backup.json');
      if (fs.existsSync(usersPath)) {
        console.log('Clearing User collection...');
        await User.deleteMany({});
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        if (usersData.length > 0) {
          const defaultHash = await bcrypt.hash('password123', 12);
          const sanitizedUsers = usersData.map(u => {
            if (!u.password) {
              u.password = defaultHash;
            }
            return u;
          });
          await User.insertMany(sanitizedUsers);
          console.log(`Restored ${usersData.length} users.`);
        }
      } else {
        console.warn('User backup file not found. Skipping.');
      }

      // Restore Reviews
      const reviewsPath = path.join(BACKUP_DIR, 'reviews-backup.json');
      if (fs.existsSync(reviewsPath)) {
        console.log('Clearing Review collection...');
        await Review.deleteMany({});
        const reviewsData = JSON.parse(fs.readFileSync(reviewsPath, 'utf-8'));
        if (reviewsData.length > 0) {
          await Review.insertMany(reviewsData);
          console.log(`Restored ${reviewsData.length} reviews.`);
        }
      } else {
        console.warn('Review backup file not found. Skipping.');
      }
    }

    // Restore Places (both modes restore places)
    const placesPath = path.join(BACKUP_DIR, 'places-backup.json');
    if (fs.existsSync(placesPath)) {
      console.log('Clearing Place collection...');
      await Place.deleteMany({});
      const placesData = JSON.parse(fs.readFileSync(placesPath, 'utf-8'));
      if (placesData.length > 0) {
        await Place.insertMany(placesData);
        console.log(`Restored ${placesData.length} places.`);
      } else {
        console.log('Places backup was empty. Collection cleared successfully.');
      }
    } else {
      console.warn('Place backup file not found. Skipping.');
    }

    console.log('\nRestore operation completed successfully!');
  } catch (err) {
    console.error('Restore operation failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runRestore();
