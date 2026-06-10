const mongoose = require('mongoose');
const Review = require('../models/Review');
const Place = require('../models/Place');
const { trackReview } = require('../services/analyticsService');

// Helper function to calculate and update Place rating statistics using the static helper in Review model
const updatePlaceRating = async (placeId) => {
  const Review = mongoose.model('Review');
  await Review.calculatePlaceRatings(placeId);
};

// @desc   Create or update a review for a tourist place (Upsert behavior)
// @route  POST /api/reviews/:placeId
// @access Private
const createReview = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({ success: false, message: 'Invalid place ID.' });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment content is required.' });
    }

    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found.' });
    }

    // Check if user already left a review
    let review = await Review.findOne({ user: req.user._id, place: placeId });

    if (review) {
      // Update existing review
      review.rating = numRating;
      review.comment = comment.trim();
      await review.save();
    } else {
      // Create new review
      review = new Review({
        user: req.user._id,
        place: placeId,
        rating: numRating,
        comment: comment.trim(),
      });
      await review.save();
    }

    // Track review submission event
    await trackReview(placeId, review._id, req.user._id, numRating);

    // Update aggregate stats immediately
    await Review.calculatePlaceRatings(placeId);

    // Populate user info for returning
    const populatedReview = await Review.findById(review._id).populate({
      path: 'user',
      select: 'name',
    });

    res.status(201).json({
      success: true,
      message: 'Review saved successfully.',
      review: populatedReview,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update an existing review
// @route  PUT /api/reviews/:reviewId
// @access Private
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID.' });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment content is required.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Verify ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this review.' });
    }

    review.rating = numRating;
    review.comment = comment.trim();
    await review.save();

    // Update aggregate stats immediately
    await Review.calculatePlaceRatings(review.place);

    const populatedReview = await Review.findById(review._id).populate({
      path: 'user',
      select: 'name',
    });

    res.json({
      success: true,
      message: 'Review updated successfully.',
      review: populatedReview,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete a review
// @route  DELETE /api/reviews/:reviewId
// @access Private
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Verify ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
    }

    const placeId = review.place;
    await review.deleteOne();

    // Update aggregate stats immediately
    await Review.calculatePlaceRatings(placeId);

    res.json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get paginated reviews for a place
// @route  GET /api/reviews/place/:placeId
// @access Public
const getPlaceReviews = async (req, res) => {
  try {
    const { placeId } = req.params;
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({ success: false, message: 'Invalid place ID.' });
    }

    const total = await Review.countDocuments({ place: placeId });

    const reviews = await Review.find({ place: placeId })
      .populate({
        path: 'user',
        select: 'name',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all reviews created by the logged-in user
// @route  GET /api/reviews/user
// @access Private
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate({
        path: 'place',
        select: 'name slug coverImage districtName category rating',
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get rating statistics breakdown for a place
// @route  GET /api/reviews/stats/:placeId
// @access Public
const getReviewStats = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({ success: false, message: 'Invalid place ID.' });
    }

    const distribution = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    };

    const stats = await Review.aggregate([
      { $match: { place: new mongoose.Types.ObjectId(placeId) } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]);

    let totalCount = 0;
    let sumRatings = 0;

    stats.forEach((item) => {
      const rating = item._id.toString();
      if (distribution.hasOwnProperty(rating)) {
        distribution[rating] = item.count;
      }
      totalCount += item.count;
      sumRatings += item._id * item.count;
    });

    const averageRating = totalCount > 0 ? parseFloat((sumRatings / totalCount).toFixed(1)) : 0;

    res.json({
      success: true,
      averageRating,
      reviewCount: totalCount,
      distribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get the current logged-in user's review for a place
// @route  GET /api/reviews/my-review/:placeId
// @access Private
const getMyReviewForPlace = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({ success: false, message: 'Invalid place ID.' });
    }

    const review = await Review.findOne({ user: req.user._id, place: placeId });

    res.json({
      success: true,
      review: review || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getPlaceReviews,
  getUserReviews,
  getReviewStats,
  getMyReviewForPlace,
};
