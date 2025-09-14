const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get templates
// @route   GET /api/templates
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Template management coming soon'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;