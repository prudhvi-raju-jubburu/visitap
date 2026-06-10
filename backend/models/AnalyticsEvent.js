const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    index: true
  },
  placeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
    index: true
  },
  category: {
    type: String
  },
  metadata: {
    searchQuery: { type: String },
    travelMode: { type: String },
    deviceType: { type: String },
    browser: { type: String },
    platform: { type: String },
    source: { type: String }
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Configure TTL index for auto-cleanup of expired events (expiresAt is configured 12 months out for raw view/search events)
analyticsEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
