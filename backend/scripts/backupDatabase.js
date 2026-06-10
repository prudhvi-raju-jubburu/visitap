const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

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

async function runBackup() {
  console.log('Connecting to MongoDB for backup...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    // Ensure backups directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const collections = [
      { model: Place, name: 'places-backup.json' },
      { model: District, name: 'districts-backup.json' },
      { model: User, name: 'users-backup.json' },
      { model: Review, name: 'reviews-backup.json' }
    ];

    for (const item of collections) {
      console.log(`Backing up ${item.model.modelName} collection...`);
      let query = item.model.find({});
      if (item.model.modelName === 'User') {
        query = query.select('+password');
      }
      const data = await query;
      const filePath = path.join(BACKUP_DIR, item.name);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Saved ${data.length} records to ${filePath}`);
    }

    console.log('\nBackup operation completed successfully!');
  } catch (err) {
    console.error('Backup operation failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runBackup();
