const express = require('express');
const { createFeedback, getFeedbacks, getTopFeedbacks } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/top', getTopFeedbacks);

router.route('/')
  .post(createFeedback)
  .get(protect, getFeedbacks);

module.exports = router;
