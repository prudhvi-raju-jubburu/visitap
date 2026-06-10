const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for a review.'],
    },
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: [true, 'Place is required for a review.'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating (1-5) is required.'],
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating cannot exceed 5.'],
    },
    comment: {
      type: String,
      required: [true, 'Comment content is required.'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters.'],
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique review per user per place
reviewSchema.index({ user: 1, place: 1 }, { unique: true });

// Static method to calculate place ratings
reviewSchema.statics.calculatePlaceRatings = async function (placeId) {
  try {
    const stats = await this.aggregate([
      { $match: { place: new mongoose.Types.ObjectId(placeId) } },
      {
        $group: {
          _id: '$place',
          ratingCount: { $sum: 1 },
          ratingAverage: { $avg: '$rating' },
        },
      },
    ]);

    const Place = mongoose.model('Place');
    if (stats.length > 0) {
      await Place.findByIdAndUpdate(placeId, {
        'rating.average': parseFloat(stats[0].ratingAverage.toFixed(1)),
        'rating.count': stats[0].ratingCount,
      });
    } else {
      await Place.findByIdAndUpdate(placeId, {
        'rating.average': 0,
        'rating.count': 0,
      });
    }
  } catch (err) {
    console.error(`Error calculating ratings for place ${placeId}:`, err.message);
  }
};

// Call calculatePlaceRatings after save
reviewSchema.post('save', async function () {
  await this.constructor.calculatePlaceRatings(this.place);
});

// Call calculatePlaceRatings after document delete
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  await this.constructor.calculatePlaceRatings(this.place);
});

// Call calculatePlaceRatings after query delete (if any)
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc && doc.constructor && typeof doc.constructor.calculatePlaceRatings === 'function') {
    await doc.constructor.calculatePlaceRatings(doc.place);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
