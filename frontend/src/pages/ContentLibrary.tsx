import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  SparklesIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PhotoIcon,
  LinkIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  contentType: string;
  tags: string[];
  imageUrl?: string;
  author: string;
  readTime: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  url?: string;
  source: 'user-created' | 'ai-generated' | 'curated';
}

interface ContentSettings {
  contentSource: 'manual-only' | 'ai-only' | 'mixed';
  aiContentCategories: string[];
  maxAIArticles: number;
  autoPublish: boolean;
  moderationRequired: boolean;
}

const ContentLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [contentSettings, setContentSettings] = useState<ContentSettings>({
    contentSource: 'mixed',
    aiContentCategories: ['technology', 'business'],
    maxAIArticles: 10,
    autoPublish: false,
    moderationRequired: true
  });

  const categories = [
    'technology', 'business', 'health', 'science', 'politics',
    'sports', 'entertainment', 'finance', 'education', 'environment'
  ];

  const contentTypes = [
    'articles', 'news', 'tutorials', 'videos', 'podcasts',
    'interviews', 'reviews', 'research'
  ];

  // Load articles and settings
  useEffect(() => {
    loadArticles();
    loadSettings();
  }, []);

  const loadArticles = () => {
    // Load from localStorage for now
    const savedArticles = JSON.parse(localStorage.getItem('user-articles') || '[]');

    // Add some sample articles if none exist
    if (savedArticles.length === 0) {
      const sampleArticles: Article[] = [
        {
          id: '1',
          title: 'Getting Started with Newsletter Creation',
          description: 'A beginner\'s guide to creating engaging newsletters that your readers will love.',
          content: '<h2>Introduction</h2><p>Creating newsletters can be challenging, but with the right approach...</p>',
          category: 'business',
          contentType: 'articles',
          tags: ['newsletters', 'marketing', 'beginner'],
          imageUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=400&h=200&fit=crop',
          author: 'You',
          readTime: 5,
          isPublished: true,
          createdAt: '2024-03-15T10:00:00Z',
          updatedAt: '2024-03-15T10:00:00Z',
          source: 'user-created'
        },
        {
          id: '2',
          title: 'AI-Powered Content Generation Tips',
          description: 'How to effectively use AI to enhance your newsletter content while maintaining authenticity.',
          content: '<h2>AI in Content Creation</h2><p>Artificial intelligence can be a powerful tool...</p>',
          category: 'technology',
          contentType: 'articles',
          tags: ['ai', 'content', 'automation'],
          imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
          author: 'AI Assistant',
          readTime: 7,
          isPublished: true,
          createdAt: '2024-03-14T14:00:00Z',
          updatedAt: '2024-03-14T14:00:00Z',
          source: 'ai-generated'
        }
      ];
      localStorage.setItem('user-articles', JSON.stringify(sampleArticles));
      setArticles(sampleArticles);
    } else {
      setArticles(savedArticles);
    }
  };

  const loadSettings = () => {
    const savedSettings = JSON.parse(localStorage.getItem('content-settings') || '{}');
    setContentSettings(prev => ({ ...prev, ...savedSettings }));
  };

  const saveSettings = () => {
    localStorage.setItem('content-settings', JSON.stringify(contentSettings));
    toast.success('Content settings saved!');
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchesSource = sourceFilter === 'all' || article.source === sourceFilter;

    return matchesSearch && matchesCategory && matchesSource;
  });

  const handleCreateArticle = () => {
    navigate('/content/create');
  };

  const handleEditArticle = (articleId: string) => {
    navigate(`/content/edit/${articleId}`);
  };

  const handleDeleteArticle = (articleId: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const updatedArticles = articles.filter(a => a.id !== articleId);
      setArticles(updatedArticles);
      localStorage.setItem('user-articles', JSON.stringify(updatedArticles));
      toast.success('Article deleted');
    }
  };

  const handleTogglePublish = (articleId: string) => {
    const updatedArticles = articles.map(article =>
      article.id === articleId
        ? { ...article, isPublished: !article.isPublished, updatedAt: new Date().toISOString() }
        : article
    );
    setArticles(updatedArticles);
    localStorage.setItem('user-articles', JSON.stringify(updatedArticles));

    const article = updatedArticles.find(a => a.id === articleId);
    toast.success(article?.isPublished ? 'Article published' : 'Article unpublished');
  };

  const generateAIContent = async () => {
    if (contentSettings.contentSource === 'manual-only') {
      toast.error('AI content generation is disabled in your settings');
      return;
    }

    toast.success('Generating AI content... (This is a demo)');

    // Simulate AI content generation
    setTimeout(() => {
      const aiArticle: Article = {
        id: Date.now().toString(),
        title: 'AI-Generated: Latest Trends in Digital Marketing',
        description: 'Explore the cutting-edge strategies that are reshaping the digital marketing landscape in 2024.',
        content: '<h2>Digital Marketing Evolution</h2><p>The digital marketing landscape continues to evolve rapidly, with new technologies and strategies emerging...</p><h3>Key Trends</h3><ul><li>AI-powered personalization</li><li>Voice search optimization</li><li>Interactive content experiences</li></ul>',
        category: contentSettings.aiContentCategories[0] || 'business',
        contentType: 'articles',
        tags: ['digital-marketing', 'ai', 'trends'],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
        author: 'AI Content Generator',
        readTime: 6,
        isPublished: contentSettings.autoPublish,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'ai-generated'
      };

      const updatedArticles = [aiArticle, ...articles];
      setArticles(updatedArticles);
      localStorage.setItem('user-articles', JSON.stringify(updatedArticles));
      toast.success('AI article generated successfully!');
    }, 2000);
  };

  const getSourceBadge = (source: Article['source']) => {
    switch (source) {
      case 'user-created':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Your Content</span>;
      case 'ai-generated':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">AI Generated</span>;
      case 'curated':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Curated</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600 mt-2">Manage your articles and content preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>

          {contentSettings.contentSource !== 'manual-only' && (
            <button
              onClick={generateAIContent}
              className="flex items-center space-x-2 border border-purple-600 text-purple-600 px-4 py-2 rounded-md hover:bg-purple-50"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Generate AI Content</span>
            </button>
          )}

          <button
            onClick={handleCreateArticle}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Article</span>
          </button>
        </div>
      </div>

      {/* Content Source Indicator */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Content Source:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                contentSettings.contentSource === 'manual-only'
                  ? 'bg-blue-100 text-blue-800'
                  : contentSettings.contentSource === 'ai-only'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {contentSettings.contentSource === 'manual-only' && 'Manual Only'}
                {contentSettings.contentSource === 'ai-only' && 'AI Only'}
                {contentSettings.contentSource === 'mixed' && 'Manual + AI'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {filteredArticles.length} articles
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Last updated: {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="user-created">Your Content</option>
              <option value="ai-generated">AI Generated</option>
              <option value="curated">Curated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div key={article.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            {/* Article Image */}
            <div className="relative h-48 bg-gray-100">
              {article.imageUrl ? (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex space-x-1">
                {getSourceBadge(article.source)}
              </div>
              <div className="absolute top-2 left-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  article.isPublished
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {article.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            {/* Article Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                  {article.category}
                </span>
                <span className="text-xs text-gray-500">
                  {article.readTime} min read
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {article.title}
              </h3>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {article.description}
              </p>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {article.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{article.tags.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{formatDate(article.createdAt)}</span>
                </div>
                <span>By {article.author}</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setPreviewArticle(article)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  title="Preview"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => handleEditArticle(article.id)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  title="Edit"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleTogglePublish(article.id)}
                  className={`px-3 py-2 rounded text-sm ${
                    article.isPublished
                      ? 'border border-orange-300 text-orange-600 hover:bg-orange-50'
                      : 'border border-green-300 text-green-600 hover:bg-green-50'
                  }`}
                  title={article.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {article.isPublished ? 'Unpublish' : 'Publish'}
                </button>

                <button
                  onClick={() => handleDeleteArticle(article.id)}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
          <p className="text-gray-500 mb-4">Create your first article or adjust your filters.</p>
          <button
            onClick={handleCreateArticle}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Article
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Content Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Content Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Content Source</label>
                <div className="space-y-3">
                  {[
                    { value: 'manual-only', label: 'Manual Only', description: 'Only use articles you create yourself' },
                    { value: 'ai-only', label: 'AI Only', description: 'Let AI generate all content automatically' },
                    { value: 'mixed', label: 'Manual + AI', description: 'Combine your articles with AI-generated content' }
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        contentSettings.contentSource === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setContentSettings(prev => ({ ...prev, contentSource: option.value as any }))}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          checked={contentSettings.contentSource === option.value}
                          onChange={() => setContentSettings(prev => ({ ...prev, contentSource: option.value as any }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <h4 className="font-medium text-gray-900">{option.label}</h4>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Content Settings */}
              {contentSettings.contentSource !== 'manual-only' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">AI Content Categories</label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(category => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={contentSettings.aiContentCategories.includes(category)}
                            onChange={(e) => {
                              const newCategories = e.target.checked
                                ? [...contentSettings.aiContentCategories, category]
                                : contentSettings.aiContentCategories.filter(c => c !== category);
                              setContentSettings(prev => ({ ...prev, aiContentCategories: newCategories }));
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max AI Articles</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={contentSettings.maxAIArticles}
                      onChange={(e) => setContentSettings(prev => ({ ...prev, maxAIArticles: parseInt(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={contentSettings.autoPublish}
                        onChange={(e) => setContentSettings(prev => ({ ...prev, autoPublish: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Auto-publish AI generated content</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={contentSettings.moderationRequired}
                        onChange={(e) => setContentSettings(prev => ({ ...prev, moderationRequired: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Require moderation before publishing</span>
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewArticle.title}</h3>
                <p className="text-sm text-gray-500">By {previewArticle.author}</p>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {previewArticle.imageUrl && (
                <img
                  src={previewArticle.imageUrl}
                  alt={previewArticle.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: previewArticle.content }} />
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleEditArticle(previewArticle.id);
                  setPreviewArticle(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentLibrary;