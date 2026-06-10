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
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'review-audit.json');

async function verifyReviews() {
  console.log('Connecting to MongoDB for reviews audit...');
  try {
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }

    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    const auditReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalReviews: 0,
        orphanReviews: 0,
        duplicateReviews: 0,
        invalidRatingRange: 0,
        inconsistentPlaces: 0,
        clean: true
      },
      orphans: [],
      duplicates: [],
      invalidRatings: [],
      inconsistentPlacesList: []
    };

    // 1. Fetch all reviews, places, and users
    console.log('Fetching reviews, places, and users...');
    const reviews = await Review.find({});
    const places = await Place.find({});
    const users = await User.find({});

    const totalReviews = reviews.length;
    auditReport.summary.totalReviews = totalReviews;
    console.log(`Auditing ${totalReviews} total reviews in the system...`);

    const placeIds = new Set(places.map(p => p._id.toString()));
    const userIds = new Set(users.map(u => u._id.toString()));

    // Keep track of user-place pairs to detect duplicates
    const userPlaceMap = new Map();

    // Loop through all reviews to check orphans, duplicates, and ranges
    for (const review of reviews) {
      const reviewId = review._id.toString();
      const placeId = review.place ? review.place.toString() : null;
      const userId = review.user ? review.user.toString() : null;
      const rating = review.rating;

      // A. Check invalid rating range
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        auditReport.summary.invalidRatingRange++;
        auditReport.invalidRatings.push({
          reviewId,
          placeId,
          userId,
          rating
        });
      }

      // B. Check orphans
      let isOrphan = false;
      let orphanReason = [];

      if (!placeId || !placeIds.has(placeId)) {
        isOrphan = true;
        orphanReason.push('Place ID is invalid or does not exist');
      }
      if (!userId || !userIds.has(userId)) {
        isOrphan = true;
        orphanReason.push('User ID is invalid or does not exist');
      }

      if (isOrphan) {
        auditReport.summary.orphanReviews++;
        auditReport.orphans.push({
          reviewId,
          placeId,
          userId,
          comment: review.comment,
          reasons: orphanReason
        });
      }

      // C. Check duplicates (User can only review a Place once)
      if (placeId && userId) {
        const key = `${userId}-${placeId}`;
        if (userPlaceMap.has(key)) {
          userPlaceMap.get(key).push(reviewId);
        } else {
          userPlaceMap.set(key, [reviewId]);
        }
      }
    }

    // Process duplicates
    for (const [key, reviewIds] of userPlaceMap.entries()) {
      if (reviewIds.length > 1) {
        auditReport.summary.duplicateReviews += (reviewIds.length - 1);
        const [userId, placeId] = key.split('-');
        auditReport.duplicates.push({
          userId,
          placeId,
          reviewIds
        });
      }
    }

    // 2. Verify cached rating stats on all Place documents
    console.log(`Checking rating stats for ${places.length} places...`);
    for (const place of places) {
      const placeId = place._id.toString();
      
      // Calculate true stats for this place from db reviews (only valid non-orphan reviews)
      const placeReviews = reviews.filter(r => 
        r.place && 
        r.place.toString() === placeId && 
        r.user && 
        userIds.has(r.user.toString()) &&
        typeof r.rating === 'number' && 
        r.rating >= 1 && 
        r.rating <= 5
      );

      const trueCount = placeReviews.length;
      let trueAverage = 0;
      if (trueCount > 0) {
        const sum = placeReviews.reduce((acc, r) => acc + r.rating, 0);
        trueAverage = parseFloat((sum / trueCount).toFixed(1));
      }

      const cachedCount = place.rating && typeof place.rating.count === 'number' ? place.rating.count : 0;
      const cachedAverage = place.rating && typeof place.rating.average === 'number' ? place.rating.average : 0.0;

      // Discrepancy checks (average checked only when there are reviews)
      if (trueCount !== cachedCount || (trueCount > 0 && Math.abs(trueAverage - cachedAverage) > 0.01)) {
        auditReport.summary.inconsistentPlaces++;
        auditReport.inconsistentPlacesList.push({
          placeId,
          placeName: place.name,
          cached: { count: cachedCount, average: cachedAverage },
          actual: { count: trueCount, average: trueAverage }
        });
      }
    }

    // Determine overall cleanliness status
    const hasIssues = 
      auditReport.summary.orphanReviews > 0 || 
      auditReport.summary.duplicateReviews > 0 || 
      auditReport.summary.invalidRatingRange > 0 || 
      auditReport.summary.inconsistentPlaces > 0;

    auditReport.summary.clean = !hasIssues;

    fs.writeFileSync(REPORT_PATH, JSON.stringify(auditReport, null, 2), 'utf-8');
    console.log(`Audit report generated at: ${REPORT_PATH}`);
    console.log(`\nAudit Summary:`);
    console.log(`- Total Reviews: ${auditReport.summary.totalReviews}`);
    console.log(`- Orphan Reviews: ${auditReport.summary.orphanReviews}`);
    console.log(`- Duplicate Reviews: ${auditReport.summary.duplicateReviews}`);
    console.log(`- Invalid Rating Range: ${auditReport.summary.invalidRatingRange}`);
    console.log(`- Inconsistent Place Ratings: ${auditReport.summary.inconsistentPlaces}`);
    console.log(`- Overall Status: ${auditReport.summary.clean ? '✅ CLEAN' : '❌ INCONSISTENCIES FOUND'}`);

  } catch (error) {
    console.error('Audit failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

verifyReviews();
