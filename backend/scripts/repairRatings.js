const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Review = require('../models/Review');
const Place = require('../models/Place');
const User = require('../models/User');

if (!process.env.MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI;
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'review-repair-report.json');

// Required backup files
const REQUIRED_BACKUPS = [
  'districts-backup.json',
  'places-backup.json',
  'users-backup.json',
  'reviews-backup.json'
];

async function runRepair() {
  console.log('Validating backup existence before repair...');
  
  // Verify backup files exist
  const missingBackups = [];
  for (const filename of REQUIRED_BACKUPS) {
    const backupPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) {
      missingBackups.push(filename);
    }
  }

  if (missingBackups.length > 0) {
    console.error('\n❌ ERROR: Cannot proceed with repair. The following backup files are missing:');
    missingBackups.forEach(file => console.error(`  - backups/${file}`));
    console.error('\nNo repair script should run unless a fresh backup exists.');
    console.error('Please run the backup command first:');
    console.error('  npm run backup\n');
    process.exit(1);
  }

  console.log('Backup files verified. Connecting to MongoDB for repair...');
  try {
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    const repairReport = {
      timestamp: new Date().toISOString(),
      backupVerified: true,
      cleanedOrphans: 0,
      cleanedDuplicates: 0,
      cleanedInvalidRatings: 0,
      placesRecalculated: 0,
      details: {
        orphansRemoved: [],
        duplicatesRemoved: [],
        invalidRatingsRemoved: [],
        placesUpdated: []
      }
    };

    // Fetch collections
    const reviews = await Review.find({});
    const places = await Place.find({});
    const users = await User.find({});

    const placeIds = new Set(places.map(p => p._id.toString()));
    const userIds = new Set(users.map(u => u._id.toString()));

    const userPlaceMap = new Map();

    console.log('1. Cleaning up invalid ratings, orphans, and duplicates...');
    
    for (const review of reviews) {
      const reviewId = review._id.toString();
      const placeId = review.place ? review.place.toString() : null;
      const userId = review.user ? review.user.toString() : null;
      const rating = review.rating;

      // A. Check rating range
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        console.log(`Removing review ${reviewId} with invalid rating: ${rating}`);
        await Review.findByIdAndDelete(reviewId);
        repairReport.cleanedInvalidRatings++;
        repairReport.details.invalidRatingsRemoved.push({ reviewId, placeId, userId, rating });
        continue;
      }

      // B. Check orphans
      let isOrphan = false;
      let reason = [];
      if (!placeId || !placeIds.has(placeId)) {
        isOrphan = true;
        reason.push('Place does not exist');
      }
      if (!userId || !userIds.has(userId)) {
        isOrphan = true;
        reason.push('User does not exist');
      }

      if (isOrphan) {
        console.log(`Removing orphaned review ${reviewId}. Reason: ${reason.join(', ')}`);
        await Review.findByIdAndDelete(reviewId);
        repairReport.cleanedOrphans++;
        repairReport.details.orphansRemoved.push({ reviewId, placeId, userId, reason });
        continue;
      }

      // C. Collect for duplicate detection (only valid, non-orphan reviews)
      const key = `${userId}-${placeId}`;
      if (!userPlaceMap.has(key)) {
        userPlaceMap.set(key, []);
      }
      userPlaceMap.get(key).push(review);
    }

    // Process duplicates: keep the latest one (based on updatedAt/createdAt), delete the rest
    for (const [key, userPlaceReviews] of userPlaceMap.entries()) {
      if (userPlaceReviews.length > 1) {
        // Sort: newest first
        userPlaceReviews.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA;
        });

        const keepReview = userPlaceReviews[0];
        const deleteReviews = userPlaceReviews.slice(1);

        const [userId, placeId] = key.split('-');
        console.log(`Found duplicate reviews for user ${userId} on place ${placeId}. Keeping ${keepReview._id}.`);

        for (const delReview of deleteReviews) {
          console.log(`  Deleting duplicate review: ${delReview._id}`);
          await Review.findByIdAndDelete(delReview._id);
          repairReport.cleanedDuplicates++;
          repairReport.details.duplicatesRemoved.push({
            deletedReviewId: delReview._id,
            keptReviewId: keepReview._id,
            userId,
            placeId
          });
        }
      }
    }

    console.log('2. Recalculating all Place ratings and counts...');
    for (const place of places) {
      const placeId = place._id.toString();
      
      // Calculate true metrics directly using static helper
      await Review.calculatePlaceRatings(placeId);
      
      // Fetch updated place to log details
      const updatedPlace = await Place.findById(placeId);
      const newAverage = updatedPlace.rating && typeof updatedPlace.rating.average === 'number' ? updatedPlace.rating.average : 0;
      const newCount = updatedPlace.rating && typeof updatedPlace.rating.count === 'number' ? updatedPlace.rating.count : 0;
      
      const oldAverage = place.rating && typeof place.rating.average === 'number' ? place.rating.average : 0;
      const oldCount = place.rating && typeof place.rating.count === 'number' ? place.rating.count : 0;

      if (newAverage !== oldAverage || newCount !== oldCount) {
        repairReport.details.placesUpdated.push({
          placeId,
          placeName: place.name,
          old: { average: oldAverage, count: oldCount },
          new: { average: newAverage, count: newCount }
        });
      }
      
      repairReport.placesRecalculated++;
    }

    fs.writeFileSync(REPORT_PATH, JSON.stringify(repairReport, null, 2), 'utf-8');
    console.log(`\nRepair operation completed successfully! Report saved at ${REPORT_PATH}`);
    console.log(`Summary:`);
    console.log(`- Orphan reviews removed: ${repairReport.cleanedOrphans}`);
    console.log(`- Duplicate reviews removed: ${repairReport.cleanedDuplicates}`);
    console.log(`- Invalid rating reviews removed: ${repairReport.cleanedInvalidRatings}`);
    console.log(`- Places recalculated: ${repairReport.placesRecalculated}`);
    console.log(`- Places with modified metrics: ${repairReport.details.placesUpdated.length}`);

  } catch (error) {
    console.error('Repair failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

runRepair();
