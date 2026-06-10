const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavoriteStatus,
} = require('../controllers/userAuthController');
const { protectUser } = require('../middleware/protectUser');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protectUser, getProfile);
router.put('/profile', protectUser, updateProfile);
router.put('/change-password', protectUser, changePassword);
router.post('/logout', logout);

// Favorites Routes
router.post('/favorites/:placeId', protectUser, addFavorite);
router.delete('/favorites/:placeId', protectUser, removeFavorite);
router.get('/favorites', protectUser, getFavorites);
router.get('/favorites/check/:placeId', protectUser, checkFavoriteStatus);

module.exports = router;
