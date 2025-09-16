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

// Create models or use existing ones
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const CommunityPost = mongoose.models.CommunityPost || mongoose.model('CommunityPost', CommunityPostSchema);
const CommunityReply = mongoose.models.CommunityReply || mongoose.model('CommunityReply', CommunityReplySchema);

// Database connection
let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      bufferCommands: false,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();

    const { method } = req;

    if (method === 'GET') {
      return await getReplies(req, res);
    }

    if (method === 'POST') {
      return await createReply(req, res);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });

  } catch (error) {
    console.error('Community replies API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function getReplies(req: VercelRequest, res: VercelResponse) {
  const { postId } = req.query;

  if (!postId) {
    return res.status(400).json({
      success: false,
      message: 'Post ID is required'
    });
  }

  const replies = await CommunityReply
    .find({ postId, isDeleted: false })
    .populate('authorId', 'firstName lastName email role avatarUrl')
    .sort({ createdAt: 1 })
    .lean();

  // Build threaded structure
  const threadedReplies = buildReplyTree(replies);

  return res.status(200).json({
    success: true,
    data: threadedReplies
  });
}

async function createReply(req: VercelRequest, res: VercelResponse) {
  const { postId, parentReplyId, content } = req.body;

  if (!postId || !content) {
    return res.status(400).json({
      success: false,
      message: 'Post ID and content are required'
    });
  }

  // Verify post exists
  const post = await CommunityPost.findById(postId);
  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Check if post is locked
  if (post.isLocked) {
    return res.status(403).json({
      success: false,
      message: 'Post is locked for comments'
    });
  }

  // For now, use demo user or find existing one
  let user = await User.findOne().sort({ createdAt: -1 });

  if (!user) {
    // Create a demo user
    user = await User.create({
      email: 'demo@newsbuildr.com',
      firstName: 'Demo',
      lastName: 'User',
      role: 'subscriber'
    });
  }

  // Calculate depth if parent reply exists
  let depth = 0;
  if (parentReplyId) {
    const parentReply = await CommunityReply.findById(parentReplyId);
    if (parentReply) {
      depth = Math.min(parentReply.depth + 1, 3); // Max depth of 3
    }
  }

  // Create the reply
  const newReply = await CommunityReply.create({
    content,
    postId,
    authorId: user._id,
    parentReplyId: parentReplyId || undefined,
    depth
  });

  // Update post reply count and last activity
  await CommunityPost.findByIdAndUpdate(postId, {
    $inc: { repliesCount: 1 },
    lastActivityAt: new Date()
  });

  // Populate and return the new reply
  const populatedReply = await CommunityReply
    .findById(newReply._id)
    .populate('authorId', 'firstName lastName email role avatarUrl')
    .lean();

  const formattedReply = {
    id: populatedReply._id.toString(),
    content: populatedReply.content,
    author: {
      id: populatedReply.authorId._id.toString(),
      name: `${populatedReply.authorId.firstName || ''} ${populatedReply.authorId.lastName || ''}`.trim() || populatedReply.authorId.email,
      avatar: populatedReply.authorId.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(populatedReply.authorId.firstName || populatedReply.authorId.email)}&background=3B82F6&color=fff`,
      role: populatedReply.authorId.role
    },
    createdAt: populatedReply.createdAt,
    editedAt: populatedReply.editedAt,
    likes: populatedReply.likesCount,
    dislikes: populatedReply.dislikesCount,
    isLiked: false,
    isDisliked: false,
    depth: populatedReply.depth,
    parentReplyId: populatedReply.parentReplyId?.toString(),
    replies: []
  };

  return res.status(201).json({
    success: true,
    data: formattedReply,
    message: 'Reply created successfully'
  });
}

function buildReplyTree(replies: any[]): any[] {
  const replyMap = new Map();
  const rootReplies: any[] = [];

  // First pass: create reply objects with formatted structure
  replies.forEach(reply => {
    const formattedReply = {
      id: reply._id.toString(),
      content: reply.content,
      author: {
        id: reply.authorId._id.toString(),
        name: `${reply.authorId.firstName || ''} ${reply.authorId.lastName || ''}`.trim() || reply.authorId.email,
        avatar: reply.authorId.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.authorId.firstName || reply.authorId.email)}&background=3B82F6&color=fff`,
        role: reply.authorId.role
      },
      createdAt: reply.createdAt,
      editedAt: reply.editedAt,
      likes: reply.likesCount,
      dislikes: reply.dislikesCount,
      isLiked: false,
      isDisliked: false,
      depth: reply.depth,
      parentReplyId: reply.parentReplyId?.toString(),
      replies: []
    };

    replyMap.set(reply._id.toString(), formattedReply);
  });

  // Second pass: build tree structure
  replyMap.forEach(reply => {
    if (reply.parentReplyId && replyMap.has(reply.parentReplyId)) {
      const parent = replyMap.get(reply.parentReplyId);
      parent.replies.push(reply);
    } else {
      rootReplies.push(reply);
    }
  });

  return rootReplies;
}