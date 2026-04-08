const express = require('express');
const router = express.Router();
const {
  getAllPlaces, getPlace, getNearbyPlaces,
  createPlace, updatePlace, deletePlace, getCategories
} = require('../controllers/placeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/categories', getCategories);
router.get('/nearby', getNearbyPlaces);
router.get('/', getAllPlaces);
router.get('/:identifier', getPlace);

router.post('/', protect, createPlace);
router.put('/:id', protect, updatePlace);
router.delete('/:id', protect, deletePlace);

module.exports = router;
