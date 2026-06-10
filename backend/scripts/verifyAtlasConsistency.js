const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function runAtlasConsistencyCheck() {
  console.log('==================================================');
  console.log('   STARTING MONGODB ATLAS PRODUCTION VERIFICATION  ');
  console.log('==================================================\n');

  let failed = false;

  // 1. Connection Security & Environment Audit
  console.log('1. Auditing Connection String Security...');
  if (!MONGO_URI) {
    console.error('❌ FAIL: MONGO_URI is not set in environment variables.');
    failed = true;
  } else {
    console.log(`- MONGO_URI: ${MONGO_URI.replace(/:([^@]+)@/, ':****@')}`);
    const isLocal = MONGO_URI.includes('localhost') || MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('mongodb://127.0.0.1');
    if (isLocal) {
      console.error('❌ FAIL: MONGO_URI points to localhost. It must point to MongoDB Atlas.');
      failed = true;
    } else {
      console.log('✅ PASS: Database URL targets a remote Atlas cluster (not localhost).');
    }
  }

  // 2. Gitignore Verification
  console.log('\n2. Verifying .gitignore Security Exclusions...');
  const gitignorePath = path.join(__dirname, '..', '..', '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    console.warn('⚠ WARNING: Root .gitignore file not found.');
  } else {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim());
    
    const hasEnv = lines.includes('.env');
    const hasEnvLocal = lines.includes('.env.local');
    const hasBackendEnv = lines.includes('backend/.env');
    
    if (hasEnv && hasEnvLocal) {
      console.log('✅ PASS: .env and .env.local are properly excluded in root .gitignore.');
    } else {
      console.error('❌ FAIL: Environment files (.env or .env.local) are missing in .gitignore.');
      failed = true;
    }
  }

  if (failed) {
    console.error('\n❌ Pre-checks failed. Exiting index audit.');
    process.exit(1);
  }

  // 3. Connect to Atlas
  console.log('\n3. Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Atlas Connected successfully: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`❌ FAIL: Unable to connect to MongoDB Atlas: ${error.message}`);
    process.exit(1);
  }

  // 4. Verify MongoDB Indexes
  console.log('\n4. Auditing Collection Indexes in MongoDB Atlas...');
  try {
    const db = mongoose.connection.db;

    // A. Places Collection Indexes
    console.log('\n--- Places Collection Indexes ---');
    const placeIndexes = await db.collection('places').indexes();
    console.log('Found places indexes:', placeIndexes.map(idx => idx.name));
    
    const hasPlacesSlug = placeIndexes.some(idx => idx.key.slug === 1 && idx.unique);
    const hasPlacesLocation = placeIndexes.some(idx => idx.key.location === '2dsphere');
    const hasPlacesDistrict = placeIndexes.some(idx => idx.key.districtId === 1);
    const hasPlacesCategory = placeIndexes.some(idx => idx.key.category === 1);

    if (hasPlacesSlug) console.log('  ✅ slug (unique) index exists.');
    else { console.error('  ❌ slug (unique) index is MISSING!'); failed = true; }

    if (hasPlacesLocation) console.log('  ✅ location (2dsphere) index exists.');
    else { console.error('  ❌ location (2dsphere) index is MISSING!'); failed = true; }

    if (hasPlacesDistrict) console.log('  ✅ districtId index exists.');
    else { console.error('  ❌ districtId index is MISSING!'); failed = true; }

    if (hasPlacesCategory) console.log('  ✅ category index exists.');
    else { console.error('  ❌ category index is MISSING!'); failed = true; }

    // B. Users Collection Indexes
    console.log('\n--- Users Collection Indexes ---');
    const userIndexes = await db.collection('users').indexes();
    console.log('Found users indexes:', userIndexes.map(idx => idx.name));

    const hasUsersEmail = userIndexes.some(idx => idx.key.email === 1 && idx.unique);
    if (hasUsersEmail) console.log('  ✅ email (unique) index exists.');
    else { console.error('  ❌ email (unique) index is MISSING!'); failed = true; }

    // C. Reviews Collection Indexes
    console.log('\n--- Reviews Collection Indexes ---');
    const reviewIndexes = await db.collection('reviews').indexes();
    console.log('Found reviews indexes:', reviewIndexes.map(idx => idx.name));

    const hasReviewsCompound = reviewIndexes.some(idx => idx.key.user === 1 && idx.key.place === 1 && idx.unique);
    if (hasReviewsCompound) console.log('  ✅ user + place compound unique index exists.');
    else { console.error('  ❌ user + place compound unique index is MISSING!'); failed = true; }

    // D. Districts Collection Indexes
    console.log('\n--- Districts Collection Indexes ---');
    const districtIndexes = await db.collection('districts').indexes();
    console.log('Found districts indexes:', districtIndexes.map(idx => idx.name));

    const hasDistrictsSlug = districtIndexes.some(idx => idx.key.slug === 1 && idx.unique);
    if (hasDistrictsSlug) console.log('  ✅ slug (unique) index exists.');
    else { console.error('  ❌ slug (unique) index is MISSING!'); failed = true; }

  } catch (error) {
    console.error(`❌ FAIL during index retrieval: ${error.message}`);
    failed = true;
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed.');
  }

  console.log('\n==================================================');
  if (failed) {
    console.error('❌ PRODUCTION ATLAS AUDIT: FAILED');
    console.log('==================================================');
    process.exit(1);
  } else {
    console.log('✅ PRODUCTION ATLAS AUDIT: PASSED (ALL INDEXES & SECURITY OK)');
    console.log('==================================================');
    process.exit(0);
  }
}

runAtlasConsistencyCheck();
