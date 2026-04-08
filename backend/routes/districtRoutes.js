const express = require('express');
const router = express.Router();
const {
  getAllDistricts, getDistrict, createDistrict,
  updateDistrict, deleteDistrict, search
} = require('../controllers/districtController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', search);
router.get('/', getAllDistricts);
router.get('/:identifier', getDistrict);

router.post('/', protect, createDistrict);
router.put('/:id', protect, updateDistrict);
router.delete('/:id', protect, deleteDistrict);

module.exports = router;
