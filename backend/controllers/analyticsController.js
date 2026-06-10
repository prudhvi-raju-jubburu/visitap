const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const User = require('../models/User');
const Place = require('../models/Place');
const District = require('../models/District');
const TripPlan = require('../models/TripPlan');
const Review = require('../models/Review');
const Feedback = require('../models/Feedback');
const UserCollection = require('../models/UserCollection');
const { trackEvent } = require('../services/analyticsService');

const ALLOWED_EVENTS = [
  "PLACE_VIEW",
  "DISTRICT_VIEW",
  "SEARCH",
  "VOICE_SEARCH",
  "SEARCH_RESULT_CLICK",
  "SEARCH_NO_RESULT",
  "SAVE_PLACE",
  "SAVE_DISTRICT",
  "CREATE_TRIP",
  "SHARE_TRIP",
  "REVIEW_SUBMITTED",
  "USER_REGISTERED",
  "USER_LOGIN",
  "FEEDBACK_SUBMITTED"
];

// Helper to calculate growth percentage
const getGrowthPct = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
};

// @desc    Track client-side events with validation
// @route   POST /api/analytics/track
// @access  Public
const trackClientEvent = async (req, res) => {
  try {
    const { eventType, placeId, districtId, category, metadata } = req.body;

    if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid or restricted event type.' });
    }

    let userId = req.user ? req.user._id : null;
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Ignore token errors, treat as guest
      }
    }

    const payload = {
      userId,
      districtId: districtId && mongoose.Types.ObjectId.isValid(districtId) ? districtId : null,
      placeId: placeId && mongoose.Types.ObjectId.isValid(placeId) ? placeId : null,
      category,
      metadata: metadata || {}
    };

    // If view or search event, configure 12 months TTL
    if (['PLACE_VIEW', 'DISTRICT_VIEW', 'SEARCH', 'VOICE_SEARCH', 'SEARCH_RESULT_CLICK', 'SEARCH_NO_RESULT'].includes(eventType)) {
      payload.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    await trackEvent(eventType, payload);

    res.json({ success: true, message: 'Event logged.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard totals stats
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalReviews = await Review.countDocuments({});
    const totalFeedback = await Feedback.countDocuments({});
    const totalDistricts = await District.countDocuments({});
    const totalPlaces = await Place.countDocuments({});
    const totalTrips = await TripPlan.countDocuments({});
    const totalCollections = await UserCollection.countDocuments({});

    // Fetch the recent activity (last 10 events)
    const recentActivity = await AnalyticsEvent.find({})
      .populate('userId', 'name email')
      .populate('placeId', 'name slug')
      .populate('districtId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate Trending Alerts (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const trendingNowEvents = await AnalyticsEvent.aggregate([
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

    // Populate Place names for alerts
    const populatedAlerts = [];
    for (const alert of trendingNowEvents) {
      if (alert.placeId) {
        const place = await Place.findById(alert.placeId);
        if (place) {
          const pct = getGrowthPct(alert.currentViews, alert.previousViews);
          if (pct > 0) {
            populatedAlerts.push({
              placeId: place._id,
              name: place.name,
              slug: place.slug,
              currentViews: alert.currentViews,
              previousViews: alert.previousViews,
              percentage: pct
            });
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalUsers,
          totalReviews,
          totalFeedback,
          totalDistricts,
          totalPlaces,
          totalTrips,
          totalCollections
        },
        recentActivity,
        trendingAlerts: populatedAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Growth metrics (weekly, monthly, yearly)
// @route   GET /api/analytics/growth
// @access  Private (Admin)
const getGrowthMetrics = async (req, res) => {
  try {
    const now = new Date();
    
    // Timeframes
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);

    // Registrations count
    const regCurWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const regPrevWeek = await User.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } });

    const regCurMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const regPrevMonth = await User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    const regCurYear = await User.countDocuments({ createdAt: { $gte: oneYearAgo } });
    const regPrevYear = await User.countDocuments({ createdAt: { $gte: twoYearsAgo, $lt: oneYearAgo } });

    // Activity count (views + saves + searches + reviews)
    const actCurWeek = await AnalyticsEvent.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const actPrevWeek = await AnalyticsEvent.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } });

    const actCurMonth = await AnalyticsEvent.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const actPrevMonth = await AnalyticsEvent.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } });

    // Monthly registrations trends for the line chart (last 6 months)
    const monthlyRegistrations = [];
    for (let i = 5; i >= 0; i--) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await User.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
      const monthLabel = startOfMonth.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      monthlyRegistrations.push({ month: monthLabel, registrations: count });
    }

    res.json({
      success: true,
      data: {
        registrations: {
          weekly: { current: regCurWeek, previous: regPrevWeek, percentage: getGrowthPct(regCurWeek, regPrevWeek) },
          monthly: { current: regCurMonth, previous: regPrevMonth, percentage: getGrowthPct(regCurMonth, regPrevMonth) },
          yearly: { current: regCurYear, previous: regPrevYear, percentage: getGrowthPct(regCurYear, regPrevYear) }
        },
        activity: {
          weekly: { current: actCurWeek, previous: actPrevWeek, percentage: getGrowthPct(actCurWeek, actPrevWeek) },
          monthly: { current: actCurMonth, previous: actPrevMonth, percentage: getGrowthPct(actCurMonth, actPrevMonth) }
        },
        monthlyTrends: monthlyRegistrations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Popular places by composite ranking score
// @route   GET /api/analytics/popular
// @access  Private (Admin)
const getPopularPlaces = async (req, res) => {
  try {
    const places = await Place.find({});
    
    // Aggregation of events: PLACE_VIEW, SAVE_PLACE, REVIEW_SUBMITTED
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
    const eventStatsMap = new Map(eventStats.map(s => [s._id?.toString(), s]));

    // Trip Plan inclusions mapping
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

    // Compute popularity scores
    const placesWithScores = places.map(p => {
      const pIdStr = p._id.toString();
      const stats = eventStatsMap.get(pIdStr) || { views: 0, saves: 0, reviews: 0 };
      const tripInclusions = tripInclusionsMap.get(pIdStr) || 0;
      const ratingAverage = p.rating?.average || 0;

      // composite popularityScore formula
      const popularityScore = 
        (stats.views * 0.35) + 
        (stats.saves * 0.25) + 
        (stats.reviews * 0.20) + 
        (tripInclusions * 0.15) + 
        (ratingAverage * 0.05);

      return {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        districtName: p.districtName,
        views: stats.views,
        saves: stats.saves,
        reviews: stats.reviews,
        tripInclusions,
        ratingAverage,
        popularityScore: Math.round(popularityScore * 10) / 10
      };
    });

    // Sorting sub-metrics
    const mostViewed = [...placesWithScores].sort((a, b) => b.views - a.views).slice(0, 10);
    const mostSaved = [...placesWithScores].sort((a, b) => b.saves - a.saves).slice(0, 10);
    const mostReviewed = [...placesWithScores].sort((a, b) => b.reviews - a.reviews).slice(0, 10);
    const highestRated = [...placesWithScores].sort((a, b) => b.ratingAverage - a.ratingAverage).slice(0, 10);
    const topPopular = [...placesWithScores].sort((a, b) => b.popularityScore - a.popularityScore).slice(0, 10);

    res.json({
      success: true,
      data: {
        topPopular,
        mostViewed,
        mostSaved,
        mostReviewed,
        highestRated
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get District heat leaderboard analytics
// @route   GET /api/analytics/districts
// @access  Private (Admin)
const getDistrictAnalytics = async (req, res) => {
  try {
    const districts = await District.find({});
    const places = await Place.find({});
    const trips = await TripPlan.find({});

    // Group page view events by district
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

    // Group place events (views, saves, reviews) by district name
    const placeEvents = await AnalyticsEvent.aggregate([
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
    const placeEventsMap = new Map(placeEvents.map(e => [e._id?.toString(), e]));

    // Map place details by districtName
    const districtPlaceAgg = new Map();
    places.forEach(p => {
      const dName = p.districtName;
      if (!districtPlaceAgg.has(dName)) {
        districtPlaceAgg.set(dName, { views: 0, saves: 0, reviews: 0 });
      }
      const agg = districtPlaceAgg.get(dName);
      const pStats = placeEventsMap.get(p._id.toString()) || { views: 0, saves: 0, reviews: 0 };
      agg.views += pStats.views;
      agg.saves += pStats.saves;
      agg.reviews += pStats.reviews;
    });

    // Group trip count per district
    const tripDistMap = new Map();
    trips.forEach(t => {
      if (t.districts) {
        t.districts.forEach(d => {
          tripDistMap.set(d, (tripDistMap.get(d) || 0) + 1);
        });
      }
    });

    // Score calculations
    const districtScores = districts.map(d => {
      const dIdStr = d._id.toString();
      const direct = distEventsMap.get(dIdStr) || { views: 0, saves: 0 };
      const sub = districtPlaceAgg.get(d.name) || { views: 0, saves: 0, reviews: 0 };
      
      const totalViews = direct.views + sub.views;
      const totalSaves = direct.saves + sub.saves;
      const totalReviews = sub.reviews;
      const totalTrips = tripDistMap.get(d.name) || 0;

      // districtScore formula
      const score = (totalViews * 0.30) + (totalSaves * 0.25) + (totalTrips * 0.25) + (totalReviews * 0.20);

      return {
        _id: d._id,
        name: d.name,
        slug: d.slug,
        views: totalViews,
        saves: totalSaves,
        trips: totalTrips,
        reviews: totalReviews,
        score: Math.round(score * 10) / 10
      };
    });

    const rankedDistricts = districtScores.sort((a, b) => b.score - a.score).slice(0, 10);

    res.json({
      success: true,
      data: rankedDistricts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Search intelligence analytics
// @route   GET /api/analytics/searches
// @access  Private (Admin)
const getSearchAnalytics = async (req, res) => {
  try {
    const totalSearches = await AnalyticsEvent.countDocuments({ eventType: 'SEARCH' });
    const voiceSearchesCount = await AnalyticsEvent.countDocuments({ eventType: 'VOICE_SEARCH' });
    const clickClicksCount = await AnalyticsEvent.countDocuments({ eventType: 'SEARCH_RESULT_CLICK' });
    const failSearchesCount = await AnalyticsEvent.countDocuments({ eventType: 'SEARCH_NO_RESULT' });

    // Top Searched keywords
    const topSearches = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'SEARCH' } },
      { $group: { _id: '$metadata.searchQuery', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top Voice Searches keywords
    const topVoiceSearches = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'VOICE_SEARCH' } },
      { $group: { _id: '$metadata.searchQuery', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Conversion rate calculations
    const successRate = totalSearches > 0 
      ? Math.round(((totalSearches - failSearchesCount) / totalSearches) * 100 * 10) / 10 
      : 0;

    const clickConversionRate = totalSearches > 0
      ? Math.round((clickClicksCount / totalSearches) * 100 * 10) / 10
      : 0;

    // Recent conversions (clicks on results)
    const recentConversions = await AnalyticsEvent.find({ eventType: 'SEARCH_RESULT_CLICK' })
      .populate('placeId', 'name slug')
      .populate('districtId', 'name slug')
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        metrics: {
          totalSearches,
          voiceSearchesCount,
          clickClicksCount,
          failSearchesCount,
          successRate,
          clickConversionRate
        },
        topSearches,
        topVoiceSearches,
        recentConversions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Category engagement breakdown
// @route   GET /api/analytics/categories
// @access  Private (Admin)
const getCategoryAnalytics = async (req, res) => {
  try {
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

    // Format results
    const mostViewedCategories = [...categoryStats].sort((a, b) => b.views - a.views).map(c => ({ category: c._id, count: c.views }));
    const mostSavedCategories = [...categoryStats].sort((a, b) => b.saves - a.saves).map(c => ({ category: c._id, count: c.saves }));
    const mostReviewedCategories = [...categoryStats].sort((a, b) => b.reviews - a.reviews).map(c => ({ category: c._id, count: c.reviews }));

    res.json({
      success: true,
      data: {
        mostViewedCategories,
        mostSavedCategories,
        mostReviewedCategories
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Trip Planner analytics (travel modes, device analytics)
// @route   GET /api/analytics/trips
// @access  Private (Admin)
const getTripAnalytics = async (req, res) => {
  try {
    // 1. Get travel mode distribution
    const travelModesAgg = await TripPlan.aggregate([
      {
        $group: {
          _id: '$travelMode',
          count: { $sum: 1 }
        }
      }
    ]);
    const travelModeShare = travelModesAgg.map(t => ({ mode: t._id || 'ROAD', count: t.count }));

    // 2. Device & Platform breakdown from user logins
    const loginDevices = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'USER_LOGIN' } },
      {
        $group: {
          _id: '$metadata.deviceType',
          count: { $sum: 1 }
        }
      }
    ]);
    const deviceShare = loginDevices.map(d => ({ device: d._id || 'Desktop', count: d.count }));

    const loginBrowsers = await AnalyticsEvent.aggregate([
      { $match: { eventType: 'USER_LOGIN' } },
      {
        $group: {
          _id: '$metadata.browser',
          count: { $sum: 1 }
        }
      }
    ]);
    const browserShare = loginBrowsers.map(b => ({ browser: b._id || 'Chrome', count: b.count }));

    // 3. Top trip destinations (places most added to days.places)
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

    const topInclusions = [];
    for (const [placeId, count] of tripInclusionsMap.entries()) {
      const place = await Place.findById(placeId);
      if (place) {
        topInclusions.push({ name: place.name, district: place.districtName, count });
      }
    }
    const topTripDestinations = topInclusions.sort((a, b) => b.count - a.count).slice(0, 10);

    res.json({
      success: true,
      data: {
        travelModeShare,
        deviceShare,
        browserShare,
        topTripDestinations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  trackClientEvent,
  getDashboardStats,
  getGrowthMetrics,
  getPopularPlaces,
  getDistrictAnalytics,
  getSearchAnalytics,
  getCategoryAnalytics,
  getTripAnalytics
};
