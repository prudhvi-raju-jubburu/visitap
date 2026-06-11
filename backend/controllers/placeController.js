const mongoose = require('mongoose');
const Place = require('../models/Place');
const District = require('../models/District');
const { resolvePlace } = require('../utils/resolvePlace');


// @desc   Get all places (optionally by district)
// @route  GET /api/places?district=name
// @access Public
const getAllPlaces = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.district) {
      const queryStr = req.query.district.trim();
      const slugStr = queryStr.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/-+/g, '-');
      
      const districtDoc = await District.findOne({
        $or: [
          { slug: slugStr },
          { slug: queryStr.toLowerCase() },
          { name: new RegExp(`^${queryStr}$`, 'i') },
          { name: new RegExp(`^${queryStr.replace(/[-\s.]+/g, '.*')}$`, 'i') }
        ]
      });

      if (districtDoc) {
        filter.districtId = districtDoc._id;
      } else {
        filter.districtName = new RegExp(`^${queryStr.replace(/-/g, ' ')}$`, 'i');
      }
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
    const place = await resolvePlace(identifier);

    if (!place) {
      return res.status(404).json({ success: false, message: 'The requested tourist place could not be found.' });
    }

    res.json({ success: true, data: place });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get smart recommended places ("You May Also Like") using weighted scoring
// @route  GET /api/places/nearby?lng=80.2&lat=13.1&radius=20&excludeId=xxx
// @access Public
const getNearbyPlaces = async (req, res) => {
  try {
    const { lng, lat, radius = 20, excludeId } = req.query;
    const { calculateHaversineDistance } = require('../utils/geospatial');
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');

    let anchorLng, anchorLat, currentPlace = null;

    if (excludeId && mongoose.Types.ObjectId.isValid(excludeId)) {
      currentPlace = await Place.findById(excludeId);
    }

    if (currentPlace) {
      anchorLng = currentPlace.location.coordinates[0];
      anchorLat = currentPlace.location.coordinates[1];
    } else {
      if (lng === undefined || lat === undefined) {
        return res.status(400).json({ success: false, message: 'Longitude and latitude are required.' });
      }
      anchorLng = parseFloat(lng);
      anchorLat = parseFloat(lat);
    }

    const searchRadiusKm = parseFloat(radius);
    if (isNaN(anchorLng) || isNaN(anchorLat) || isNaN(searchRadiusKm)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates or radius provided.' });
    }

    // Optional user authentication to personalize favorites scores
    let user = null;
    let userFavoriteCategories = new Set();
    try {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id).populate('favorites');
        if (user && user.favorites) {
          user.favorites.forEach(fav => {
            if (fav.category) userFavoriteCategories.add(fav.category);
          });
        }
      }
    } catch (err) {
      // Fail silently and proceed as anonymous
    }

    // Fetch all active places to calculate recommendations
    const allPlaces = await Place.find({ isActive: true });
    const candidates = [];

    allPlaces.forEach(candidate => {
      // Exclude reference attraction itself
      if (excludeId && candidate._id.toString() === excludeId.toString()) {
        return;
      }

      const candCoords = candidate.location.coordinates;
      const dist = calculateHaversineDistance(anchorLng, anchorLat, candCoords[0], candCoords[1]);

      // Filter by selected radius (5, 10, 20, 50 km)
      if (dist > searchRadiusKm) {
        return;
      }

      // 1. Distance Score: Closer is better
      const distanceScore = 1 - (dist / searchRadiusKm);

      // 2. Category Match Score
      const categoryScore = (currentPlace && currentPlace.category && candidate.category === currentPlace.category) ? 1 : 0;

      // 3. Rating Score: Average out of 5 stars
      const ratingScore = (candidate.rating && candidate.rating.average) ? (candidate.rating.average / 5) : 0;

      // 4. Popularity Score: Review count normalized (max 20)
      const popularityScore = (candidate.rating && candidate.rating.count) ? Math.min(1, candidate.rating.count / 20) : 0;

      // 5. User Favorites Score
      let favoritesScore = 0;
      if (user) {
        const isFavorited = user.favorites.some(fav => fav._id.toString() === candidate._id.toString());
        if (isFavorited) {
          favoritesScore += 0.5;
        }
        if (userFavoriteCategories.has(candidate.category)) {
          favoritesScore += 0.5;
        }
      }

      // Compute final composite recommendation score
      const score = (distanceScore * 0.35) + (categoryScore * 0.25) + (ratingScore * 0.20) + (popularityScore * 0.10) + (favoritesScore * 0.10);

      candidates.push({
        place: candidate.toObject ? candidate.toObject() : candidate,
        distance: dist,
        score
      });
    });

    // Sort by composite score descending
    candidates.sort((a, b) => b.score - a.score);

    // Filter to limit duplicate districts where possible (max 2 places per district)
    const recommended = [];
    const districtCounts = {};
    const deferredList = [];

    candidates.forEach(c => {
      const distName = c.place.districtName;
      if (!districtCounts[distName]) {
        districtCounts[distName] = 0;
      }

      if (districtCounts[distName] < 2) {
        recommended.push({ ...c.place, distance: c.distance, score: c.score });
        districtCounts[distName]++;
      } else {
        deferredList.push(c);
      }
    });

    // Fill remaining spots up to 10 using deferred list
    let index = 0;
    while (recommended.length < 10 && index < deferredList.length) {
      const c = deferredList[index++];
      recommended.push({ ...c.place, distance: c.distance, score: c.score });
    }

    res.json({ success: true, count: recommended.length, data: recommended.slice(0, 10) });
  } catch (error) {
    console.error('Recommendations engine error:', error.message);
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
