import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    success: true,
    message: 'Ping successful',
    method: req.method,
    timestamp: new Date().toISOString(),
    headers: {
      authorization: req.headers.authorization || 'none',
      'user-agent': req.headers['user-agent'] || 'none'
    }
  });
}