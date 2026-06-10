const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protectUser } = require('../middleware/protectUser');
const {
  createTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  shareTrip,
  getSharedTrip,
  exportTripPDF
} = require('../controllers/tripController');

// Optional authentication parser for public/shared endpoints
const optionalProtect = async (req, res, next) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Fail silently and continue as guest
  }
  next();
};

// Public sharing routes
router.get('/shared/:shareId', getSharedTrip);
router.post('/:id/export', optionalProtect, exportTripPDF);

// Private trip planning routes
router.use(protectUser);

router.route('/')
  .get(getTrips)
  .post(createTrip);

router.route('/:id')
  .get(getTrip)
  .put(updateTrip)
  .delete(deleteTrip);

router.post('/:id/share', shareTrip);

module.exports = router;
