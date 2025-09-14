const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Upload file
// @route   POST /api/upload
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { url: '/uploads/placeholder.jpg' },
      message: 'File upload coming soon'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;