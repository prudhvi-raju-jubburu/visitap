const express = require('express');
const router = express.Router();
const {
  trackClientEvent,
  getDashboardStats,
  getGrowthMetrics,
  getPopularPlaces,
  getDistrictAnalytics,
  getSearchAnalytics,
  getCategoryAnalytics,
  getTripAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// Public tracking endpoint (used by client browser interactions)
router.post('/track', trackClientEvent);

// Admin-only analytical routes
router.get('/dashboard', protect, getDashboardStats);
router.get('/growth', protect, getGrowthMetrics);
router.get('/popular', protect, getPopularPlaces);
router.get('/districts', protect, getDistrictAnalytics);
router.get('/searches', protect, getSearchAnalytics);
router.get('/categories', protect, getCategoryAnalytics);
router.get('/trips', protect, getTripAnalytics);

module.exports = router;
