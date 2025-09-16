import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory posts for testing
const mockPosts = [
  {
    id: '1',
    title: 'Welcome to NewsBuildr Community',
    content: 'This is a sample post to test the community feature. Feel free to start discussions!',
    author: {
      id: '1',
      name: 'NewsBuildr Team',
      avatar: 'https://ui-avatars.com/api/?name=NewsBuildr+Team',
      role: 'admin'
    },
    category: 'Announcements',
    tags: ['welcome', 'announcement'],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    stats: {
      views: 156,
      replies: 8,
      likes: 23,
      dislikes: 1
    },
    isPinned: true,
    isLocked: false,
    isFeatured: true
  },
  {
    id: '2',
    title: 'Tips for Growing Your Newsletter',
    content: 'Share your best tips for growing a newsletter audience. What strategies have worked for you?',
    author: {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson',
      role: 'premium'
    },
    category: 'Tips & Strategies',
    tags: ['growth', 'tips', 'audience'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stats: {
      views: 89,
      replies: 12,
      likes: 15,
      dislikes: 0
    },
    isPinned: false,
    isLocked: false,
    isFeatured: false
  }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;

    if (method === 'GET') {
      return res.status(200).json({
        success: true,
        data: {
          posts: mockPosts,
          pagination: {
            page: 1,
            limit: 20,
            total: mockPosts.length,
            totalPages: 1
          }
        }
      });
    }

    if (method === 'POST') {
      // For now, just return success without actually storing
      return res.status(201).json({
        success: true,
        message: 'Post created successfully (mock)',
        data: {
          id: Date.now().toString(),
          ...req.body,
          createdAt: new Date().toISOString()
        }
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });

  } catch (error) {
    console.error('Community posts API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}