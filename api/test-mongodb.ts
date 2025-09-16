import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

let isConnected = false;

async function connectToDatabase() {
  if (isConnected) return { success: true, message: 'Already connected' };

  if (!process.env.MONGODB_URI) {
    return { success: false, message: 'MONGODB_URI not configured' };
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    isConnected = true;
    return { success: true, message: 'Successfully connected to MongoDB' };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return {
      success: false,
      message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.stack : String(error)
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const connectionResult = await connectToDatabase();

  const response = {
    timestamp: new Date().toISOString(),
    mongodb_uri_configured: !!process.env.MONGODB_URI,
    mongodb_uri_preview: process.env.MONGODB_URI ?
      `${process.env.MONGODB_URI.substring(0, 30)}...` : 'Not set',
    connection: connectionResult,
    mongoose_state: {
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name,
      host: mongoose.connection.host
    }
  };

  return res.status(connectionResult.success ? 200 : 500).json(response);
}