const Place = require('../models/Place');
const District = require('../models/District');

// @desc   Get all places (optionally by district)
// @route  GET /api/places?district=name
// @access Public
const getAllPlaces = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.district) {
      filter.districtName = new RegExp(`^${req.query.district}$`, 'i');
    }
    if (req.query.featured === 'true') {
      filter.isFeatured = true;
    }
    if (req.query.category) {
      filter.category = new RegExp(`^${req.query.category}$`, 'i');
    }

    const places = await Place.find(filter)
      .sort({ rating: -1, name: 1 })
      .select('-__v');

    res.json({ success: true, count: places.length, data: places });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single place by id or slug
// @route  GET /api/places/:identifier
// @access Public
const getPlace = async (req, res) => {
  try {
    const { identifier } = req.params;
    let place;

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      place = await Place.findById(identifier);
    } else {
      place = await Place.findOne({ slug: identifier });
    }

    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found.' });
    }

    res.json({ success: true, data: place });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get nearby places using geospatial query
// @route  GET /api/places/nearby?lng=80.2&lat=13.1&radius=20
// @access Public
const getNearbyPlaces = async (req, res) => {
  try {
    const { lng, lat, radius = 20, excludeId } = req.query;

    if (lng === undefined || lat === undefined) {
      return res.status(400).json({ success: false, message: 'Longitude and latitude are required.' });
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);
    const radiusInMeters = parseFloat(radius) * 1000;

    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates provided.' });
    }

    const filter = {
      isActive: true,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusInMeters,
        },
      },
    };

    if (excludeId && excludeId.match(/^[0-9a-fA-F]{24}$/)) {
      filter._id = { $ne: excludeId };
    }

    const places = await Place.find(filter).limit(10).select('-__v');

    res.json({ success: true, count: places.length, data: places });
  } catch (error) {
    console.error('Nearby places error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create place (admin)
// @route  POST /api/places
// @access Private
const createPlace = async (req, res) => {
  try {
    const { lng, lat, ...rest } = req.body;

    const placeData = {
      ...rest,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
    };

    const place = await Place.create(placeData);
    res.status(201).json({ success: true, data: place });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Update place (admin)
// @route  PUT /api/places/:id
// @access Private
const updatePlace = async (req, res) => {
  try {
    const { lng, lat, ...rest } = req.body;

    const updateData = { ...rest };
    if (lng && lat) {
      updateData.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    }

    const place = await Place.findByIdAndUpdate(req.params.id, updateData, {
      new: true, runValidators: true,
    });

    if (!place) return res.status(404).json({ success: false, message: 'Place not found.' });
    res.json({ success: true, data: place });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Delete place (admin)
// @route  DELETE /api/places/:id
// @access Private
const deletePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id);
    if (!place) return res.status(404).json({ success: false, message: 'Place not found.' });
    res.json({ success: true, message: 'Place deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get unique categories and counts
// @route  GET /api/places/categories
// @access Public
const getCategories = async (req, res) => {
  try {
    const stats = await Place.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const categories = stats.filter(s => s._id).map(s => ({
      name: s._id,
      count: s.count
    }));

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllPlaces, getPlace, getNearbyPlaces, createPlace, updatePlace, deletePlace, getCategories };
