const express = require('express');
const { Subscriber, Newsletter, Segment } = require('../models');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get subscribers for a newsletter
// @route   GET /api/subscribers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      newsletterId,
      page = 1,
      limit = 20,
      status = 'active',
      subscriptionType,
      search,
      segment,
      sortBy = 'subscribedAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user._id;

    // Verify newsletter ownership
    const newsletter = await Newsletter.findOne({ _id: newsletterId, userId });
    if (!newsletter) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Build filter
    let filter = { newsletterId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (subscriptionType && subscriptionType !== 'all') {
      filter.subscriptionType = subscriptionType;
    }

    if (segment) {
      filter.segments = { $in: [segment] };
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const subscribers = await Subscriber.find(filter)
      .populate('segments', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Subscriber.countDocuments(filter);

    res.json({
      success: true,
      data: subscribers,
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

// @desc    Get single subscriber
// @route   GET /api/subscribers/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id)
      .populate('newsletterId', 'name userId')
      .populate('segments', 'name description')
      .populate('referredBy', 'email firstName lastName');

    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }

    // Verify newsletter ownership
    if (subscriber.newsletterId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: subscriber
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Add subscriber
// @route   POST /api/subscribers
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      newsletterId,
      email,
      firstName,
      lastName,
      source = 'manual',
      customFields = {},
      segments = []
    } = req.body;

    const userId = req.user._id;

    // Verify newsletter ownership
    const newsletter = await Newsletter.findOne({ _id: newsletterId, userId });
    if (!newsletter) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Check if subscriber already exists
    const existingSubscriber = await Subscriber.findOne({ newsletterId, email });
    if (existingSubscriber) {
      return res.status(400).json({
        success: false,
        message: 'Subscriber already exists'
      });
    }

    // Create subscriber
    const subscriber = await Subscriber.create({
      newsletterId,
      email,
      firstName,
      lastName,
      source,
      customFields: new Map(Object.entries(customFields)),
      segments,
      status: 'active',
      subscribedAt: new Date()
    });

    // Update newsletter subscriber count
    await Newsletter.findByIdAndUpdate(newsletterId, {
      $inc: { subscriberCount: 1 }
    });

    // Update segment subscriber counts
    if (segments.length > 0) {
      await Segment.updateMany(
        { _id: { $in: segments } },
        { $inc: { subscriberCount: 1 } }
      );
    }

    await subscriber.populate('segments', 'name');

    res.status(201).json({
      success: true,
      data: subscriber
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update subscriber
// @route   PUT /api/subscribers/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id)
      .populate('newsletterId', 'userId');

    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }

    // Verify newsletter ownership
    if (subscriber.newsletterId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      firstName,
      lastName,
      status,
      subscriptionType,
      paidTier,
      segments,
      customFields,
      preferences
    } = req.body;

    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (status !== undefined) updateData.status = status;
    if (subscriptionType !== undefined) updateData.subscriptionType = subscriptionType;
    if (paidTier !== undefined) updateData.paidTier = paidTier;
    if (segments !== undefined) updateData.segments = segments;
    if (preferences !== undefined) updateData.preferences = preferences;

    if (customFields !== undefined) {
      updateData.customFields = new Map(Object.entries(customFields));
    }

    // Handle status changes
    if (status === 'unsubscribed' && subscriber.status !== 'unsubscribed') {
      updateData.unsubscribedAt = new Date();
      // Update newsletter subscriber count
      await Newsletter.findByIdAndUpdate(subscriber.newsletterId, {
        $inc: { subscriberCount: -1 }
      });
    } else if (status === 'active' && subscriber.status === 'unsubscribed') {
      updateData.unsubscribedAt = undefined;
      // Update newsletter subscriber count
      await Newsletter.findByIdAndUpdate(subscriber.newsletterId, {
        $inc: { subscriberCount: 1 }
      });
    }

    const updatedSubscriber = await Subscriber.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('segments', 'name');

    res.json({
      success: true,
      data: updatedSubscriber
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete subscriber
// @route   DELETE /api/subscribers/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id)
      .populate('newsletterId', 'userId');

    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }

    // Verify newsletter ownership
    if (subscriber.newsletterId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await subscriber.deleteOne();

    // Update newsletter subscriber count if subscriber was active
    if (subscriber.status === 'active') {
      await Newsletter.findByIdAndUpdate(subscriber.newsletterId, {
        $inc: { subscriberCount: -1 }
      });
    }

    // Update segment subscriber counts
    if (subscriber.segments.length > 0) {
      await Segment.updateMany(
        { _id: { $in: subscriber.segments } },
        { $inc: { subscriberCount: -1 } }
      );
    }

    res.json({
      success: true,
      message: 'Subscriber deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Bulk import subscribers
// @route   POST /api/subscribers/bulk-import
// @access  Private
router.post('/bulk-import', protect, async (req, res) => {
  try {
    const { newsletterId, subscribers, overwriteExisting = false } = req.body;
    const userId = req.user._id;

    // Verify newsletter ownership
    const newsletter = await Newsletter.findOne({ _id: newsletterId, userId });
    if (!newsletter) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const subscriberData of subscribers) {
      try {
        const { email, firstName, lastName, customFields = {} } = subscriberData;

        if (!email) {
          results.errors.push({ email, error: 'Email is required' });
          continue;
        }

        // Check if subscriber exists
        const existingSubscriber = await Subscriber.findOne({ newsletterId, email });

        if (existingSubscriber) {
          if (overwriteExisting) {
            await Subscriber.findByIdAndUpdate(existingSubscriber._id, {
              firstName,
              lastName,
              customFields: new Map(Object.entries(customFields)),
              status: 'active'
            });
            results.imported++;
          } else {
            results.skipped++;
          }
        } else {
          await Subscriber.create({
            newsletterId,
            email,
            firstName,
            lastName,
            customFields: new Map(Object.entries(customFields)),
            source: 'import',
            status: 'active',
            subscribedAt: new Date()
          });
          results.imported++;

          // Update newsletter subscriber count
          await Newsletter.findByIdAndUpdate(newsletterId, {
            $inc: { subscriberCount: 1 }
          });
        }

      } catch (error) {
        results.errors.push({
          email: subscriberData.email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Export subscribers
// @route   GET /api/subscribers/export
// @access  Private
router.get('/export', protect, async (req, res) => {
  try {
    const { newsletterId, format = 'json', status = 'active' } = req.query;
    const userId = req.user._id;

    // Verify newsletter ownership
    const newsletter = await Newsletter.findOne({ _id: newsletterId, userId });
    if (!newsletter) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filter = { newsletterId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const subscribers = await Subscriber.find(filter)
      .populate('segments', 'name')
      .select('-__v -updatedAt')
      .lean();

    // Format data for export
    const exportData = subscribers.map(subscriber => ({
      email: subscriber.email,
      firstName: subscriber.firstName || '',
      lastName: subscriber.lastName || '',
      status: subscriber.status,
      subscriptionType: subscriber.subscriptionType,
      subscribedAt: subscriber.subscribedAt,
      segments: subscriber.segments.map(s => s.name).join(', '),
      openRate: subscriber.engagement.openRate,
      clickRate: subscriber.engagement.clickRate,
      location: subscriber.location?.country || '',
      source: subscriber.source,
      ...Object.fromEntries(subscriber.customFields || new Map())
    }));

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(','),
        ...exportData.map(row =>
          headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="subscribers_${newsletterId}.csv"`);
      res.send(csvRows.join('\n'));
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update subscriber engagement
// @route   POST /api/subscribers/:id/engagement
// @access  Private (used by email tracking)
router.post('/:id/engagement', protect, async (req, res) => {
  try {
    const { opens = 0, clicks = 0, postId } = req.body;

    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }

    // Update engagement metrics
    subscriber.updateEngagement(opens, clicks);
    await subscriber.save();

    res.json({
      success: true,
      data: subscriber.engagement
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;