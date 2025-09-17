import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

const ContentPreferencesSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  contentGeneration: {
    mode: {
      type: String,
      enum: ['manual-only', 'ai-only', 'mixed'],
      default: 'mixed'
    },
    aiAssistance: {
      type: Boolean,
      default: true
    },
    autoGenerate: {
      type: Boolean,
      default: false
    }
  },
  contentSources: {
    allowUserContent: { type: Boolean, default: true },
    allowAIContent: { type: Boolean, default: true },
    allowExternalContent: { type: Boolean, default: true }
  },
  qualityFilters: {
    minimumWordCount: { type: Number, default: 100 },
    requireImages: { type: Boolean, default: false },
    requireSummary: { type: Boolean, default: true }
  },
  categories: [{ type: String }],
  contentTypes: [{ type: String }],
  updatedAt: { type: Date, default: Date.now }
});

const ContentPreferences = mongoose.models.ContentPreferences ||
  mongoose.model('ContentPreferences', ContentPreferencesSchema);

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
          let preferences = await ContentPreferences.findOne({ userId }).lean();

          if (!preferences) {
            // Create default preferences
            preferences = await ContentPreferences.create({
              userId,
              contentGeneration: {
                mode: 'mixed',
                aiAssistance: true,
                autoGenerate: false
              },
              contentSources: {
                allowUserContent: true,
                allowAIContent: true,
                allowExternalContent: true
              },
              qualityFilters: {
                minimumWordCount: 100,
                requireImages: false,
                requireSummary: true
              },
              categories: ['technology', 'business'],
              contentTypes: ['articles', 'news']
            });
          }

          res.status(200).json(preferences);
        } catch (error) {
          console.error('Error fetching preferences:', error);
          res.status(500).json({ error: 'Failed to fetch preferences' });
        }
        break;

      case 'PUT':
        try {
          const updateData = {
            ...req.body,
            updatedAt: new Date()
          };

          const preferences = await ContentPreferences.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, upsert: true, runValidators: true }
          ).lean();

          res.status(200).json(preferences);
        } catch (error) {
          console.error('Error updating preferences:', error);
          res.status(500).json({ error: 'Failed to update preferences' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}