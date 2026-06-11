const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Place = require('../models/Place');
const { trackRegistration, trackLogin } = require('../services/analyticsService');
const { resolvePlace } = require('../utils/resolvePlace');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc   Register a new user
// @route  POST /api/users/register
// @access Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    // Track user registration
    await trackRegistration(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        favorites: user.favorites,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Login user
// @route  POST /api/users/login
// @access Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);

    // Parse User Agent for login metadata
    const ua = req.headers['user-agent'] || '';
    let browser = 'Other';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    let platform = 'Other';
    if (ua.includes('Windows')) platform = 'Windows';
    else if (ua.includes('Android')) platform = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';
    else if (ua.includes('Macintosh')) platform = 'macOS';
    else if (ua.includes('Linux')) platform = 'Linux';

    let deviceType = 'Desktop';
    if (ua.includes('Mobi') || ua.includes('Android') || ua.includes('iPhone')) {
      deviceType = 'Mobile';
    } else if (ua.includes('iPad') || ua.includes('Tablet')) {
      deviceType = 'Tablet';
    }

    await trackLogin(user._id, { deviceType, browser, platform });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        favorites: user.favorites,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get user profile
// @route  GET /api/users/profile
// @access Private
const getProfile = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      favorites: req.user.favorites,
      createdAt: req.user.createdAt,
    },
  });
};

// @desc   Update user profile
// @route  PUT /api/users/profile
// @access Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { name, email } = req.body;

    if (name) user.name = name;

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        favorites: user.favorites,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Change password
// @route  PUT /api/users/change-password
// @access Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Logout user
// @route  POST /api/users/logout
// @access Public
const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};

// @desc   Add place to user favorites
// @route  POST /api/users/favorites/:placeId
// @access Private
const addFavorite = async (req, res) => {
  try {
    const { placeId } = req.params;

    const place = await resolvePlace(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'The requested tourist place could not be found.' });
    }

    const resolvedPlaceId = place._id;

    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favorites: resolvedPlaceId } },
      { new: true }
    );

    res.json({ success: true, message: 'Place added to favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Remove place from user favorites
// @route  DELETE /api/users/favorites/:placeId
// @access Private
const removeFavorite = async (req, res) => {
  try {
    const { placeId } = req.params;

    const place = await resolvePlace(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'The requested tourist place could not be found.' });
    }

    const resolvedPlaceId = place._id;

    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favorites: resolvedPlaceId } },
      { new: true }
    );

    res.json({ success: true, message: 'Place removed from favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get user favorites populated
// @route  GET /api/users/favorites
// @access Private
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      select: 'name slug coverImage districtName category rating',
    });

    res.json({ success: true, favorites: user.favorites || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Check checkFavoriteStatus
// @route  GET /api/users/favorites/check/:placeId
// @access Private
const checkFavoriteStatus = async (req, res) => {
  try {
    const { placeId } = req.params;

    const place = await resolvePlace(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'The requested tourist place could not be found.' });
    }

    const resolvedPlaceId = place._id;

    const user = await User.findById(req.user._id);
    const isFavorite = user.favorites.includes(resolvedPlaceId);

    res.json({ success: true, isFavorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavoriteStatus,
};
