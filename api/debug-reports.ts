import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

// Define schemas directly in the API file for Vercel functions
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

const ModerationReport = mongoose.models.ModerationReport || mongoose.model('ModerationReport', ModerationReportSchema);

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.MONGODB_URI) {
    return res.status(503).json({
      success: false,
      message: 'Database not configured'
    });
  }

  try {
    await connectToDatabase();

    const allReports = await ModerationReport.find({}).lean();
    const pendingReports = await ModerationReport.find({ status: 'pending' }).lean();

    return res.status(200).json({
      success: true,
      data: {
        total_reports: allReports.length,
        pending_reports: pendingReports.length,
        all_reports: allReports.map(r => ({
          id: r._id,
          targetType: r.targetType,
          targetId: r.targetId,
          status: r.status,
          reason: r.reason,
          priority: r.priority,
          createdAt: r.createdAt
        })),
        pending_reports_detail: pendingReports.map(r => ({
          id: r._id,
          targetType: r.targetType,
          targetId: r.targetId,
          status: r.status,
          reason: r.reason,
          priority: r.priority,
          createdAt: r.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Debug reports error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}