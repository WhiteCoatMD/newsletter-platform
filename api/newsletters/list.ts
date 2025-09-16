import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Admin-level newsletter data
    const newsletters = [
      {
        id: 'newsletter_1726432800000',
        title: 'Weekly Productivity Insights',
        content: '<h2>Advanced Productivity Strategies</h2><p>This week we explore cutting-edge techniques...</p>',
        status: 'sent',
        createdAt: '2024-09-15T20:00:00Z',
        sentAt: '2024-09-15T21:00:00Z',
        statistics: {
          emailsSent: 125420,
          opensCount: 42893,
          clicksCount: 7274,
          unsubscribes: 43
        }
      },
      {
        id: 'newsletter_1726346400000',
        title: 'AI-Powered Market Analysis',
        content: '<h2>Deep Market Intelligence</h2><p>Advanced analytics and predictions...</p>',
        status: 'sent',
        createdAt: '2024-09-14T20:00:00Z',
        sentAt: '2024-09-14T21:00:00Z',
        statistics: {
          emailsSent: 125420,
          opensCount: 37248,
          clicksCount: 5143,
          unsubscribes: 31
        }
      },
      {
        id: 'newsletter_1726260000000',
        title: 'Enterprise Newsletter Strategies',
        content: '<h2>Scale Your Newsletter</h2><p>Advanced techniques for growth...</p>',
        status: 'sent',
        createdAt: '2024-09-13T20:00:00Z',
        sentAt: '2024-09-13T21:00:00Z',
        statistics: {
          emailsSent: 125420,
          opensCount: 40185,
          clicksCount: 6827,
          unsubscribes: 28
        }
      },
      {
        id: 'newsletter_draft_1726519200000',
        title: 'Advanced Analytics Deep Dive',
        content: '<h2>Draft Content</h2><p>Exploring advanced analytics features...</p>',
        status: 'draft',
        createdAt: '2024-09-16T20:00:00Z',
        sentAt: null,
        statistics: {
          emailsSent: 0,
          opensCount: 0,
          clicksCount: 0,
          unsubscribes: 0
        }
      },
      {
        id: 'newsletter_draft_1726605600000',
        title: 'Q4 Strategy Planning',
        content: '<h2>Strategic Planning</h2><p>Draft for Q4 newsletter strategy...</p>',
        status: 'draft',
        createdAt: '2024-09-17T20:00:00Z',
        sentAt: null,
        statistics: {
          emailsSent: 0,
          opensCount: 0,
          clicksCount: 0,
          unsubscribes: 0
        }
      }
    ];

    // Filter by status if requested
    const status = req.query.status as string;
    const filteredNewsletters = status
      ? newsletters.filter(n => n.status === status)
      : newsletters;

    res.status(200).json({
      success: true,
      data: filteredNewsletters,
      total: filteredNewsletters.length,
      message: 'Newsletters retrieved successfully'
    });

  } catch (error) {
    console.error('List newsletters error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve newsletters'
    });
  }
}