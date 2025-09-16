import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Generate subscriber growth data for last 30 days
  const subscriberGrowth = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    subscriberGrowth.push({
      _id: date.toISOString().split('T')[0],
      count: Math.floor(125420 - (i * 50) + Math.random() * 200)
    });
  }

  // Return admin-level analytics data matching Analytics component structure
  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalNewsletters: 47,
        totalSubscribers: 125420,
        paidSubscribers: 89234,
        freeSubscribers: 36186,
        totalPosts: 127,
        publishedPosts: 98
      },
      metrics: {
        totalOpens: 148750,
        totalUniqueOpens: 91234,
        totalClicks: 22145,
        totalUniqueClicks: 18923,
        totalRevenue: 284759.50,
        totalUnsubscribes: 892,
        emailsSent: 47650
      },
      subscriberGrowth: subscriberGrowth,
      topPosts: [
        {
          _id: '1',
          title: 'Weekly Productivity Insights: AI-Powered Workflows',
          uniqueOpens: 8234,
          uniqueClicks: 1847,
          publishedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: '2',
          title: 'Market Analysis & Q4 Trends Report',
          uniqueOpens: 7891,
          uniqueClicks: 1623,
          publishedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          _id: '3',
          title: 'AI-Powered Newsletter Creation Guide',
          uniqueOpens: 7456,
          uniqueClicks: 1789,
          publishedAt: new Date(Date.now() - 259200000).toISOString()
        },
        {
          _id: '4',
          title: 'Subscriber Engagement Best Practices',
          uniqueOpens: 7123,
          uniqueClicks: 1456,
          publishedAt: new Date(Date.now() - 345600000).toISOString()
        },
        {
          _id: '5',
          title: 'Content Strategy for 2025',
          uniqueOpens: 6892,
          uniqueClicks: 1234,
          publishedAt: new Date(Date.now() - 432000000).toISOString()
        }
      ],
      recentEmails: [
        {
          id: '1',
          subject: 'Weekly Productivity Insights',
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          openRate: 34.2,
          clickRate: 5.8
        },
        {
          id: '2',
          subject: 'Market Analysis & Trends',
          sentAt: new Date(Date.now() - 172800000).toISOString(),
          openRate: 29.7,
          clickRate: 4.1
        },
        {
          id: '3',
          subject: 'AI-Powered Newsletter Tips',
          sentAt: new Date(Date.now() - 259200000).toISOString(),
          openRate: 32.1,
          clickRate: 6.2
        }
      ],
      accountType: 'admin',
      timestamp: new Date().toISOString()
    }
  });
}