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

// Create models or use existing ones
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const CommunityPost = mongoose.models.CommunityPost || mongoose.model('CommunityPost', CommunityPostSchema);

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
      return await getPosts(req, res);
    }

    if (method === 'POST') {
      return await createPost(req, res);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });

  } catch (error) {
    console.error('Community posts API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function getPosts(req: VercelRequest, res: VercelResponse) {
  const {
    page = 1,
    limit = 20,
    category = 'all',
    sort = 'recent',
    search = ''
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  // Build query
  const query: any = { isDeleted: false };

  if (category !== 'all') {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort
  let sortQuery: any = {};
  switch (sort) {
    case 'popular':
      sortQuery = { likesCount: -1, repliesCount: -1, createdAt: -1 };
      break;
    case 'trending':
      sortQuery = { viewsCount: -1, lastActivityAt: -1 };
      break;
    case 'recent':
    default:
      sortQuery = { isPinned: -1, createdAt: -1 };
      break;
  }

  const posts = await CommunityPost
    .find(query)
    .populate('authorId', 'firstName lastName email role avatarUrl')
    .sort(sortQuery)
    .skip(offset)
    .limit(Number(limit))
    .lean();

  const total = await CommunityPost.countDocuments(query);

  // Format response to match frontend expectations
  const formattedPosts = posts.map(post => ({
    id: post._id.toString(),
    title: post.title,
    content: post.content,
    author: {
      id: post.authorId._id.toString(),
      name: `${post.authorId.firstName || ''} ${post.authorId.lastName || ''}`.trim() || post.authorId.email,
      avatar: post.authorId.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorId.firstName || post.authorId.email)}&background=3B82F6&color=fff`,
      role: post.authorId.role,
      joinedDate: post.authorId.createdAt
    },
    category: post.category,
    categoryInfo: {
      name: post.category,
      color: getCategoryColor(post.category),
      icon: getCategoryIcon(post.category)
    },
    tags: post.tags || [],
    createdAt: post.createdAt,
    lastActivity: post.lastActivityAt,
    stats: {
      views: post.viewsCount,
      replies: post.repliesCount,
      likes: post.likesCount,
      dislikes: post.dislikesCount
    },
    isPinned: post.isPinned,
    isLocked: post.isLocked,
    isFeatured: post.isFeatured
  }));

  return res.status(200).json({
    success: true,
    data: {
      posts: formattedPosts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}

async function createPost(req: VercelRequest, res: VercelResponse) {
  const { title, content, category = 'General', tags = [] } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      message: 'Title and content are required'
    });
  }

  // For now, create a demo user or find existing one
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

  const newPost = await CommunityPost.create({
    title,
    content,
    authorId: user._id,
    category,
    tags: Array.isArray(tags) ? tags : [],
    viewsCount: 1
  });

  const populatedPost = await CommunityPost
    .findById(newPost._id)
    .populate('authorId', 'firstName lastName email role avatarUrl')
    .lean();

  const formattedPost = {
    id: populatedPost._id.toString(),
    title: populatedPost.title,
    content: populatedPost.content,
    author: {
      id: populatedPost.authorId._id.toString(),
      name: `${populatedPost.authorId.firstName || ''} ${populatedPost.authorId.lastName || ''}`.trim() || populatedPost.authorId.email,
      avatar: populatedPost.authorId.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(populatedPost.authorId.firstName || populatedPost.authorId.email)}&background=3B82F6&color=fff`,
      role: populatedPost.authorId.role,
      joinedDate: populatedPost.authorId.createdAt
    },
    category: populatedPost.category,
    categoryInfo: {
      name: populatedPost.category,
      color: getCategoryColor(populatedPost.category),
      icon: getCategoryIcon(populatedPost.category)
    },
    tags: populatedPost.tags || [],
    createdAt: populatedPost.createdAt,
    lastActivity: populatedPost.lastActivityAt,
    stats: {
      views: populatedPost.viewsCount,
      replies: populatedPost.repliesCount,
      likes: populatedPost.likesCount,
      dislikes: populatedPost.dislikesCount
    },
    isPinned: populatedPost.isPinned,
    isLocked: populatedPost.isLocked,
    isFeatured: populatedPost.isFeatured
  };

  return res.status(201).json({
    success: true,
    data: formattedPost,
    message: 'Post created successfully'
  });
}

function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    'Tips & Strategies': '#3B82F6',
    'Showcase': '#10B981',
    'Tools & Tech': '#8B5CF6',
    'Announcements': '#F59E0B',
    'Q&A': '#EF4444',
    'Off-Topic': '#6B7280',
    'General': '#3B82F6'
  };
  return colors[category] || '#3B82F6';
}

function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    'Tips & Strategies': '💡',
    'Showcase': '🎨',
    'Tools & Tech': '🔧',
    'Announcements': '📢',
    'Q&A': '❓',
    'Off-Topic': '💬',
    'General': '📝'
  };
  return icons[category] || '📝';
}