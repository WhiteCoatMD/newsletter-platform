import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    environment: process.env.NODE_ENV || 'unknown',
    mongodb: {
      configured: !!process.env.MONGODB_URI,
      uri_preview: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 20)}...` : 'Not set'
    },
    vercel: {
      region: process.env.VERCEL_REGION || 'unknown',
      deployment_id: process.env.VERCEL_DEPLOYMENT_ID || 'unknown'
    }
  };

  return res.status(200).json(healthCheck);
}