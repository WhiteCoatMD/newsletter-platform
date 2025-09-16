import type { VercelRequest, VercelResponse } from '@vercel/node';

const mockCategories = [
  {
    id: '1',
    name: 'Tips & Strategies',
    description: 'Share tips and strategies for newsletter growth',
    color: '#3B82F6',
    icon: '💡',
    postCount: 24,
    lastActivity: new Date().toISOString(),
    displayOrder: 1
  },
  {
    id: '2',
    name: 'Showcase',
    description: 'Show off your newsletter designs and content',
    color: '#10B981',
    icon: '🎨',
    postCount: 15,
    lastActivity: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    displayOrder: 2
  },
  {
    id: '3',
    name: 'Tools & Tech',
    description: 'Discuss tools and technology for newsletters',
    color: '#8B5CF6',
    icon: '🔧',
    postCount: 18,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    displayOrder: 3
  },
  {
    id: '4',
    name: 'Announcements',
    description: 'Official announcements and updates',
    color: '#F59E0B',
    icon: '📢',
    postCount: 8,
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    displayOrder: 4
  },
  {
    id: '5',
    name: 'Q&A',
    description: 'Questions and answers about newsletters',
    color: '#EF4444',
    icon: '❓',
    postCount: 31,
    lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    displayOrder: 5
  },
  {
    id: '6',
    name: 'Off-Topic',
    description: 'General discussions and off-topic conversations',
    color: '#6B7280',
    icon: '💬',
    postCount: 12,
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    displayOrder: 6
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;

    if (method === 'GET') {
      return res.status(200).json({
        success: true,
        data: mockCategories
      });
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });

  } catch (error) {
    console.error('Community categories API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}