import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// Define schemas directly in the API file for Vercel functions
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  firstName: String,
  lastName: String,
  role: { type: String, enum: ['admin', 'moderator', 'subscriber', 'premium'], default: 'subscriber' },
  avatarUrl: String,
  bio: String,
  reputationScore: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  bannedUntil: Date
}, { timestamps: true });

const CommunityPostSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 255 },
  content: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true, default: 'General' },
  tags: [String],
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  viewsCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  dislikesCount: { type: Number, default: 0 },
  repliesCount: { type: Number, default: 0 },
  lastActivityAt: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const CommunityReplySchema = new mongoose.Schema({
  content: { type: String, required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentReplyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityReply' },
  depth: { type: Number, default: 0, max: 3 },
  likesCount: { type: Number, default: 0 },
  dislikesCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  editedAt: Date
}, { timestamps: true });

const ModerationReportSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['post', 'reply', 'user'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  description: String,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['pending', 'reviewing', 'resolved', 'dismissed'], default: 'pending' },
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatorNotes: String,
  actionTaken: String,
  resolvedAt: Date
}, { timestamps: true });

const ModerationActionSchema = new mongoose.Schema({
  actionType: { type: String, required: true }, // 'warn', 'timeout', 'ban', 'delete', 'pin', 'lock', etc.
  targetType: { type: String, enum: ['post', 'reply', 'user'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  moderatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: String,
  metadata: mongoose.Schema.Types.Mixed,
  duration: Number, // for timeouts/bans
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Create models or use existing ones
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const CommunityPost = mongoose.models.CommunityPost || mongoose.model('CommunityPost', CommunityPostSchema);
const CommunityReply = mongoose.models.CommunityReply || mongoose.model('CommunityReply', CommunityReplySchema);
const ModerationReport = mongoose.models.ModerationReport || mongoose.model('ModerationReport', ModerationReportSchema);
const ModerationAction = mongoose.models.ModerationAction || mongoose.model('ModerationAction', ModerationActionSchema);

// Database connection
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check if MongoDB URI is configured
  if (!process.env.MONGODB_URI) {
    return res.status(503).json({
      success: false,
      message: 'Database not configured',
      error: 'MONGODB_URI environment variable is not set'
    });
  }

  try {
    await connectToDatabase();

    const { method } = req;
    const { action } = req.query;

    if (method === 'GET' && action === 'reports') {
      return await getReports(req, res);
    }

    if (method === 'POST' && action === 'report') {
      return await createReport(req, res);
    }

    if (method === 'POST' && action === 'moderate') {
      return await createModerationAction(req, res);
    }

    if (method === 'PUT') {
      return await updateReport(req, res);
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });

  } catch (error) {
    console.error('Moderation API error:', error);

    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('MONGODB_URI')) {
        errorMessage = 'Database configuration error';
        statusCode = 503;
      } else if (error.message.includes('connect')) {
        errorMessage = 'Database connection failed';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : String(error) : undefined
    });
  }
}

async function getReports(req: VercelRequest, res: VercelResponse) {
  const {
    status = 'pending',
    priority,
    page = 1,
    limit = 20
  } = req.query;

  const filters: any = {};
  if (status && status !== 'all') filters.status = status;
  if (priority) filters.priority = priority;

  const reports = await ModerationReport
    .find(filters)
    .populate('reporterId', 'firstName lastName email avatarUrl')
    .populate('moderatorId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .lean();

  console.log(`Found ${reports.length} reports with filters:`, filters);

  // Get target details for each report
  const enrichedReports = await Promise.all(
    reports.map(async (report) => {
      let target = null;

      if (report.targetType === 'post') {
        try {
          const post = await CommunityPost.findById(report.targetId).populate('authorId', 'firstName lastName email').lean();
          if (post) {
            target = {
              type: 'post',
              id: post._id.toString(),
              title: post.title,
              author: `${post.authorId.firstName || ''} ${post.authorId.lastName || ''}`.trim() || post.authorId.email
            };
          } else {
            // Fallback: Create a placeholder target if the actual post doesn't exist
            target = {
              type: 'post',
              id: report.targetId.toString(),
              title: '[Post Not Found]',
              author: 'Unknown'
            };
          }
        } catch (error) {
          console.warn('Error fetching post for report:', error);
          target = {
            type: 'post',
            id: report.targetId.toString(),
            title: '[Post Error]',
            author: 'Unknown'
          };
        }
      } else if (report.targetType === 'reply') {
        try {
          const reply = await CommunityReply.findById(report.targetId).populate('authorId', 'firstName lastName email').populate('postId', 'title').lean();
          if (reply) {
            target = {
              type: 'reply',
              id: reply._id.toString(),
              title: `Reply to: ${reply.postId.title}`,
              author: `${reply.authorId.firstName || ''} ${reply.authorId.lastName || ''}`.trim() || reply.authorId.email
            };
          } else {
            target = {
              type: 'reply',
              id: report.targetId.toString(),
              title: '[Reply Not Found]',
              author: 'Unknown'
            };
          }
        } catch (error) {
          console.warn('Error fetching reply for report:', error);
          target = {
            type: 'reply',
            id: report.targetId.toString(),
            title: '[Reply Error]',
            author: 'Unknown'
          };
        }
      } else if (report.targetType === 'user') {
        try {
          const user = await User.findById(report.targetId).lean();
          if (user) {
            target = {
              type: 'user',
              id: user._id.toString(),
              title: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              author: user.email
            };
          } else {
            target = {
              type: 'user',
              id: report.targetId.toString(),
              title: '[User Not Found]',
              author: 'Unknown'
            };
          }
        } catch (error) {
          console.warn('Error fetching user for report:', error);
          target = {
            type: 'user',
            id: report.targetId.toString(),
            title: '[User Error]',
            author: 'Unknown'
          };
        }
      }

      return {
        id: report._id.toString(),
        type: 'report',
        title: `${report.reason}`,
        description: report.description || '',
        reporter: report.reporterId ? {
          name: `${report.reporterId.firstName || ''} ${report.reporterId.lastName || ''}`.trim() || report.reporterId.email,
          avatar: report.reporterId.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(report.reporterId.firstName || report.reporterId.email)}&background=3B82F6&color=fff`
        } : null,
        target,
        reason: report.description || report.reason,
        priority: report.priority,
        status: report.status,
        createdAt: report.createdAt,
        moderatorNotes: report.moderatorNotes,
        actionTaken: report.actionTaken
      };
    })
  );

  const totalReports = await ModerationReport.countDocuments(filters);

  return res.status(200).json({
    success: true,
    data: {
      reports: enrichedReports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalReports,
        totalPages: Math.ceil(totalReports / Number(limit))
      }
    }
  });
}

async function createReport(req: VercelRequest, res: VercelResponse) {
  const {
    targetType,
    targetId,
    reason,
    description,
    priority = 'medium'
  } = req.body;

  if (!targetType || !targetId || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Target type, target ID, and reason are required'
    });
  }

  // Get or create a demo user for reporting
  let user = await User.findOne().sort({ createdAt: -1 });
  if (!user) {
    user = await User.create({
      email: 'demo@newsbuildr.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'subscriber'
    });
  }

  const report = await ModerationReport.create({
    targetType,
    targetId,
    reporterId: user._id,
    reason,
    description,
    priority
  });

  return res.status(201).json({
    success: true,
    data: report,
    message: 'Report created successfully'
  });
}

async function updateReport(req: VercelRequest, res: VercelResponse) {
  const {
    reportId,
    status,
    moderatorNotes,
    actionTaken
  } = req.body;

  if (!reportId || !status) {
    return res.status(400).json({
      success: false,
      message: 'Report ID and status are required'
    });
  }

  // Get or create a demo moderator
  let moderator = await User.findOne({ role: { $in: ['admin', 'moderator'] } });
  if (!moderator) {
    moderator = await User.create({
      email: 'moderator@newsbuildr.com',
      firstName: 'Demo',
      lastName: 'Moderator',
      role: 'moderator'
    });
  }

  const updateData: any = {
    status,
    moderatorId: moderator._id,
    moderatorNotes,
    actionTaken
  };

  if (status === 'resolved') {
    updateData.resolvedAt = new Date();
  }

  const updatedReport = await ModerationReport.findByIdAndUpdate(
    reportId,
    updateData,
    { new: true }
  );

  if (!updatedReport) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: updatedReport,
    message: 'Report updated successfully'
  });
}

async function createModerationAction(req: VercelRequest, res: VercelResponse) {
  const {
    actionType,
    targetType,
    targetId,
    reason,
    metadata
  } = req.body;

  if (!actionType || !targetType || !targetId) {
    return res.status(400).json({
      success: false,
      message: 'Action type, target type, and target ID are required'
    });
  }

  // Get or create a demo moderator
  let moderator = await User.findOne({ role: { $in: ['admin', 'moderator'] } });
  if (!moderator) {
    moderator = await User.create({
      email: 'moderator@newsbuildr.com',
      firstName: 'Demo',
      lastName: 'Moderator',
      role: 'moderator'
    });
  }

  // Apply the moderation action based on type
  switch (actionType.toLowerCase()) {
    case 'pin':
      if (targetType === 'post') {
        await CommunityPost.findByIdAndUpdate(targetId, { isPinned: true });
      }
      break;
    case 'lock':
      if (targetType === 'post') {
        await CommunityPost.findByIdAndUpdate(targetId, { isLocked: true });
      }
      break;
    case 'remove':
    case 'delete':
      if (targetType === 'post') {
        await CommunityPost.findByIdAndUpdate(targetId, { isDeleted: true });
      } else if (targetType === 'reply') {
        await CommunityReply.findByIdAndUpdate(targetId, { isDeleted: true });
      }
      break;
    case 'hide':
      // Implementation for hiding content
      break;
    case 'warn':
    case 'timeout':
    case 'ban':
      // Implementation for user actions
      break;
  }

  const moderationAction = await ModerationAction.create({
    actionType,
    targetType,
    targetId,
    moderatorId: moderator._id,
    reason,
    metadata
  });

  return res.status(201).json({
    success: true,
    data: moderationAction,
    message: `${actionType} action applied successfully`
  });
}