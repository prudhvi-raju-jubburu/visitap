const express = require('express');
const router = express.Router();
const {
  createReview,
  updateReview,
  deleteReview,
  getPlaceReviews,
  getUserReviews,
  getReviewStats,
  getMyReviewForPlace,
} = require('../controllers/reviewController');
const { protectUser } = require('../middleware/protectUser');

// Public route to get reviews for a place
router.get('/place/:placeId', getPlaceReviews);
router.get('/stats/:placeId', getReviewStats);

// Protected routes (require user authentication)
router.post('/:placeId', createReview);
router.put('/:reviewId', protectUser, updateReview);
router.delete('/:reviewId', protectUser, deleteReview);
router.get('/user', protectUser, getUserReviews);
router.get('/my-review/:placeId', protectUser, getMyReviewForPlace);

module.exports = router;
