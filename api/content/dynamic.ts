import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  contentType: string;
  publishedAt: string;
  imageUrl?: string;
  author?: string;
  readTime?: number;
  popularity?: number;
}

interface UserPreferences {
  userId: string;
  topics: string[];
  contentTypes: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  categories: { [key: string]: boolean };
}

// Mock content database
const mockContent: ContentItem[] = [
  // Technology
  {
    id: '1',
    title: 'The Future of AI in Web Development',
    description: 'Exploring how artificial intelligence is transforming the way we build websites and applications.',
    url: 'https://example.com/ai-web-development',
    category: 'technology',
    contentType: 'articles',
    publishedAt: '2024-03-15T10:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=200&fit=crop',
    author: 'Sarah Johnson',
    readTime: 8,
    popularity: 95
  },
  {
    id: '2',
    title: 'Building Scalable React Applications',
    description: 'Best practices for creating React apps that can handle millions of users.',
    url: 'https://example.com/scalable-react',
    category: 'technology',
    contentType: 'tutorials',
    publishedAt: '2024-03-14T14:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop',
    author: 'Mike Chen',
    readTime: 12,
    popularity: 87
  },

  // Business
  {
    id: '3',
    title: 'Startup Funding Trends in 2024',
    description: 'Analysis of current venture capital trends and what they mean for entrepreneurs.',
    url: 'https://example.com/startup-funding-2024',
    category: 'business',
    contentType: 'articles',
    publishedAt: '2024-03-13T09:15:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop',
    author: 'Jennifer Williams',
    readTime: 6,
    popularity: 78
  },
  {
    id: '4',
    title: 'Remote Work Best Practices',
    description: 'How to build a productive remote team culture in the post-pandemic world.',
    url: 'https://example.com/remote-work-practices',
    category: 'business',
    contentType: 'research',
    publishedAt: '2024-03-12T16:45:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=200&fit=crop',
    author: 'David Park',
    readTime: 10,
    popularity: 82
  },

  // Health
  {
    id: '5',
    title: 'Mental Health in the Digital Age',
    description: 'Understanding the impact of technology on mental wellness and coping strategies.',
    url: 'https://example.com/digital-mental-health',
    category: 'health',
    contentType: 'articles',
    publishedAt: '2024-03-11T11:20:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop',
    author: 'Dr. Lisa Rodriguez',
    readTime: 7,
    popularity: 91
  },

  // Science
  {
    id: '6',
    title: 'Breakthrough in Quantum Computing',
    description: 'Latest developments in quantum technology and their potential applications.',
    url: 'https://example.com/quantum-computing-breakthrough',
    category: 'science',
    contentType: 'news',
    publishedAt: '2024-03-10T13:30:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=200&fit=crop',
    author: 'Prof. Alan Kumar',
    readTime: 5,
    popularity: 93
  },

  // Finance
  {
    id: '7',
    title: 'Cryptocurrency Market Analysis Q1 2024',
    description: 'Comprehensive review of crypto market trends and investment opportunities.',
    url: 'https://example.com/crypto-analysis-q1-2024',
    category: 'finance',
    contentType: 'research',
    publishedAt: '2024-03-09T08:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1605792657660-596af9009726?w=400&h=200&fit=crop',
    author: 'Robert Thompson',
    readTime: 15,
    popularity: 76
  },

  // Entertainment
  {
    id: '8',
    title: 'The Rise of Streaming Platforms',
    description: 'How streaming services are reshaping the entertainment industry landscape.',
    url: 'https://example.com/streaming-platforms-rise',
    category: 'entertainment',
    contentType: 'articles',
    publishedAt: '2024-03-08T19:15:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=200&fit=crop',
    author: 'Emma Davis',
    readTime: 9,
    popularity: 84
  },

  // Environment
  {
    id: '9',
    title: 'Sustainable Energy Solutions for Cities',
    description: 'Innovative approaches to renewable energy in urban environments.',
    url: 'https://example.com/sustainable-city-energy',
    category: 'environment',
    contentType: 'articles',
    publishedAt: '2024-03-07T10:45:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=200&fit=crop',
    author: 'Green Initiative Team',
    readTime: 11,
    popularity: 88
  },

  // Education
  {
    id: '10',
    title: 'Online Learning Trends Post-2023',
    description: 'Evolution of digital education and its impact on traditional learning models.',
    url: 'https://example.com/online-learning-trends',
    category: 'education',
    contentType: 'research',
    publishedAt: '2024-03-06T14:20:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=200&fit=crop',
    author: 'Education Research Lab',
    readTime: 8,
    popularity: 79
  }
];

function getPersonalizedContent(
  preferences: UserPreferences,
  contentSource: 'curated' | 'trending' | 'personalized',
  maxItems: number = 5,
  categories?: string[]
): ContentItem[] {
  let filteredContent = [...mockContent];

  // Filter by user preferences or specified categories
  const targetCategories = categories?.length ? categories : preferences.topics;
  const targetContentTypes = preferences.contentTypes;

  if (targetCategories?.length > 0) {
    filteredContent = filteredContent.filter(item =>
      targetCategories.some(cat => item.category.toLowerCase() === cat.toLowerCase())
    );
  }

  if (targetContentTypes?.length > 0) {
    filteredContent = filteredContent.filter(item =>
      targetContentTypes.includes(item.contentType)
    );
  }

  // Sort based on content source
  switch (contentSource) {
    case 'trending':
      filteredContent.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      break;
    case 'curated':
      filteredContent.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      break;
    case 'personalized':
      // Weighted scoring based on user preferences
      filteredContent = filteredContent.map(item => ({
        ...item,
        personalizedScore: calculatePersonalizedScore(item, preferences)
      })).sort((a, b) => (b as any).personalizedScore - (a as any).personalizedScore);
      break;
  }

  return filteredContent.slice(0, maxItems);
}

function calculatePersonalizedScore(item: ContentItem, preferences: UserPreferences): number {
  let score = item.popularity || 0;

  // Boost score for preferred topics
  if (preferences.topics.includes(item.category)) {
    score += 20;
  }

  // Boost score for preferred content types
  if (preferences.contentTypes.includes(item.contentType)) {
    score += 15;
  }

  // Boost score for recent content
  const daysSincePublished = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished < 7) {
    score += 10;
  }

  // Adjust for read time based on content type preference
  if (item.readTime) {
    if (item.readTime <= 5) score += 5; // Quick reads
    if (item.readTime > 10) score += 3; // In-depth content
  }

  return score;
}

function getTrendingContent(maxItems: number = 5): ContentItem[] {
  return mockContent
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, maxItems);
}

function getCuratedContent(categories?: string[], maxItems: number = 5): ContentItem[] {
  let content = [...mockContent];

  if (categories?.length) {
    content = content.filter(item =>
      categories.some(cat => item.category.toLowerCase() === cat.toLowerCase())
    );
  }

  return content
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, maxItems);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }

  try {
    const {
      action,
      userId,
      contentSource = 'curated',
      maxItems = '5',
      categories
    } = req.query;

    const parsedMaxItems = parseInt(maxItems as string, 10) || 5;
    const parsedCategories = categories ? (categories as string).split(',') : undefined;

    switch (action) {
      case 'personalized': {
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'userId is required for personalized content'
          });
        }

        // In a real app, fetch user preferences from database
        // For now, try to get from a hypothetical preferences store
        const mockPreferences: UserPreferences = {
          userId: userId as string,
          topics: ['technology', 'business'],
          contentTypes: ['articles', 'tutorials'],
          frequency: 'weekly',
          categories: {
            technology: true,
            business: true,
            health: false
          }
        };

        const content = getPersonalizedContent(
          mockPreferences,
          contentSource as 'curated' | 'trending' | 'personalized',
          parsedMaxItems,
          parsedCategories
        );

        return res.status(200).json({
          success: true,
          data: {
            content,
            preferences: mockPreferences,
            contentSource,
            totalItems: content.length
          }
        });
      }

      case 'trending': {
        const content = getTrendingContent(parsedMaxItems);

        return res.status(200).json({
          success: true,
          data: {
            content,
            contentSource: 'trending',
            totalItems: content.length
          }
        });
      }

      case 'curated':
      default: {
        const content = getCuratedContent(parsedCategories, parsedMaxItems);

        return res.status(200).json({
          success: true,
          data: {
            content,
            contentSource: 'curated',
            categories: parsedCategories,
            totalItems: content.length
          }
        });
      }
    }

  } catch (error) {
    console.error('Dynamic content API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}