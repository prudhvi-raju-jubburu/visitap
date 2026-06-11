const mongoose = require('mongoose');
const Review = require('../models/Review');
const Place = require('../models/Place');
const { trackReview } = require('../services/analyticsService');
const { resolvePlace } = require('../utils/resolvePlace');

// @desc   Create a review for a tourist place
// @route  POST /api/reviews/:placeId
// @access Private (Custom guest verification inside)
const createReview = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { rating, comment } = req.body;

    // 1. Resolve the Place (handles both ObjectId and slug)
    const place = await resolvePlace(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'The requested tourist place could not be found.' });
    }

    const resolvedPlaceId = place._id;

    // 2. Custom verification of authorization for guest reviews
    let user;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        user = await User.findById(decoded.id);
      } catch (err) {
        // Token verification failed
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Please log in to submit a rating and review.' });
    }
    req.user = user;

    // 3. Validation of input parameters
    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
    }

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment content is required.' });
    }

    // 4. Check if user already left a review to enforce "Duplicate Review" constraints
    const existingReview = await Review.findOne({ user: req.user._id, place: resolvedPlaceId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this place.' });
    }

    // 5. Create new review
    const review = new Review({
      user: req.user._id,
      place: resolvedPlaceId,
      rating: numRating,
      comment: comment.trim(),
    });
    await review.save();

    // Track review submission event
    await trackReview(resolvedPlaceId, review._id, req.user._id, numRating);

    // Update aggregate stats immediately
    await Review.calculatePlaceRatings(resolvedPlaceId);

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
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this place.' });
    }
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

    // Resolve the Place (handles both ObjectId and slug)
    const place = await resolvePlace(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'The requested tourist place could not be found.' });
    }

    const resolvedPlaceId = place._id;

    const total = await Review.countDocuments({ place: resolvedPlaceId });

    const reviews = await Review.find({ place: resolvedPlaceId })
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

    // Resolve the Place (handles both ObjectId and slug)
    const place = await resolvePlace(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'The requested tourist place could not be found.' });
    }

    const resolvedPlaceId = place._id;

    const distribution = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    };

    const stats = await Review.aggregate([
      { $match: { place: new mongoose.Types.ObjectId(resolvedPlaceId) } },
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

    // Resolve the Place (handles both ObjectId and slug)
    const place = await resolvePlace(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'The requested tourist place could not be found.' });
    }

    const resolvedPlaceId = place._id;

    const review = await Review.findOne({ user: req.user._id, place: resolvedPlaceId });

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
