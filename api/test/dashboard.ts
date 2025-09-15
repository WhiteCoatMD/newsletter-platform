import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  res.status(200).json({
    success: true,
    data: {
      message: 'Dashboard API working',
      timestamp: new Date().toISOString()
    }
  });
}