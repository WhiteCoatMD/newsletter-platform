// Mock data for community system
export const mockPosts = [
  {
    id: '1',
    title: 'Welcome to NewsBuildr Community',
    content: 'This is a sample post to test the community feature. Feel free to start discussions about newsletter growth, tools, and strategies!',
    author: {
      id: '1',
      name: 'NewsBuildr Team',
      avatar: 'https://ui-avatars.com/api/?name=NewsBuildr+Team&background=3B82F6&color=fff',
      role: 'admin',
      joinedDate: '2024-01-01'
    },
    category: 'Announcements',
    categoryInfo: {
      name: 'Announcements',
      color: '#F59E0B',
      icon: '📢'
    },
    tags: ['welcome', 'announcement'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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
    title: 'Tips for Growing Your Newsletter Audience',
    content: 'What strategies have worked best for you when growing your newsletter? I\'ve been struggling to get past 1,000 subscribers and would love to hear your experiences.',
    author: {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=fff',
      role: 'premium',
      joinedDate: '2024-02-15'
    },
    category: 'Tips & Strategies',
    categoryInfo: {
      name: 'Tips & Strategies',
      color: '#3B82F6',
      icon: '💡'
    },
    tags: ['growth', 'tips', 'audience'],
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
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
  },
  {
    id: '3',
    title: 'Show Off Your Newsletter Design',
    content: 'I just redesigned my newsletter and would love feedback! Here\'s what I changed and why...',
    author: {
      id: '3',
      name: 'Mike Chen',
      avatar: 'https://ui-avatars.com/api/?name=Mike+Chen&background=8B5CF6&color=fff',
      role: 'subscriber',
      joinedDate: '2024-03-01'
    },
    category: 'Showcase',
    categoryInfo: {
      name: 'Showcase',
      color: '#10B981',
      icon: '🎨'
    },
    tags: ['design', 'feedback', 'showcase'],
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    stats: {
      views: 67,
      replies: 5,
      likes: 9,
      dislikes: 0
    },
    isPinned: false,
    isLocked: false,
    isFeatured: false
  }
];

export const mockCategories = [
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