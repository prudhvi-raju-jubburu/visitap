const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');
const { protect } = require('../middleware/authMiddleware');

// @desc   Upload single image to Cloudinary
// @route  POST /api/upload
// @access Private
router.post('/', protect, upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({
      success: true,
      url: req.file.path, // Cloudinary provides the URL in 'path' when using multer-storage-cloudinary
      public_id: req.file.filename,
    });
  } else {
    res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
});

// @desc   Upload multiple images to Cloudinary
// @route  POST /api/upload/multiple
// @access Private
router.post('/multiple', protect, upload.array('images', 10), (req, res) => {
  if (req.files && req.files.length > 0) {
    const urls = req.files.map(file => ({
      url: file.path,
      public_id: file.filename,
    }));
    res.json({
      success: true,
      data: urls,
    });
  } else {
    res.status(400).json({ success: false, message: 'No files uploaded.' });
  }
});

module.exports = router;
