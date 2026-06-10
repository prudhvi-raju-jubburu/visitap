const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Review = require('../models/Review');
const District = require('../models/District');
const Place = require('../models/Place');
const Feedback = require('../models/Feedback');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc   Login admin
// @route  POST /api/auth/login
// @access Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password.' });
    }

    const admin = await Admin.findOne({ username }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(admin._id);

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get current admin profile
// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  res.json({ success: true, admin: req.admin });
};

// @desc   Create initial admin (one-time setup)
// @route  POST /api/auth/setup
// @access Public (disabled after first use)
const setup = async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(403).json({ success: false, message: 'Admin already exists.' });
    }

    const { username, email, password } = req.body;
    const admin = await Admin.create({ username, email, password, role: 'superadmin' });

    const token = generateToken(admin._id);
    res.status(201).json({ success: true, token, admin: { id: admin._id, username: admin.username } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get admin analysis statistics
// @route  GET /api/auth/analysis
// @access Private (Admin Only)
const getAnalysis = async (req, res) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      usersThisWeek,
      totalReviews,
      reviewsThisWeek,
      totalPlaces,
      totalDistricts,
      totalFeedback,
      feedbackThisWeek,
      placesFeatured,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Review.countDocuments({ isActive: true }),
      Review.countDocuments({ isActive: true, createdAt: { $gte: oneWeekAgo } }),
      Place.countDocuments({ isActive: true }),
      District.countDocuments({ isActive: true }),
      Feedback.countDocuments({}),
      Feedback.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      Place.countDocuments({ isActive: true, isFeatured: true }),
    ]);

    // Fetch recent activity (last 5 signups and last 5 reviews)
    const [recentUsers, recentReviews] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Review.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .populate('place', 'name slug'),
    ]);

    // Calculate system average rating
    const placesRatings = await Place.find({ isActive: true }).select('rating');
    let totalRatingsSum = 0;
    let placesWithRatingsCount = 0;
    placesRatings.forEach((p) => {
      if (p.rating && p.rating.average > 0) {
        totalRatingsSum += p.rating.average;
        placesWithRatingsCount++;
      }
    });
    const systemAverageRating = placesWithRatingsCount > 0 ? totalRatingsSum / placesWithRatingsCount : 4.5;

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newThisWeek: usersThisWeek,
          recent: recentUsers,
        },
        reviews: {
          total: totalReviews,
          newThisWeek: reviewsThisWeek,
          recent: recentReviews,
        },
        places: {
          total: totalPlaces,
          featured: placesFeatured,
        },
        districts: {
          total: totalDistricts,
        },
        feedback: {
          total: totalFeedback,
          newThisWeek: feedbackThisWeek,
        },
        systemAverageRating: parseFloat(systemAverageRating.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { login, getMe, setup, getAnalysis };
