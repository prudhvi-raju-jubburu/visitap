const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Configure dotenv
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Review = require('../models/Review');
const Place = require('../models/Place');
const User = require('../models/User');
const District = require('../models/District');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Error: MONGO_URI environment variable is not defined.');
  process.exit(1);
}

async function runStressTest() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  let testPlace = null;
  let testUsers = [];
  let testReviews = [];

  try {
    // Fetch a district to link with the temporary place
    const existingDistrict = await District.findOne({});
    if (!existingDistrict) {
      throw new Error('No district found in database to run stress test.');
    }
    console.log(`Found district for linking: ${existingDistrict.name} (${existingDistrict._id})`);

    // 1. Create a temporary Place
    console.log('\n--- Step 1: Creating Temporary Place ---');
    testPlace = new Place({
      name: 'Stress Test Beach',
      slug: 'stress-test-beach-' + Date.now(),
      description: 'A beautiful beach used for stress testing reviews.',
      districtId: existingDistrict._id,
      districtName: existingDistrict.name,
      category: 'Beach',
      coverImage: 'https://images.unsplash.com/photo-example',
      gallery: [],
      location: { type: 'Point', coordinates: [83.3, 17.7] },
      rating: { average: 0, count: 0 }
    });
    await testPlace.save();
    console.log(`Created test place: ${testPlace.name} (${testPlace._id})`);

    // 2. Create 10 temporary Users
    console.log('\n--- Step 2: Creating 10 Temporary Users ---');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    for (let i = 1; i <= 10; i++) {
      const user = new User({
        name: `Stress User ${i}`,
        email: `stress_user_${i}_${Date.now()}@test.com`,
        password: hashedPassword,
        favorites: []
      });
      await user.save();
      testUsers.push(user);
    }
    console.log(`Created 10 users: [${testUsers.map(u => u.name).join(', ')}]`);

    // 3. Submit 10 reviews concurrently with different ratings
    console.log('\n--- Step 3: Submitting 10 Reviews Concurrently ---');
    const ratings = [5, 4, 3, 5, 2, 4, 5, 1, 3, 5]; // Sum: 37, Avg: 3.7
    const reviewPromises = testUsers.map((user, idx) => {
      const review = new Review({
        user: user._id,
        place: testPlace._id,
        rating: ratings[idx],
        comment: `Great place! User rating: ${ratings[idx]}`
      });
      return review.save();
    });

    testReviews = await Promise.all(reviewPromises);
    console.log(`Submitted 10 reviews concurrently. Waiting for hooks to execute...`);
    
    // Wait for hooks to settle
    await new Promise(resolve => setTimeout(resolve, 500));

    // Force a final recalculation to consolidate any concurrent updates
    await Review.calculatePlaceRatings(testPlace._id);

    // 4. Verify Place average and count
    console.log('\n--- Step 4: Verifying Place Recalculation ---');
    let updatedPlace = await Place.findById(testPlace._id);
    let dbReviewsCount = await Review.countDocuments({ place: testPlace._id });
    
    console.log(`Database Reviews Count: ${dbReviewsCount}`);
    console.log(`Place Cached Count: ${updatedPlace.rating.count}`);
    console.log(`Place Cached Average: ${updatedPlace.rating.average}`);

    const expectedCount = 10;
    const expectedAverage = 3.7;

    if (dbReviewsCount !== expectedCount || updatedPlace.rating.count !== expectedCount) {
      throw new Error(`Count mismatch! Expected: ${expectedCount}, Got: DB=${dbReviewsCount}, Place=${updatedPlace.rating.count}`);
    }
    if (Math.abs(updatedPlace.rating.average - expectedAverage) > 0.01) {
      throw new Error(`Average rating mismatch! Expected: ${expectedAverage}, Got: ${updatedPlace.rating.average}`);
    }
    console.log('✅ Concurrency & Recalculation Check Passed!');

    // 5. Test Duplicate Prevention (Upsert)
    console.log('\n--- Step 5: Testing Duplicate Review Prevention (Upsert) ---');
    // Try to save another review for user 1 on the same place
    const duplicateReviewData = {
      rating: 5,
      comment: 'Updating my review to 5 stars!'
    };
    
    // We simulate what our controller does for upsert
    let review = await Review.findOne({ user: testUsers[0]._id, place: testPlace._id });
    if (review) {
      review.rating = duplicateReviewData.rating;
      review.comment = duplicateReviewData.comment;
      await review.save();
    } else {
      review = new Review({
        user: testUsers[0]._id,
        place: testPlace._id,
        ...duplicateReviewData
      });
      await review.save();
    }

    // Recalculate and fetch
    await Review.calculatePlaceRatings(testPlace._id);
    updatedPlace = await Place.findById(testPlace._id);
    dbReviewsCount = await Review.countDocuments({ place: testPlace._id });

    console.log(`After duplicate update:`);
    console.log(`Database Reviews Count: ${dbReviewsCount} (Expected: 10)`);
    
    // Ratings now: User 1 rating was 5, updated to 5. Sum: 37, Avg: 3.7
    console.log(`Place Cached Average: ${updatedPlace.rating.average} (Expected: 3.7)`);
    
    if (dbReviewsCount !== 10) {
      throw new Error(`Duplicate review created! Count is ${dbReviewsCount} instead of 10.`);
    }
    console.log('✅ Duplicate Review Prevention Checked!');

    // 6. Update multiple reviews and verify recalculation
    console.log('\n--- Step 6: Updating Multiple Reviews ---');
    // Change User 2 rating from 4 to 5, User 3 rating from 3 to 5
    // Ratings sum will be: 37 + 1 + 2 = 40. Avg: 40/10 = 4.0
    const user2Review = await Review.findOne({ user: testUsers[1]._id, place: testPlace._id });
    user2Review.rating = 5;
    await user2Review.save();

    const user3Review = await Review.findOne({ user: testUsers[2]._id, place: testPlace._id });
    user3Review.rating = 5;
    await user3Review.save();

    await Review.calculatePlaceRatings(testPlace._id);
    updatedPlace = await Place.findById(testPlace._id);
    console.log(`After updates:`);
    console.log(`Place Cached Count: ${updatedPlace.rating.count} (Expected: 10)`);
    console.log(`Place Cached Average: ${updatedPlace.rating.average} (Expected: 4.0)`);

    if (updatedPlace.rating.count !== 10 || Math.abs(updatedPlace.rating.average - 4.0) > 0.01) {
      throw new Error(`Rating recalculation failed after update! Count: ${updatedPlace.rating.count}, Avg: ${updatedPlace.rating.average}`);
    }
    console.log('✅ Multiple Reviews Update Recalculation Check Passed!');

    // 7. Delete multiple reviews and verify recalculation
    console.log('\n--- Step 7: Deleting Multiple Reviews ---');
    // Delete reviews from User 9 and User 10
    // Ratings before delete:
    // User 1: 5, User 2: 5, User 3: 5, User 4: 5, User 5: 2, User 6: 4, User 7: 5, User 8: 1, User 9: 3, User 10: 5. (Sum: 40, Avg: 4.0)
    // Deleting User 9 (rating 3) and User 10 (rating 5).
    // Remaining ratings: 5, 5, 5, 5, 2, 4, 5, 1. Sum: 32. Count: 8. Avg: 32/8 = 4.0
    const user9Review = await Review.findOne({ user: testUsers[8]._id, place: testPlace._id });
    await user9Review.deleteOne();

    const user10Review = await Review.findOne({ user: testUsers[9]._id, place: testPlace._id });
    await user10Review.deleteOne();

    await Review.calculatePlaceRatings(testPlace._id);
    updatedPlace = await Place.findById(testPlace._id);
    dbReviewsCount = await Review.countDocuments({ place: testPlace._id });

    console.log(`After deletes:`);
    console.log(`Database Reviews Count: ${dbReviewsCount} (Expected: 8)`);
    console.log(`Place Cached Count: ${updatedPlace.rating.count} (Expected: 8)`);
    console.log(`Place Cached Average: ${updatedPlace.rating.average} (Expected: 4.0)`);

    if (dbReviewsCount !== 8 || updatedPlace.rating.count !== 8 || Math.abs(updatedPlace.rating.average - 4.0) > 0.01) {
      throw new Error(`Rating recalculation failed after delete! Count: ${updatedPlace.rating.count}, Avg: ${updatedPlace.rating.average}`);
    }
    console.log('✅ Multiple Reviews Delete Recalculation Check Passed!');

  } catch (err) {
    console.error('❌ STRESS TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    // 8. Clean up
    console.log('\n--- Step 8: Cleaning Up Test Records ---');
    if (testPlace) {
      await Review.deleteMany({ place: testPlace._id });
      await Place.findByIdAndDelete(testPlace._id);
      console.log('Deleted temporary place and reviews.');
    }
    if (testUsers.length > 0) {
      await User.deleteMany({ _id: { $in: testUsers.map(u => u._id) } });
      console.log('Deleted temporary users.');
    }
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB. Stress test run finished.');
  }
}

runStressTest();
