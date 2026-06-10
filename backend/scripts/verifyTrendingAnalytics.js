const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const AnalyticsEvent = require('../models/AnalyticsEvent');
const Place = require('../models/Place');
const District = require('../models/District');
const TripPlan = require('../models/TripPlan');

async function runTrendingAudit() {
  console.log('🏁 Starting Trending & Popularity Analytics Audit...');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB Atlas.');

    // 1. Audit Attraction Popularity Scores
    const places = await Place.find({});
    console.log(`🔎 Auditing composite popularity scores for ${places.length} attractions.`);

    // Group event counts
    const eventStats = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: { $in: ['PLACE_VIEW', 'SAVE_PLACE', 'REVIEW_SUBMITTED'] }
        }
      },
      {
        $group: {
          _id: '$placeId',
          views: { $sum: { $cond: [{ $eq: ['$eventType', 'PLACE_VIEW'] }, 1, 0] } },
          saves: { $sum: { $cond: [{ $eq: ['$eventType', 'SAVE_PLACE'] }, 1, 0] } },
          reviews: { $sum: { $cond: [{ $eq: ['$eventType', 'REVIEW_SUBMITTED'] }, 1, 0] } }
        }
      }
    ]);
    const statsMap = new Map(eventStats.map(s => [s._id?.toString(), s]));

    // Trip plan inclusions
    const tripInclusionsMap = new Map();
    const trips = await TripPlan.find({});
    trips.forEach(t => {
      t.days?.forEach(day => {
        day.places?.forEach(p => {
          if (p) {
            const id = p.toString();
            tripInclusionsMap.set(id, (tripInclusionsMap.get(id) || 0) + 1);
          }
        });
      });
    });

    const placesScored = places.map(p => {
      const pId = p._id.toString();
      const stats = statsMap.get(pId) || { views: 0, saves: 0, reviews: 0 };
      const tripInclusions = tripInclusionsMap.get(pId) || 0;
      const ratingAvg = p.rating?.average || 0;

      // Formula: (views * 0.35) + (saves * 0.25) + (reviews * 0.20) + (tripInclusions * 0.15) + (ratingAverage * 0.05)
      const popularityScore = 
        (stats.views * 0.35) + 
        (stats.saves * 0.25) + 
        (stats.reviews * 0.20) + 
        (tripInclusions * 0.15) + 
        (ratingAvg * 0.05);

      return {
        placeId: p._id,
        name: p.name,
        slug: p.slug,
        views: stats.views,
        saves: stats.saves,
        reviews: stats.reviews,
        tripInclusions,
        ratingAverage: ratingAvg,
        popularityScore: Math.round(popularityScore * 10) / 10
      };
    });

    const topTrendingPlaces = [...placesScored].sort((a, b) => b.popularityScore - a.popularityScore).slice(0, 10);

    // 2. Audit District Heat Leaderboard
    const districts = await District.find({});
    console.log(`🔎 Auditing leaderboard scores for ${districts.length} districts.`);

    const districtEvents = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: { $in: ['DISTRICT_VIEW', 'SAVE_DISTRICT'] }
        }
      },
      {
        $group: {
          _id: '$districtId',
          views: { $sum: { $cond: [{ $eq: ['$eventType', 'DISTRICT_VIEW'] }, 1, 0] } },
          saves: { $sum: { $cond: [{ $eq: ['$eventType', 'SAVE_DISTRICT'] }, 1, 0] } }
        }
      }
    ]);
    const distEventsMap = new Map(districtEvents.map(e => [e._id?.toString(), e]));

    // Place events by districtName
    const districtPlaceAgg = new Map();
    placesScored.forEach(p => {
      const dName = p.districtName || p.name; // fallback
      if (!districtPlaceAgg.has(dName)) {
        districtPlaceAgg.set(dName, { views: 0, saves: 0, reviews: 0 });
      }
      const agg = districtPlaceAgg.get(dName);
      agg.views += p.views;
      agg.saves += p.saves;
      agg.reviews += p.reviews;
    });

    const tripDistMap = new Map();
    trips.forEach(t => {
      if (t.districts) {
        t.districts.forEach(d => {
          tripDistMap.set(d, (tripDistMap.get(d) || 0) + 1);
        });
      }
    });

    const districtsScored = districts.map(d => {
      const dId = d._id.toString();
      const direct = distEventsMap.get(dId) || { views: 0, saves: 0 };
      const sub = districtPlaceAgg.get(d.name) || { views: 0, saves: 0, reviews: 0 };

      const totalViews = direct.views + sub.views;
      const totalSaves = direct.saves + sub.saves;
      const totalReviews = sub.reviews;
      const totalTrips = tripDistMap.get(d.name) || 0;

      // Formula: (views * 0.30) + (saves * 0.25) + (trips * 0.25) + (reviews * 0.20)
      const score = (totalViews * 0.30) + (totalSaves * 0.25) + (totalTrips * 0.25) + (totalReviews * 0.20);

      return {
        districtId: d._id,
        name: d.name,
        slug: d.slug,
        views: totalViews,
        saves: totalSaves,
        trips: totalTrips,
        reviews: totalReviews,
        score: Math.round(score * 10) / 10
      };
    });

    const topDistricts = districtsScored.sort((a, b) => b.score - a.score).slice(0, 5);

    // 3. Audit Search conversion metrics
    const totalSearches = await AnalyticsEvent.countDocuments({ eventType: 'SEARCH' });
    const failSearches = await AnalyticsEvent.countDocuments({ eventType: 'SEARCH_NO_RESULT' });
    const clickClicks = await AnalyticsEvent.countDocuments({ eventType: 'SEARCH_RESULT_CLICK' });

    const successRate = totalSearches > 0 
      ? Math.round(((totalSearches - failSearches) / totalSearches) * 100 * 10) / 10 
      : 0;

    const clickConversionRate = totalSearches > 0
      ? Math.round((clickClicks / totalSearches) * 100 * 10) / 10
      : 0;

    const report = {
      auditTimestamp: new Date(),
      searchMetrics: {
        totalSearches,
        failSearches,
        clickClicks,
        successRate,
        clickConversionRate
      },
      topTrendingPlaces,
      topDistricts
    };

    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    const reportPath = path.join(reportsDir, 'trending-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n✅ Trending Audit complete!`);
    console.log(`   - Top Place: ${topTrendingPlaces[0]?.name || 'N/A'} (Score: ${topTrendingPlaces[0]?.popularityScore || 0})`);
    console.log(`   - Top District: ${topDistricts[0]?.name || 'N/A'} (Score: ${topDistricts[0]?.score || 0})`);
    console.log(`   - Search Conversion: ${clickConversionRate}%`);
    console.log(`📋 Detailed report written to: ${reportPath}`);

  } catch (err) {
    console.error('❌ Trending audit encountered an error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database.');
  }
}

runTrendingAudit();
