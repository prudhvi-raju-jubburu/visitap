const Place = require('../models/Place');
const TripPlan = require('../models/TripPlan');

/**
 * Recalculates and updates achievements for a given UserCollection document.
 * Returns the count of unique districts planned (Travel Interest Progress).
 * 
 * Achievements:
 * - Explorer: Save 10+ places
 * - District Master: Save 10+ districts
 * - Temple Explorer: Save 10+ temples
 * - Beach Explorer: Save 10+ beaches
 * 
 * @param {Object} collection - The UserCollection mongoose document
 */
async function updateAchievements(collection) {
  const savedPlaceIds = collection.savedPlaces.map(p => p.placeId);
  const savedDistrictIds = collection.savedDistricts.map(d => d.districtId);
  const savedTripIds = collection.savedTrips.map(t => t.tripId);

  // 1. Fetch place categories & district names
  const places = await Place.find({ _id: { $in: savedPlaceIds } });

  let templeCount = 0;
  let beachCount = 0;
  const placesDistricts = new Set();

  places.forEach(p => {
    if (p.category === 'Temple / Religious') templeCount++;
    if (p.category === 'Beach') beachCount++;
    if (p.districtName) placesDistricts.add(p.districtName);
  });

  // 2. Fetch saved trips to get their planned districts
  const trips = await TripPlan.find({ _id: { $in: savedTripIds } });
  
  trips.forEach(t => {
    if (Array.isArray(t.districts)) {
      t.districts.forEach(d => placesDistricts.add(d));
    }
  });

  const uniqueDistrictsCount = placesDistricts.size;

  // 3. Update cached stats counts
  collection.stats.placesCount = collection.savedPlaces.length;
  collection.stats.districtsCount = collection.savedDistricts.length;
  collection.stats.tripsCount = collection.savedTrips.length;

  // 4. Update cached summary lastSaved references
  collection.stats.lastSavedPlace = collection.savedPlaces.length > 0 
    ? collection.savedPlaces[collection.savedPlaces.length - 1].placeId 
    : null;

  collection.stats.lastSavedDistrict = collection.savedDistricts.length > 0 
    ? collection.savedDistricts[collection.savedDistricts.length - 1].districtId 
    : null;

  collection.stats.lastSavedTrip = collection.savedTrips.length > 0 
    ? collection.savedTrips[collection.savedTrips.length - 1].tripId 
    : null;

  // 5. Award Achievements based on 10-item thresholds
  collection.achievements.explorer = collection.stats.placesCount >= 10;
  collection.achievements.districtMaster = collection.stats.districtsCount >= 10;
  collection.achievements.templeExplorer = templeCount >= 10;
  collection.achievements.beachExplorer = beachCount >= 10;

  return uniqueDistrictsCount;
}

module.exports = {
  updateAchievements
};
