import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DocumentTextIcon,
  PhotoIcon,
  TagIcon,
  CalendarIcon,
  GlobeAltIcon,
  SparklesIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Article {
  _id?: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  author: string;
  imageUrl?: string;
  publishedAt?: string;
  url?: string;
  isAIGenerated?: boolean;
  status: 'draft' | 'published' | 'archived';
}

interface ArticleEditorProps {
  onSave?: (article: Article) => void;
  onCancel?: () => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ onSave, onCancel }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [article, setArticle] = useState<Article>({
    title: '',
    content: '',
    summary: '',
    category: 'technology',
    tags: [],
    author: '',
    status: 'draft'
  });
  const [newTag, setNewTag] = useState('');
  const [aiAssistMode, setAiAssistMode] = useState(false);

  const categories = [
    'technology', 'business', 'health', 'science', 'entertainment',
    'sports', 'politics', 'education', 'lifestyle', 'finance'
  ];

  useEffect(() => {
    if (id && id !== 'new') {
      loadArticle(id);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content/articles/${articleId}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data);
      } else {
        toast.error('Failed to load article');
      }
    } catch (error) {
      console.error('Error loading article:', error);
      toast.error('Error loading article');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!article.title.trim() || !article.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      const method = article._id ? 'PUT' : 'POST';
      const url = article._id ? `/api/content/articles/${article._id}` : '/api/content/articles';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(article)
      });

      if (response.ok) {
        const savedArticle = await response.json();
        toast.success(article._id ? 'Article updated' : 'Article created');

        if (onSave) {
          onSave(savedArticle);
        } else {
          navigate('/content');
        }
      } else {
        throw new Error('Failed to save article');
      }
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleAIAssist = async () => {
    if (!article.title.trim()) {
      toast.error('Please enter a title first');
      return;
    }

    setAiAssistMode(true);
    try {
      const response = await fetch('/api/content/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: article.title,
          category: article.category,
          action: 'generate_content'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setArticle(prev => ({
          ...prev,
          content: data.content,
          summary: data.summary,
          tags: [...prev.tags, ...data.suggestedTags.filter((tag: string) => !prev.tags.includes(tag))],
          isAIGenerated: true
        }));
        toast.success('AI content generated successfully');
      } else {
        throw new Error('AI assist failed');
      }
    } catch (error) {
      console.error('AI assist error:', error);
      toast.error('AI assistance failed');
    } finally {
      setAiAssistMode(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !article.tags.includes(newTag.trim().toLowerCase())) {
      setArticle(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setArticle(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/content');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {article._id ? 'Edit Article' : 'Create New Article'}
          </h1>
          <p className="text-gray-600 mt-2">
            {article._id ? 'Update your article content' : 'Write and publish your own content'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (article._id ? 'Update' : 'Create')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={article.title}
              onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter article title..."
            />
          </div>

          {/* AI Assist */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">AI Writing Assistant</span>
              </div>
              <button
                onClick={handleAIAssist}
                disabled={aiAssistMode || !article.title.trim()}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {aiAssistMode ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Let AI help generate content based on your title and category.
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={article.content}
              onChange={(e) => setArticle(prev => ({ ...prev, content: e.target.value }))}
              rows={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your article content here..."
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary
            </label>
            <textarea
              value={article.summary}
              onChange={(e) => setArticle(prev => ({ ...prev, summary: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief summary of your article..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Status</h3>
            <select
              value={article.status}
              onChange={(e) => setArticle(prev => ({ ...prev, status: e.target.value as Article['status'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Category */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <TagIcon className="w-4 h-4 mr-2" />
              Category
            </h3>
            <select
              value={article.category}
              onChange={(e) => setArticle(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Tags</h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add tag..."
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Author */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Author</h3>
            <input
              type="text"
              value={article.author}
              onChange={(e) => setArticle(prev => ({ ...prev, author: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Author name..."
            />
          </div>

          {/* Image URL */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <PhotoIcon className="w-4 h-4 mr-2" />
              Featured Image
            </h3>
            <input
              type="url"
              value={article.imageUrl || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, imageUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          {/* External URL */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <GlobeAltIcon className="w-4 h-4 mr-2" />
              External URL
            </h3>
            <input
              type="url"
              value={article.url || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Link to original source if applicable
            </p>
          </div>

          {/* AI Generated Badge */}
          {article.isAIGenerated && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">AI Generated Content</span>
              </div>
              <p className="text-xs text-purple-700 mt-1">
                This content was generated with AI assistance
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;