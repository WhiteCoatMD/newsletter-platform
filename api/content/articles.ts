import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String },
  category: { type: String, required: true },
  tags: [{ type: String }],
  author: { type: String, required: true },
  imageUrl: { type: String },
  url: { type: String },
  isAIGenerated: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Article = mongoose.models.Article || mongoose.model('Article', ArticleSchema);

async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB();

    const { method } = req;
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    // Simple auth check - in production, verify JWT properly
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Extract user ID from token or use demo user
    const userId = 'demo-user'; // In production, decode from JWT

    switch (method) {
      case 'GET':
        try {
          const {
            page = 1,
            limit = 10,
            category,
            status,
            search,
            tags
          } = req.query;

          const query: any = { userId };

          if (category && category !== 'all') {
            query.category = category;
          }

          if (status && status !== 'all') {
            query.status = status;
          }

          if (search) {
            query.$or = [
              { title: { $regex: search, $options: 'i' } },
              { content: { $regex: search, $options: 'i' } },
              { summary: { $regex: search, $options: 'i' } }
            ];
          }

          if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            query.tags = { $in: tagArray };
          }

          const skip = (Number(page) - 1) * Number(limit);

          const [articles, total] = await Promise.all([
            Article.find(query)
              .sort({ updatedAt: -1 })
              .skip(skip)
              .limit(Number(limit))
              .lean(),
            Article.countDocuments(query)
          ]);

          res.status(200).json({
            articles,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total,
              pages: Math.ceil(total / Number(limit))
            }
          });
        } catch (error) {
          console.error('Error fetching articles:', error);
          res.status(500).json({ error: 'Failed to fetch articles' });
        }
        break;

      case 'POST':
        try {
          const articleData = {
            ...req.body,
            userId,
            updatedAt: new Date()
          };

          const article = new Article(articleData);
          await article.save();

          res.status(201).json(article);
        } catch (error) {
          console.error('Error creating article:', error);
          res.status(500).json({ error: 'Failed to create article' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}