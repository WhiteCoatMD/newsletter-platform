import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple endpoint that just checks environment variables
  const status = {
    timestamp: new Date().toISOString(),
    mongodb_configured: !!process.env.MONGODB_URI,
    status: process.env.MONGODB_URI ? 'Database configured' : 'Database not configured'
  };

  return res.status(200).json(status);
}