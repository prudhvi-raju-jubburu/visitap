const mongoose = require('mongoose');

const tripPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  districts: [{
    type: String
  }],
  days: [{
    dayNumber: {
      type: Number,
      required: true
    },
    places: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place'
    }]
  }],
  travelMode: {
    type: String,
    enum: ['ROAD', 'WALKING', 'CYCLING'],
    default: 'ROAD'
  },
  totalDistance: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: Number,
    default: 0
  },
  shareId: {
    type: String,
    unique: true,
    sparse: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareCount: {
    type: Number,
    default: 0
  },
  lastSavedAt: {
    type: Date
  }
}, { timestamps: true });

// Define indexes as requested
tripPlanSchema.index({ userId: 1 });
tripPlanSchema.index({ createdAt: -1 });
tripPlanSchema.index({ updatedAt: -1 });
tripPlanSchema.index({ isPublic: 1 });

module.exports = mongoose.model('TripPlan', tripPlanSchema);
