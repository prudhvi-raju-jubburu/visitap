const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

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

module.exports = { login, getMe, setup };
