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
    const { id } = req.query;
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
          const article = await Article.findOne({ _id: id, userId }).lean();

          if (!article) {
            return res.status(404).json({ error: 'Article not found' });
          }

          res.status(200).json(article);
        } catch (error) {
          console.error('Error fetching article:', error);
          res.status(500).json({ error: 'Failed to fetch article' });
        }
        break;

      case 'PUT':
        try {
          const updateData = {
            ...req.body,
            updatedAt: new Date()
          };

          const article = await Article.findOneAndUpdate(
            { _id: id, userId },
            updateData,
            { new: true, runValidators: true }
          ).lean();

          if (!article) {
            return res.status(404).json({ error: 'Article not found' });
          }

          res.status(200).json(article);
        } catch (error) {
          console.error('Error updating article:', error);
          res.status(500).json({ error: 'Failed to update article' });
        }
        break;

      case 'DELETE':
        try {
          const article = await Article.findOneAndDelete({ _id: id, userId });

          if (!article) {
            return res.status(404).json({ error: 'Article not found' });
          }

          res.status(200).json({ message: 'Article deleted successfully' });
        } catch (error) {
          console.error('Error deleting article:', error);
          res.status(500).json({ error: 'Failed to delete article' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}