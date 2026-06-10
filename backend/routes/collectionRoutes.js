const express = require('express');
const router = express.Router();
const {
  getCollectionDashboard,
  savePlace,
  removePlace,
  saveDistrict,
  removeDistrict,
  saveTrip,
  removeTrip,
  addRecentlyViewed
} = require('../controllers/collectionController');
const { protectUser } = require('../middleware/protectUser');

// All collection routes require authentication
router.use(protectUser);

router.get('/dashboard', getCollectionDashboard);

// Places saves/removals
router.post('/places/:placeId', savePlace);
router.delete('/places/:placeId', removePlace);

// Districts saves/removals
router.post('/districts/:districtId', saveDistrict);
router.delete('/districts/:districtId', removeDistrict);

// Trips saves/removals
router.post('/trips/:tripId', saveTrip);
router.delete('/trips/:tripId', removeTrip);

// Recently viewed visit tracking
router.post('/recent/:placeId', addRecentlyViewed);

module.exports = router;
