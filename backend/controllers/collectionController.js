const mongoose = require('mongoose');
const UserCollection = require('../models/UserCollection');
const User = require('../models/User');
const Place = require('../models/Place');
const District = require('../models/District');
const TripPlan = require('../models/TripPlan');
const { updateAchievements } = require('../services/achievementService');
const { trackSavePlace, trackSaveDistrict } = require('../services/analyticsService');

// Soft abuse limits
const MAX_SAVED_PLACES = 500;
const MAX_SAVED_DISTRICTS = 26;
const MAX_SAVED_TRIPS = 100;
const MAX_RECENTLY_VIEWED = 20;

// Helper to fetch and format the full dashboard payload
async function getDashboardPayload(userId) {
  let collection = await UserCollection.findOne({ userId });

  // If no collection document exists yet, initialize it (with legacy favorites migration)
  if (!collection) {
    const user = await User.findById(userId);
    const legacyFavorites = user?.favorites || [];

    // Enforce limits on initial migration
    const slicedFavorites = legacyFavorites.slice(0, MAX_SAVED_PLACES);

    collection = new UserCollection({
      userId,
      savedPlaces: slicedFavorites.map(favId => ({ placeId: favId, savedAt: new Date() })),
      savedDistricts: [],
      savedTrips: [],
      recentlyViewed: []
    });

    // Increment saveCount and set lastSavedAt for each migrated place in DB
    if (slicedFavorites.length > 0) {
      const now = new Date();
      await Place.updateMany(
        { _id: { $in: slicedFavorites } },
        { 
          $inc: { saveCount: 1 },
          $set: { lastSavedAt: now }
        }
      );
    }

    await updateAchievements(collection);
    await collection.save();
  }

  // Populate references including summary cache items
  const populated = await UserCollection.findById(collection._id)
    .populate('savedPlaces.placeId')
    .populate('savedDistricts.districtId')
    .populate({
      path: 'savedTrips.tripId',
      populate: { path: 'days.places' }
    })
    .populate('recentlyViewed.placeId')
    .populate('stats.lastSavedPlace')
    .populate('stats.lastSavedDistrict')
    .populate('stats.lastSavedTrip');

  // Trigger achievement and progress updates to ensure numbers are fully in sync
  const uniqueDistrictsCount = await updateAchievements(collection);
  await collection.save();

  // Fetch count of shared (public) trips owned by this user
  const totalSharedTrips = await TripPlan.countDocuments({ userId, isPublic: true });

  const totalSaved = collection.stats.placesCount + collection.stats.districtsCount + collection.stats.tripsCount;
  const percentage = Math.min(100, Math.round((uniqueDistrictsCount / 26) * 100 * 10) / 10);

  return {
    success: true,
    data: {
      stats: populated.stats,
      achievements: populated.achievements,
      travelInterestProgress: {
        districtsCount: uniqueDistrictsCount,
        placesCount: collection.stats.placesCount,
        tripsCount: collection.stats.tripsCount,
        percentage
      },
      collectionSummary: {
        totalSaved,
        totalRecentViews: populated.recentlyViewed.length,
        totalSharedTrips
      },
      savedPlaces: populated.savedPlaces,
      savedDistricts: populated.savedDistricts,
      savedTrips: populated.savedTrips,
      recentlyViewed: populated.recentlyViewed
    }
  };
}

// @desc    Get complete traveler collection dashboard
// @route   GET /api/collection/dashboard
// @access  Private
const getCollectionDashboard = async (req, res) => {
  try {
    const payload = await getDashboardPayload(req.user._id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save an attraction to the collection
// @route   POST /api/collection/places/:placeId
// @access  Private
const savePlace = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Place ID.' });
    }

    // Verify Place exists
    const place = await Place.findById(placeId);
    if (!place) {
      return res.status(404).json({ success: false, message: 'Place not found.' });
    }

    let collection = await UserCollection.findOne({ userId: req.user._id });
    if (!collection) {
      await getDashboardPayload(req.user._id);
      collection = await UserCollection.findOne({ userId: req.user._id });
    }

    // Enforce soft abuse limit
    if (collection.savedPlaces.length >= MAX_SAVED_PLACES) {
      return res.status(400).json({ 
        success: false, 
        message: `Limit exceeded. You cannot save more than ${MAX_SAVED_PLACES} places.` 
      });
    }

    // Prevent duplicates
    const alreadySaved = collection.savedPlaces.some(p => p.placeId.toString() === placeId);
    if (!alreadySaved) {
      collection.savedPlaces.push({ placeId, savedAt: new Date() });
      await updateAchievements(collection);
      await collection.save();

      // Track save place event
      await trackSavePlace(placeId, req.user._id);

      // Legacy synchronization (add to User favorites)
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: placeId } });
      
      // Update Place analytics counter & timestamp
      await Place.findByIdAndUpdate(placeId, { 
        $inc: { saveCount: 1 },
        $set: { lastSavedAt: new Date() }
      });
    }

    const payload = await getDashboardPayload(req.user._id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove an attraction from the collection
// @route   DELETE /api/collection/places/:placeId
// @access  Private
const removePlace = async (req, res) => {
  try {
    const { placeId } = req.params;

    let collection = await UserCollection.findOne({ userId: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found.' });
    }

    const alreadySaved = collection.savedPlaces.some(p => p.placeId.toString() === placeId);
    if (alreadySaved) {
      collection.savedPlaces = collection.savedPlaces.filter(p => p.placeId.toString() !== placeId);
      await updateAchievements(collection);
      await collection.save();

      // Legacy synchronization (remove from User favorites)
      await User.findByIdAndUpdate(req.user._id, { $pull: { favorites: placeId } });

      // Decrement Place saveCount counter (capped at 0)
      const place = await Place.findById(placeId);
      if (place && place.saveCount > 0) {
        await Place.findByIdAndUpdate(placeId, { $inc: { saveCount: -1 } });
      }
    }

    const payload = await getDashboardPayload(req.user._id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save a district to the collection
// @route   POST /api/collection/districts/:districtId
// @access  Private
const saveDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(districtId)) {
      return res.status(400).json({ success: false, message: 'Invalid District ID.' });
    }

    const district = await District.findById(districtId);
    if (!district) {
      return res.status(404).json({ success: false, message: 'District not found.' });
    }

    let collection = await UserCollection.findOne({ userId: req.user._id });
    if (!collection) {
      await getDashboardPayload(req.user._id);
      collection = await UserCollection.findOne({ userId: req.user._id });
    }

    // Enforce soft abuse limit
    if (collection.savedDistricts.length >= MAX_SAVED_DISTRICTS) {
      return res.status(400).json({ 
        success: false, 
        message: `Limit exceeded. You cannot save more than ${MAX_SAVED_DISTRICTS} districts.` 
      });
    }

    const alreadySaved = collection.savedDistricts.some(d => d.districtId.toString() === districtId);
    if (!alreadySaved) {
      collection.savedDistricts.push({ districtId, savedAt: new Date() });
      await updateAchievements(collection);
      await collection.save();

      // Track save district event
      await trackSaveDistrict(districtId, req.user._id);

      // Update District analytics counter & timestamp
      await District.findByIdAndUpdate(districtId, { 
        $inc: { saveCount: 1 },
        $set: { lastSavedAt: new Date() }
      });
    }

    const payload = await getDashboardPayload(req.user._id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a district from the collection
// @route   DELETE /api/collection/districts/:districtId
// @access  Private
const removeDistrict = async (req, res) => {
  try {
    const { districtId } = req.params;

    let collection = await UserCollection.findOne({ userId: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found.' });
    }

    const alreadySaved = collection.savedDistricts.some(d => d.districtId.toString() === districtId);
    if (alreadySaved) {
      collection.savedDistricts = collection.savedDistricts.filter(d => d.districtId.toString() !== districtId);
      await updateAchievements(collection);
      await collection.save();

      // Decrement District saveCount
      const district = await District.findById(districtId);
      if (district && district.saveCount > 0) {
        await District.findByIdAndUpdate(districtId, { $inc: { saveCount: -1 } });
      }
    }

    const payload = await getDashboardPayload(req.user._id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save a trip plan to the collection bookmarks
// @route   POST /api/collection/trips/:tripId
// @access  Private
const saveTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ success: false, message: 'Invalid Trip ID.' });
    }

    const trip = await TripPlan.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip plan not found.' });
    }

    let collection = await UserCollection.findOne({ userId: req.user._id });
    if (!collection) {
      await getDashboardPayload(req.user._id);
      collection = await UserCollection.findOne({ userId: req.user._id });
    }

    // Enforce soft abuse limit
    if (collection.savedTrips.length >= MAX_SAVED_TRIPS) {
      return res.status(400).json({ 
        success: false, 
        message: `Limit exceeded. You cannot save more than ${MAX_SAVED_TRIPS} trips.` 
      });
    }

    const alreadySaved = collection.savedTrips.some(t => t.tripId.toString() === tripId);
    if (!alreadySaved) {
      collection.savedTrips.push({ tripId, savedAt: new Date() });
      await updateAchievements(collection);
      await collection.save();
    }

    const payload = await getDashboardPayload(req.user._id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a trip plan from the collection bookmarks
// @route   DELETE /api/collection/trips/:tripId
// @access  Private
const removeTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    let collection = await UserCollection.findOne({ userId: req.user._id });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found.' });
    }

    const alreadySaved = collection.savedTrips.some(t => t.tripId.toString() === tripId);
    if (alreadySaved) {
      collection.savedTrips = collection.savedTrips.filter(t => t.tripId.toString() !== tripId);
      await updateAchievements(collection);
      await collection.save();
    }

    const payload = await getDashboardPayload(req.user._id);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a place visit to history (Recently Viewed) and optionally merge Guest history
// @route   POST /api/collection/recent/:placeId
// @access  Private
const addRecentlyViewed = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { guestRecentIds } = req.body; // Array of placeIds from localStorage for merging

    if (!mongoose.Types.ObjectId.isValid(placeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Place ID.' });
    }

    let collection = await UserCollection.findOne({ userId: req.user._id });
    if (!collection) {
      await getDashboardPayload(req.user._id);
      collection = await UserCollection.findOne({ userId: req.user._id });
    }

    // 1. Merge guest history if provided
    if (guestRecentIds && Array.isArray(guestRecentIds)) {
      guestRecentIds.forEach(id => {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const exists = collection.recentlyViewed.some(r => r.placeId.toString() === id.toString());
          if (!exists) {
            collection.recentlyViewed.push({ placeId: id, viewedAt: new Date(Date.now() - 1000) });
          }
        }
      });
    }

    // 2. Remove place if already in history to move it to the front (latest)
    collection.recentlyViewed = collection.recentlyViewed.filter(
      r => r.placeId.toString() !== placeId.toString()
    );

    // 3. Add current place to head
    collection.recentlyViewed.unshift({ placeId, viewedAt: new Date() });

    // 4. Cap at MAX_RECENTLY_VIEWED
    if (collection.recentlyViewed.length > MAX_RECENTLY_VIEWED) {
      collection.recentlyViewed = collection.recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
    }

    await collection.save();
    
    // Return the updated populated history list
    const populated = await UserCollection.findById(collection._id).populate('recentlyViewed.placeId');
    res.json({ success: true, data: populated.recentlyViewed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCollectionDashboard,
  savePlace,
  removePlace,
  saveDistrict,
  removeDistrict,
  saveTrip,
  removeTrip,
  addRecentlyViewed
};
