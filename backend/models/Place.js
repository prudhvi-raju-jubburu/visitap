const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Place name is required'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  districtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: [true, 'District is required'],
  },
  districtName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  shortDescription: {
    type: String,
    maxlength: 250,
  },
  images: [{
    type: String,
  }],
  coverImage: {
    type: String,
    default: '/images/default-place.jpg',
  },
  category: {
    type: String,
    enum: [
      'Temple / Religious', 'Beach', 'Hill Station', 'Historical', 'Nature', 'Waterfalls', 
      'Wildlife', 'Adventure', 'City', 'Culture', 'Heritage', 'Backwaters', 'Tribal', 'Pilgrimage', 'Other'
    ],
    default: 'Other',
  },
  // GeoJSON format for geospatial queries
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 4.0,
  },
  bestTimeToVisit: String,
  entryFee: String,
  timings: String,
  tags: [String],
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// 2dsphere index for geospatial queries
placeSchema.index({ location: '2dsphere' });

// Auto-generate slug
placeSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '') + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Place', placeSchema);
