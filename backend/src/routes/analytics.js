const express = require('express');
const { Newsletter, Post, Subscriber, User } = require('../models');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's newsletters
    const newsletters = await Newsletter.find({ userId });
    const newsletterIds = newsletters.map(n => n._id);

    // Get total subscribers across all newsletters
    const totalSubscribers = await Subscriber.countDocuments({
      newsletterId: { $in: newsletterIds },
      status: 'active'
    });

    const paidSubscribers = await Subscriber.countDocuments({
      newsletterId: { $in: newsletterIds },
      status: 'active',
      subscriptionType: 'paid'
    });

    // Get total posts
    const totalPosts = await Post.countDocuments({
      newsletterId: { $in: newsletterIds }
    });

    const publishedPosts = await Post.countDocuments({
      newsletterId: { $in: newsletterIds },
      status: 'published'
    });

    // Get recent analytics data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Subscriber growth over last 30 days
    const subscriberGrowth = await Subscriber.aggregate([
      {
        $match: {
          newsletterId: { $in: newsletterIds },
          subscribedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$subscribedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Email performance metrics
    const emailMetrics = await Post.aggregate([
      {
        $match: {
          newsletterId: { $in: newsletterIds },
          status: 'sent',
          publishedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalOpens: { $sum: '$analytics.opens' },
          totalUniqueOpens: { $sum: '$analytics.uniqueOpens' },
          totalClicks: { $sum: '$analytics.clicks' },
          totalUniqueClicks: { $sum: '$analytics.uniqueClicks' },
          totalRevenue: { $sum: '$analytics.revenue' },
          totalUnsubscribes: { $sum: '$analytics.unsubscribes' },
          emailsSent: { $sum: 1 }
        }
      }
    ]);

    // Top performing posts
    const topPosts = await Post.find({
      newsletterId: { $in: newsletterIds },
      status: 'sent'
    })
    .sort({ 'analytics.uniqueOpens': -1 })
    .limit(5)
    .select('title analytics.uniqueOpens analytics.uniqueClicks publishedAt');

    // Newsletter-specific metrics
    const newsletterMetrics = await Promise.all(
      newsletters.map(async (newsletter) => {
        const subscribers = await Subscriber.countDocuments({
          newsletterId: newsletter._id,
          status: 'active'
        });

        const recentPosts = await Post.countDocuments({
          newsletterId: newsletter._id,
          publishedAt: { $gte: thirtyDaysAgo }
        });

        const avgOpenRate = await Post.aggregate([
          {
            $match: {
              newsletterId: newsletter._id,
              status: 'sent',
              publishedAt: { $gte: thirtyDaysAgo }
            }
          },
          {
            $group: {
              _id: null,
              avgOpenRate: {
                $avg: {
                  $cond: [
                    { $gt: ['$analytics.opens', 0] },
                    { $divide: ['$analytics.uniqueOpens', '$analytics.opens'] },
                    0
                  ]
                }
              }
            }
          }
        ]);

        return {
          _id: newsletter._id,
          name: newsletter.name,
          subscribers,
          recentPosts,
          avgOpenRate: avgOpenRate[0]?.avgOpenRate || 0,
          monthlyRevenue: newsletter.monthlyRevenue || 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        overview: {
          totalNewsletters: newsletters.length,
          totalSubscribers,
          paidSubscribers,
          totalPosts,
          publishedPosts,
          freeSubscribers: totalSubscribers - paidSubscribers
        },
        metrics: emailMetrics[0] || {
          totalOpens: 0,
          totalUniqueOpens: 0,
          totalClicks: 0,
          totalUniqueClicks: 0,
          totalRevenue: 0,
          totalUnsubscribes: 0,
          emailsSent: 0
        },
        subscriberGrowth,
        topPosts,
        newsletterMetrics,
        periodStart: thirtyDaysAgo.toISOString(),
        periodEnd: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get detailed campaign analytics
// @route   GET /api/analytics/campaigns
// @access  Private
router.get('/campaigns', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, newsletterId } = req.query;
    const userId = req.user._id;

    // Build filter
    let filter = { status: 'sent' };

    if (newsletterId) {
      // Verify user owns this newsletter
      const newsletter = await Newsletter.findOne({ _id: newsletterId, userId });
      if (!newsletter) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      filter.newsletterId = newsletterId;
    } else {
      // Get all user's newsletters
      const newsletters = await Newsletter.find({ userId });
      filter.newsletterId = { $in: newsletters.map(n => n._id) };
    }

    const campaigns = await Post.find(filter)
      .populate('newsletterId', 'name')
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('title publishedAt analytics newsletterId');

    const total = await Post.countDocuments(filter);

    // Calculate performance metrics for each campaign
    const campaignsWithMetrics = campaigns.map(campaign => {
      const opens = campaign.analytics.opens || 0;
      const uniqueOpens = campaign.analytics.uniqueOpens || 0;
      const clicks = campaign.analytics.clicks || 0;
      const uniqueClicks = campaign.analytics.uniqueClicks || 0;

      return {
        _id: campaign._id,
        title: campaign.title,
        newsletter: campaign.newsletterId.name,
        publishedAt: campaign.publishedAt,
        analytics: {
          ...campaign.analytics.toObject(),
          openRate: opens > 0 ? ((uniqueOpens / opens) * 100).toFixed(2) : 0,
          clickRate: uniqueOpens > 0 ? ((uniqueClicks / uniqueOpens) * 100).toFixed(2) : 0,
          clickToOpenRate: uniqueOpens > 0 ? ((uniqueClicks / uniqueOpens) * 100).toFixed(2) : 0
        }
      };
    });

    res.json({
      success: true,
      data: campaignsWithMetrics,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
        total
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get subscriber analytics
// @route   GET /api/analytics/subscribers
// @access  Private
router.get('/subscribers', protect, async (req, res) => {
  try {
    const { newsletterId, period = '30' } = req.query;
    const userId = req.user._id;

    // Build newsletter filter
    let newsletterFilter = { userId };
    if (newsletterId) {
      newsletterFilter._id = newsletterId;
    }

    const newsletters = await Newsletter.find(newsletterFilter);
    const newsletterIds = newsletters.map(n => n._id);

    // Date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Subscriber growth over time
    const subscriberGrowth = await Subscriber.aggregate([
      {
        $match: {
          newsletterId: { $in: newsletterIds },
          subscribedAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$subscribedAt" } },
          subscribed: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Unsubscriber data
    const unsubscribers = await Subscriber.aggregate([
      {
        $match: {
          newsletterId: { $in: newsletterIds },
          unsubscribedAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$unsubscribedAt" } },
          unsubscribed: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Subscriber segmentation
    const segmentation = await Subscriber.aggregate([
      {
        $match: {
          newsletterId: { $in: newsletterIds },
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$subscriptionType',
          count: { $sum: 1 },
          avgOpenRate: { $avg: '$engagement.openRate' },
          avgClickRate: { $avg: '$engagement.clickRate' }
        }
      }
    ]);

    // Top locations
    const topLocations = await Subscriber.aggregate([
      {
        $match: {
          newsletterId: { $in: newsletterIds },
          status: 'active',
          'location.country': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$location.country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Engagement levels
    const engagementLevels = await Subscriber.aggregate([
      {
        $match: {
          newsletterId: { $in: newsletterIds },
          status: 'active'
        }
      },
      {
        $bucket: {
          groupBy: '$engagement.subscriptionScore',
          boundaries: [0, 25, 50, 75, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            avgOpenRate: { $avg: '$engagement.openRate' }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        subscriberGrowth,
        unsubscribers,
        segmentation,
        topLocations,
        engagementLevels,
        period: parseInt(period)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue
// @access  Private
router.get('/revenue', protect, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const userId = req.user._id;

    const newsletters = await Newsletter.find({ userId });
    const newsletterIds = newsletters.map(n => n._id);

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Revenue over time from posts
    const postRevenue = await Post.aggregate([
      {
        $match: {
          newsletterId: { $in: newsletterIds },
          publishedAt: { $gte: daysAgo },
          'analytics.revenue': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" } },
          revenue: { $sum: '$analytics.revenue' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Subscription revenue (monthly recurring)
    const subscriptionRevenue = await Subscriber.aggregate([
      {
        $match: {
          newsletterId: { $in: newsletterIds },
          subscriptionType: 'paid',
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$paidTier',
          subscribers: { $sum: 1 }
        }
      }
    ]);

    // Total revenue summary
    const totalPostRevenue = postRevenue.reduce((sum, item) => sum + item.revenue, 0);
    const totalSubscriptionRevenue = newsletters.reduce((sum, newsletter) => sum + (newsletter.monthlyRevenue || 0), 0);

    res.json({
      success: true,
      data: {
        postRevenue,
        subscriptionRevenue,
        totalPostRevenue,
        totalSubscriptionRevenue,
        totalRevenue: totalPostRevenue + totalSubscriptionRevenue,
        period: parseInt(period)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;