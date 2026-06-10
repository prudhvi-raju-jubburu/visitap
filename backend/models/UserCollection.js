const mongoose = require('mongoose');

const userCollectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  savedPlaces: [{
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedDistricts: [{
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  savedTrips: [{
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripPlan',
      required: true
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  recentlyViewed: [{
    placeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  stats: {
    placesCount: {
      type: Number,
      default: 0
    },
    districtsCount: {
      type: Number,
      default: 0
    },
    tripsCount: {
      type: Number,
      default: 0
    },
    lastSavedPlace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place'
    },
    lastSavedDistrict: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District'
    },
    lastSavedTrip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripPlan'
    }
  },
  achievements: {
    explorer: {
      type: Boolean,
      default: false
    },
    districtMaster: {
      type: Boolean,
      default: false
    },
    templeExplorer: {
      type: Boolean,
      default: false
    },
    beachExplorer: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

// Define indexes as requested
userCollectionSchema.index({ updatedAt: -1 });
userCollectionSchema.index({ "savedPlaces.placeId": 1 });
userCollectionSchema.index({ "savedDistricts.districtId": 1 });
userCollectionSchema.index({ "savedTrips.tripId": 1 });

module.exports = mongoose.model('UserCollection', userCollectionSchema);
