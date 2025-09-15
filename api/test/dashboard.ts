import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Return mock analytics data that matches what the frontend expects
  res.status(200).json({
    success: true,
    data: {
      emailsSent: 1250,
      openRate: 24.5,
      clickRate: 3.2,
      subscribers: 8420,
      recentEmails: [
        {
          id: '1',
          subject: 'Welcome to NewsBuildr',
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          openRate: 28.5,
          clickRate: 4.1
        },
        {
          id: '2',
          subject: 'Your Weekly Update',
          sentAt: new Date(Date.now() - 172800000).toISOString(),
          openRate: 22.3,
          clickRate: 2.8
        }
      ],
      timestamp: new Date().toISOString()
    }
  });
}