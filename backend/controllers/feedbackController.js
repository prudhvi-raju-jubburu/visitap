const Feedback = require('../models/Feedback');

exports.createFeedback = async (req, res, next) => {
  try {
    const { name, contactInfo, rating, message } = req.body;
    if (!name || !contactInfo || !message) return res.status(400).json({ success: false, message: 'Name, contact info, and message are required' });
    const feedback = await Feedback.create({ name, contactInfo, rating: rating || 5, message });
    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    next(error);
  }
};

exports.getFeedbacks = async (req, res, next) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
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
