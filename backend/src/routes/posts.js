const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get posts
// @route   GET /api/posts
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Post management coming soon'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { id: Date.now() },
      message: 'Post created (placeholder)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;