import express from 'express';
import { Newsletter, Post, Subscriber, User } from '../models';

const router = express.Router();

// @desc    Test database connectivity
// @route   GET /api/test/db
// @access  Public (for testing)
router.get('/db', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const newsletterCount = await Newsletter.countDocuments();
    const postCount = await Post.countDocuments();
    const subscriberCount = await Subscriber.countDocuments();

    res.json({
      success: true,
      message: 'Database connectivity test successful',
      data: {
        users: userCount,
        newsletters: newsletterCount,
        posts: postCount,
        subscribers: subscriberCount
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;