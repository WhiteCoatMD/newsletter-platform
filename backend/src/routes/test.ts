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

// @desc    Temporary dashboard analytics endpoint
// @route   GET /api/test/dashboard
// @access  Public (for testing)
router.get('/dashboard', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const newsletterCount = await Newsletter.countDocuments();
    const postCount = await Post.countDocuments();
    const subscriberCount = await Subscriber.countDocuments();

    res.json({
      success: true,
      data: {
        overview: {
          totalNewsletters: newsletterCount,
          totalSubscribers: subscriberCount,
          paidSubscribers: 0,
          totalPosts: postCount,
          publishedPosts: 0,
          freeSubscribers: subscriberCount
        },
        metrics: {
          totalOpens: 0,
          totalUniqueOpens: 0,
          totalClicks: 0,
          totalUniqueClicks: 0,
          totalRevenue: 0,
          totalUnsubscribes: 0,
          emailsSent: 0
        },
        subscriberGrowth: [],
        topPosts: [],
        newsletterMetrics: [],
        periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard analytics test error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;