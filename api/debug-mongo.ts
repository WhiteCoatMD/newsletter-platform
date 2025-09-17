import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Check if MongoDB URI is available
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      return res.status(200).json({
        success: false,
        message: 'MONGODB_URI not set',
        env_vars: Object.keys(process.env).filter(key => key.includes('MONGO'))
      });
    }

    // Try to import mongoose
    let mongoose;
    try {
      mongoose = await import('mongoose');
    } catch (importError) {
      return res.status(200).json({
        success: false,
        message: 'Failed to import mongoose',
        error: importError instanceof Error ? importError.message : String(importError)
      });
    }

    // Try to connect
    try {
      await mongoose.default.connect(mongoUri, {
        bufferCommands: false,
      });

      return res.status(200).json({
        success: true,
        message: 'MongoDB connection successful',
        readyState: mongoose.default.connection.readyState
      });
    } catch (connectionError) {
      return res.status(200).json({
        success: false,
        message: 'MongoDB connection failed',
        error: connectionError instanceof Error ? connectionError.message : String(connectionError)
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unexpected error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}