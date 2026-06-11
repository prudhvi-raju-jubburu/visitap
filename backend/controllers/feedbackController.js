const Feedback = require('../models/Feedback');
const { trackFeedback } = require('../services/analyticsService');

exports.createFeedback = async (req, res, next) => {
  try {
    const { name, contactInfo, rating, message } = req.body;

    // Check if request is authenticated
    let authenticatedUser;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        authenticatedUser = await User.findById(decoded.id);
      } catch (err) {
        // Token invalid or expired, continue as guest
      }
    }

    let feedbackData;
    if (authenticatedUser) {
      if (!message || message.trim() === '') {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }
      feedbackData = {
        user: authenticatedUser._id,
        name: authenticatedUser.name,
        contactInfo: authenticatedUser.email,
        rating: rating || 5,
        message: message.trim()
      };
    } else {
      if (!name || !contactInfo || !message || message.trim() === '') {
        return res.status(400).json({ success: false, message: 'Name, contact info, and message are required' });
      }
      feedbackData = {
        name: name.trim(),
        contactInfo: contactInfo.trim(),
        rating: rating || 5,
        message: message.trim()
      };
    }

    const feedback = await Feedback.create(feedbackData);
    await trackFeedback(feedback._id, feedback.user);
    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

exports.getFeedbacks = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (error) {
    next(error);
  }
};

exports.getTopFeedbacks = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find({ rating: { $gte: 4 } }).sort({ createdAt: -1 }).limit(6);
    res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (error) {
    next(error);
  }
};
