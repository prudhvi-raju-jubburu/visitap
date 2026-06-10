const express = require('express');
const router = express.Router();
const { login, getMe, setup, getAnalysis } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/setup', setup);
router.get('/me', protect, getMe);
router.get('/analysis', protect, getAnalysis);

module.exports = router;
