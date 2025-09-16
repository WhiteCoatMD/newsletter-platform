import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// Define schema directly in the API file for Vercel functions
const CommunityCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  color: { type: String, required: true, default: '#3B82F6' },
  icon: { type: String, required: true, default: '📝' },
  displayOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CommunityPostSchema = new mongoose.Schema({
  category: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  lastActivityAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create models or use existing ones
const CommunityCategory = mongoose.models.CommunityCategory || mongoose.model('CommunityCategory', CommunityCategorySchema);
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
      return await getCategories(req, res);
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });

  } catch (error) {
    console.error('Community categories API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function getCategories(req: VercelRequest, res: VercelResponse) {
  const { include_stats = 'false' } = req.query;

  // Ensure default categories exist
  await ensureDefaultCategories();

  let categories = await CommunityCategory
    .find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  if (include_stats === 'true') {
    // Add post counts and last activity for each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (category) => {
        const postCount = await CommunityPost.countDocuments({
          category: category.name,
          isDeleted: false
        });

        const lastPost = await CommunityPost
          .findOne({ category: category.name, isDeleted: false })
          .sort({ lastActivityAt: -1 })
          .lean();

        return {
          ...category,
          postCount,
          lastActivity: lastPost?.lastActivityAt || null
        };
      })
    );

    categories = categoriesWithStats;
  }

  // Format response
  const formattedCategories = categories.map(category => ({
    id: category._id.toString(),
    name: category.name,
    description: category.description,
    color: category.color,
    icon: category.icon,
    postCount: category.postCount,
    lastActivity: category.lastActivity,
    displayOrder: category.displayOrder
  }));

  return res.status(200).json({
    success: true,
    data: formattedCategories
  });
}

async function ensureDefaultCategories() {
  const defaultCategories = [
    {
      name: 'Tips & Strategies',
      description: 'Share tips and strategies for newsletter growth',
      color: '#3B82F6',
      icon: '💡',
      displayOrder: 1
    },
    {
      name: 'Showcase',
      description: 'Show off your newsletter designs and content',
      color: '#10B981',
      icon: '🎨',
      displayOrder: 2
    },
    {
      name: 'Tools & Tech',
      description: 'Discuss tools and technology for newsletters',
      color: '#8B5CF6',
      icon: '🔧',
      displayOrder: 3
    },
    {
      name: 'Announcements',
      description: 'Official announcements and updates',
      color: '#F59E0B',
      icon: '📢',
      displayOrder: 4
    },
    {
      name: 'Q&A',
      description: 'Questions and answers about newsletters',
      color: '#EF4444',
      icon: '❓',
      displayOrder: 5
    },
    {
      name: 'Off-Topic',
      description: 'General discussions and off-topic conversations',
      color: '#6B7280',
      icon: '💬',
      displayOrder: 6
    }
  ];

  // Create categories that don't exist
  for (const categoryData of defaultCategories) {
    await CommunityCategory.findOneAndUpdate(
      { name: categoryData.name },
      categoryData,
      { upsert: true, new: true }
    );
  }
}