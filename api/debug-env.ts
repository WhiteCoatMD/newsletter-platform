import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    success: true,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      // Don't expose sensitive data, just check if they exist
      has_database_url: !!process.env.DATABASE_URL,
      vercel_env: process.env.VERCEL_ENV,
    },
    headers: {
      host: req.headers.host,
      origin: req.headers.origin,
    }
  });
}