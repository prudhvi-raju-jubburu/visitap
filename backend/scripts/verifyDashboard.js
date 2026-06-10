const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const AnalyticsEvent = require('../models/AnalyticsEvent');
const User = require('../models/User');
const Place = require('../models/Place');
const District = require('../models/District');
const TripPlan = require('../models/TripPlan');
const Review = require('../models/Review');
const Feedback = require('../models/Feedback');
const UserCollection = require('../models/UserCollection');

async function testDashboardQueries() {
  console.log('🏁 Starting Dashboard Aggregation Pipelines Dry-Run Verification...');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB.');

    // 1. Dashboard summary counters
    console.log('👉 Testing summary counters queries...');
    const counts = await Promise.all([
      User.countDocuments({}),
      Review.countDocuments({}),
      Feedback.countDocuments({}),
      District.countDocuments({}),
      Place.countDocuments({}),
      TripPlan.countDocuments({}),
      UserCollection.countDocuments({})
    ]);
    console.log('✅ Summary counters: OK.', counts);

    // 2. Recent activities query
    console.log('👉 Testing recent activities logs query...');
    const recent = await AnalyticsEvent.find({})
      .populate('userId', 'name email')
      .populate('placeId', 'name slug')
      .populate('districtId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(10);
    console.log(`✅ Recent activities query: OK. Fetched ${recent.length} events.`);

    // 3. Trending alerts calculation
    console.log('👉 Testing 7-day activity delta delta alerts pipeline...');
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const deltaAlerts = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'PLACE_VIEW',
          createdAt: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: '$placeId',
          currentViews: {
            $sum: { $cond: [{ $gte: ['$createdAt', sevenDaysAgo] }, 1, 0] }
          },
          previousViews: {
            $sum: { $cond: [{ $lt: ['$createdAt', sevenDaysAgo] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          placeId: '$_id',
          currentViews: 1,
          previousViews: 1,
          delta: { $subtract: ['$currentViews', '$previousViews'] }
        }
      },
      { $sort: { delta: -1 } },
      { $limit: 5 }
    ]);
    console.log(`✅ Trending alerts pipeline: OK. Fetched ${deltaAlerts.length} indicators.`);

    // 4. Growth weekly/monthly/yearly trends
    console.log('👉 Testing user registrations growth query & monthly trends...');
    const monthlyRegistrations = [];
    for (let i = 5; i >= 0; i--) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await User.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
      const monthLabel = startOfMonth.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      monthlyRegistrations.push({ month: monthLabel, registrations: count });
    }
    console.log('✅ Growth and registration monthly trends: OK.', monthlyRegistrations);

    // 5. Category engagement aggregates
    console.log('👉 Testing category engagement aggregate pipeline...');
    const categoryStats = await AnalyticsEvent.aggregate([
      { $match: { category: { $ne: null } } },
      {
        $group: {
          _id: '$category',
          views: { $sum: { $cond: [{ $eq: ['$eventType', 'PLACE_VIEW'] }, 1, 0] } },
          saves: { $sum: { $cond: [{ $eq: ['$eventType', 'SAVE_PLACE'] }, 1, 0] } },
          reviews: { $sum: { $cond: [{ $eq: ['$eventType', 'REVIEW_SUBMITTED'] }, 1, 0] } }
        }
      }
    ]);
    console.log(`✅ Category engagement pipeline: OK. Fetched ${categoryStats.length} classifications.`);

    // 6. User log-ins devices platform breakdown
    console.log('👉 Testing logins user agent device platforms pipeline...');
    const loginDevices = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'USER_LOGIN' } },
      {
        $group: {
          _id: '$metadata.deviceType',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('✅ Logins device breakdown pipeline: OK.', loginDevices);

    console.log('\n🎉 ALL DASHBOARD AGGREGATION PIPELINES VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Dashboard verification encountered an error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database.');
  }
}

testDashboardQueries();
