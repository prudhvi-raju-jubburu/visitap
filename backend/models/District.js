const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'District name is required'],
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  image: {
    type: String,
    default: '/images/default-district.jpg',
  },
  images: [{
    type: String,
  }],
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  shortDescription: {
    type: String,
    maxlength: 200,
  },
  highlights: [String],
  coordinates: {
    lat: Number,
    lng: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Auto-generate slug from name
districtSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }
  next();
});

module.exports = mongoose.model('District', districtSchema);
