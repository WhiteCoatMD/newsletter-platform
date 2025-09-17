import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  Cog6ToothIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import PreferenceManager from '../Preferences/PreferenceManager';

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

const DynamicContentDemo: React.FC = () => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [contentData, setContentData] = useState<{
    curated: ContentItem[];
    trending: ContentItem[];
    personalized: ContentItem[];
  }>({
    curated: [],
    trending: [],
    personalized: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'curated' | 'trending' | 'personalized'>('personalized');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Simulate API calls
      const [curatedRes, trendingRes, personalizedRes] = await Promise.all([
        fetch('/api/content/dynamic?action=curated&maxItems=4'),
        fetch('/api/content/dynamic?action=trending&maxItems=4'),
        fetch('/api/content/dynamic?action=personalized&userId=demo-user&maxItems=4')
      ]);

      const curated = curatedRes.ok ? (await curatedRes.json()).data.content : [];
      const trending = trendingRes.ok ? (await trendingRes.json()).data.content : [];
      const personalized = personalizedRes.ok ? (await personalizedRes.json()).data.content : [];

      setContentData({
        curated,
        trending,
        personalized
      });
    } catch (error) {
      console.error('Failed to load content:', error);
      // Use mock data as fallback
      setContentData({
        curated: mockContent.slice(0, 4),
        trending: mockContent.slice(4, 8),
        personalized: mockContent.slice(0, 4)
      });
    } finally {
      setLoading(false);
    }
  };

  const mockContent: ContentItem[] = [
    {
      id: '1',
      title: 'The Future of AI in Web Development',
      description: 'Exploring how artificial intelligence is transforming the way we build websites.',
      url: '#',
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
      title: 'Startup Funding Trends in 2024',
      description: 'Analysis of current venture capital trends and what they mean for entrepreneurs.',
      url: '#',
      category: 'business',
      contentType: 'articles',
      publishedAt: '2024-03-13T09:15:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop',
      author: 'Jennifer Williams',
      readTime: 6,
      popularity: 78
    },
    {
      id: '3',
      title: 'Mental Health in the Digital Age',
      description: 'Understanding the impact of technology on mental wellness and coping strategies.',
      url: '#',
      category: 'health',
      contentType: 'articles',
      publishedAt: '2024-03-11T11:20:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop',
      author: 'Dr. Lisa Rodriguez',
      readTime: 7,
      popularity: 91
    },
    {
      id: '4',
      title: 'Building Scalable React Applications',
      description: 'Best practices for creating React apps that can handle millions of users.',
      url: '#',
      category: 'technology',
      contentType: 'tutorials',
      publishedAt: '2024-03-14T14:30:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop',
      author: 'Mike Chen',
      readTime: 12,
      popularity: 87
    }
  ];

  const tabs = [
    {
      id: 'personalized',
      name: 'Personalized',
      description: 'Content tailored to your preferences',
      icon: '🎯'
    },
    {
      id: 'trending',
      name: 'Trending',
      description: 'Most popular content right now',
      icon: '🔥'
    },
    {
      id: 'curated',
      name: 'Curated',
      description: 'Hand-picked quality content',
      icon: '✨'
    }
  ];

  const getCurrentContent = () => {
    const content = contentData[activeTab];
    return content.length > 0 ? content : mockContent;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
          Dynamic Content System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
          See how our newsletter templates can automatically populate with content based on reader preferences,
          trending topics, or curated selections.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setShowPreferences(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span>Manage Preferences</span>
          </button>

          <button
            onClick={loadContent}
            disabled={loading}
            className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Content</span>
          </button>
        </div>
      </div>

      {/* Content Type Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 text-center transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 border-b-2 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <div>
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Grid */}
        <div className="p-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getCurrentContent().map((item) => (
                <article
                  key={item.id}
                  className="group bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {item.category}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {item.contentType.replace('-', ' ')}
                      </span>
                      {item.readTime && (
                        <span className="text-xs text-gray-500">
                          {item.readTime} min read
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        {item.author && <span>By {item.author}</span>}
                        <span>•</span>
                        <span>{formatDate(item.publishedAt)}</span>
                      </div>
                      {item.popularity && (
                        <div className="flex items-center space-x-1">
                          <span>🔥</span>
                          <span>{item.popularity}% popularity</span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Personalized Content</h3>
          <p className="text-gray-600">
            Content is automatically filtered and ranked based on each reader's individual preferences,
            topics of interest, and content type preferences.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🔄</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Dynamic Updates</h3>
          <p className="text-gray-600">
            Newsletter content updates automatically based on trending topics,
            new publications, and changing reader preferences without manual intervention.
          </p>
        </div>

        <div className="text-center">
          <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Analytics</h3>
          <p className="text-gray-600">
            Track engagement with different content types and topics to continuously
            improve personalization and content curation algorithms.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How Dynamic Content Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">1. Reader Preferences</h4>
            <p className="text-sm text-gray-600">Readers select their interests, preferred content types, and frequency.</p>
          </div>

          <div className="text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <span className="text-3xl">🤖</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">2. AI Processing</h4>
            <p className="text-sm text-gray-600">Our system analyzes preferences and matches them with available content.</p>
          </div>

          <div className="text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <span className="text-3xl">📰</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">3. Content Generation</h4>
            <p className="text-sm text-gray-600">Dynamic boxes in templates automatically populate with relevant content.</p>
          </div>

          <div className="text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <span className="text-3xl">📧</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">4. Personalized Newsletter</h4>
            <p className="text-sm text-gray-600">Each reader receives a unique newsletter tailored to their preferences.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Create Dynamic Templates?
        </h2>
        <p className="text-gray-600 mb-6">
          Start building newsletter templates with dynamic content boxes that automatically
          adapt to your readers' preferences.
        </p>
        <button
          onClick={() => window.location.href = '/templates/create'}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Create Your First Dynamic Template
        </button>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <PreferenceManager
              userId="demo-user"
              embedded={false}
              onClose={() => setShowPreferences(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicContentDemo;