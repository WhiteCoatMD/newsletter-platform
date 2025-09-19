import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentDuplicateIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  TagIcon,
  StarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  content: string;
  isDefault: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  tags: string[];
  contentBoxes?: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    settings: any;
  }>;
}

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);

  // Load custom templates from localStorage
  React.useEffect(() => {
    try {
      const savedTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      console.log('Loaded custom templates:', savedTemplates);
      // Ensure all templates have required properties
      const validTemplates = (savedTemplates || []).map((template: any) => ({
        ...template,
        tags: template.tags || [],
        contentBoxes: template.contentBoxes || []
      }));
      setCustomTemplates(validTemplates);
    } catch (error) {
      console.error('Error loading custom templates:', error);
      setCustomTemplates([]);
    }
  }, []);

  const mockTemplates: Template[] = [
    {
      id: '1',
      name: 'Weekly Newsletter',
      description: 'Clean and professional weekly newsletter template with header, featured content, and CTA sections.',
      category: 'Newsletter',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop',
      content: `<h1>Weekly Newsletter</h1>
<p>Welcome to this week's edition of our newsletter!</p>

<h2>🔥 Featured Content</h2>
<p>This week we're highlighting the most important updates and insights from our community.</p>

<h2>📚 What We're Reading</h2>
<ul>
<li>Industry trends and analysis</li>
<li>Expert opinions and insights</li>
<li>Community highlights</li>
</ul>

<h2>💼 Business Updates</h2>
<p>Here are the latest developments in our industry that you should know about.</p>

<div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h3>💡 Quick Tip</h3>
<p>Here's a practical tip you can implement this week to improve your workflow.</p>
</div>

<p><strong>Thanks for reading!</strong> We'll see you next week.</p>`,
      isDefault: true,
      isFavorite: true,
      usageCount: 47,
      createdAt: '2024-01-15T10:30:00Z',
      tags: ['newsletter', 'weekly', 'professional']
    },
    {
      id: '2',
      name: 'Product Update',
      description: 'Perfect for announcing new features, product launches, and company updates.',
      category: 'Product',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop',
      content: `<h1>🚀 Exciting Product Updates</h1>
<p>We're thrilled to share some major improvements to our platform!</p>

<h2>✨ New Features</h2>
<ul>
<li><strong>Enhanced Dashboard:</strong> New analytics and insights</li>
<li><strong>Mobile App:</strong> Now available on iOS and Android</li>
<li><strong>API Updates:</strong> Faster performance and new endpoints</li>
</ul>

<h2>🔧 Improvements</h2>
<p>Based on your feedback, we've made several key improvements:</p>
<ul>
<li>Faster loading times</li>
<li>Better user interface</li>
<li>Enhanced security features</li>
</ul>

<div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
<h3>📅 Coming Soon</h3>
<p>Keep an eye out for these upcoming features in the next release.</p>
</div>

<p><a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Try New Features</a></p>`,
      isDefault: true,
      isFavorite: false,
      usageCount: 23,
      createdAt: '2024-02-01T14:20:00Z',
      tags: ['product', 'announcement', 'features']
    },
    {
      id: '3',
      name: 'Event Invitation',
      description: 'Engaging template for webinars, conferences, and special events.',
      category: 'Event',
      thumbnail: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&h=200&fit=crop',
      content: `<h1>🎉 You're Invited!</h1>
<p>Join us for an exclusive event that you won't want to miss.</p>

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
<h2 style="color: white; margin: 0 0 10px 0;">Annual Conference 2024</h2>
<p style="margin: 0; font-size: 18px;">Innovation, Growth, and Success</p>
</div>

<h2>📅 Event Details</h2>
<ul>
<li><strong>Date:</strong> March 15, 2024</li>
<li><strong>Time:</strong> 9:00 AM - 5:00 PM PST</li>
<li><strong>Location:</strong> Virtual & In-Person</li>
<li><strong>Speakers:</strong> Industry leaders and experts</li>
</ul>

<h2>🎯 What You'll Learn</h2>
<ul>
<li>Latest industry trends</li>
<li>Networking opportunities</li>
<li>Hands-on workshops</li>
<li>Expert panels and Q&A</li>
</ul>

<div style="text-align: center; margin: 30px 0;">
<a href="#" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Register Now</a>
</div>

<p><em>Early bird pricing ends soon!</em></p>`,
      isDefault: true,
      isFavorite: true,
      usageCount: 15,
      createdAt: '2024-02-10T09:15:00Z',
      tags: ['event', 'invitation', 'webinar']
    },
    {
      id: '4',
      name: 'Minimal Blog',
      description: 'Simple, content-focused template perfect for blog posts and articles.',
      category: 'Blog',
      thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&h=200&fit=crop',
      content: `<h1>The Art of Minimalism</h1>
<p><em>Published on March 1, 2024</em></p>

<p>In a world filled with distractions, minimalism offers a path to clarity and focus.</p>

<h2>What is Minimalism?</h2>
<p>Minimalism is about removing the unnecessary to focus on what truly matters. It's not about having less for the sake of having less, but about making room for what brings value to your life.</p>

<blockquote style="border-left: 3px solid #e5e7eb; padding-left: 20px; margin: 20px 0; font-style: italic; color: #6b7280;">
"The secret of getting ahead is getting started. The secret of getting started is breaking your complex overwhelming tasks into small manageable tasks, and starting on the first one."
</blockquote>

<h2>Benefits of Minimalist Living</h2>
<ul>
<li>Reduced stress and anxiety</li>
<li>More time for meaningful activities</li>
<li>Better focus and productivity</li>
<li>Financial freedom</li>
</ul>

<h2>Getting Started</h2>
<p>Start small. Choose one area of your life and begin removing what doesn't serve you. Whether it's your workspace, your schedule, or your possessions, the key is to begin.</p>

<p>Remember: minimalism looks different for everyone. Find what works for you.</p>`,
      isDefault: false,
      isFavorite: false,
      usageCount: 8,
      createdAt: '2024-02-20T16:45:00Z',
      tags: ['blog', 'minimal', 'article']
    },
    {
      id: '5',
      name: 'Sales Pitch',
      description: 'Conversion-focused template for sales emails and promotional content.',
      category: 'Sales',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop',
      content: `<h1>🎯 Double Your Productivity in 30 Days</h1>
<p>Are you tired of feeling overwhelmed and behind on your goals?</p>

<div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b;">
<h3 style="color: #92400e; margin-top: 0;">⚡ Limited Time Offer</h3>
<p style="margin-bottom: 0; color: #92400e;">Get 50% off our productivity masterclass - only 48 hours left!</p>
</div>

<h2>What You'll Get:</h2>
<ul>
<li>✅ 30-day productivity challenge</li>
<li>✅ Weekly coaching calls</li>
<li>✅ Exclusive planning templates</li>
<li>✅ Private community access</li>
<li>✅ Money-back guarantee</li>
</ul>

<h2>🏆 Proven Results</h2>
<p>Over 10,000 professionals have used our system to:</p>
<ul>
<li>Increase focus by 75%</li>
<li>Complete projects 40% faster</li>
<li>Reduce stress and overwhelm</li>
<li>Achieve work-life balance</li>
</ul>

<div style="background: #dcfce7; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
<h3 style="color: #166534; margin-top: 0;">Special Launch Price</h3>
<p style="font-size: 24px; font-weight: bold; color: #166534; margin: 10px 0;"><strike style="color: #6b7280;">$297</strike> Only $147</p>
<a href="#" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block;">Get Instant Access</a>
<p style="margin: 10px 0 0 0; color: #374151; font-size: 14px;">30-day money-back guarantee</p>
</div>

<p><strong>Don't let another month pass feeling unproductive.</strong> Take action now!</p>`,
      isDefault: false,
      isFavorite: true,
      usageCount: 31,
      createdAt: '2024-03-01T11:30:00Z',
      tags: ['sales', 'conversion', 'promotional']
    },
    {
      id: '6',
      name: 'Holiday Special',
      description: 'Festive template for holiday campaigns and seasonal promotions.',
      category: 'Seasonal',
      thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=300&h=200&fit=crop',
      content: `<div style="background: linear-gradient(135deg, #dc2626 0%, #166534 100%); color: white; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
<h1 style="color: white; margin: 0; font-size: 32px;">🎄 Happy Holidays!</h1>
<p style="margin: 10px 0 0 0; font-size: 18px;">Wishing you joy, peace, and prosperity</p>
</div>

<h2>🎁 Special Holiday Offers</h2>
<p>To celebrate this wonderful season, we're offering exclusive discounts on all our products!</p>

<div style="display: grid; gap: 20px; margin: 30px 0;">
<div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
<h3 style="color: #dc2626; margin-top: 0;">❄️ Winter Sale</h3>
<p style="font-size: 24px; font-weight: bold; margin: 10px 0;">40% OFF</p>
<p style="margin: 0;">All premium templates</p>
</div>
</div>

<h2>🌟 Year-End Reflection</h2>
<p>As we wrap up another amazing year, we want to thank you for being part of our community. Your support and feedback have helped us grow and improve.</p>

<h2>🎊 Looking Ahead</h2>
<p>2024 is going to be our biggest year yet! We have exciting new features and products planned that we can't wait to share with you.</p>

<div style="background: #166534; color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
<h3 style="color: white; margin-top: 0;">🎅 Holiday Bonus</h3>
<p style="margin: 0 0 15px 0;">Use code <strong>HOLIDAY2024</strong> for an extra 10% off</p>
<a href="#" style="background: white; color: #166534; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Shop Now</a>
</div>

<p style="text-align: center;"><em>From our family to yours, have a wonderful holiday season! 🎄✨</em></p>`,
      isDefault: false,
      isFavorite: false,
      usageCount: 12,
      createdAt: '2024-03-15T13:20:00Z',
      tags: ['holiday', 'seasonal', 'festive']
    }
  ];

  // Combine mock templates with custom templates
  const allTemplates = [...mockTemplates, ...(customTemplates || [])];
  const categories = ['all', ...Array.from(new Set(allTemplates.map(t => t.category)))];

  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesFavorites = !showFavoritesOnly || template.isFavorite;

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const handleUseTemplate = (template: Template) => {
    let templateContent = template.content;

    // If template has contentBoxes (from TemplateEditor), convert them to HTML
    if (template.contentBoxes && template.contentBoxes.length > 0) {
      templateContent = template.contentBoxes.map(box => box.content).join('\n\n');
    }

    // Store template data in localStorage to pass to editor
    localStorage.setItem('selectedTemplate', JSON.stringify({
      name: template.name,
      content: templateContent,
      heroImage: template.thumbnail
    }));

    // Navigate to post editor
    navigate('/posts/new');
    toast.success(`Loading template: ${template.name}`);
  };

  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleEditTemplate = (template: Template) => {
    if (template.isDefault) {
      toast.error('Cannot edit default templates. Create a copy first.');
      return;
    }
    toast.success(`Editing template: ${template.name}`);
  };

  const handleDeleteTemplate = (template: Template) => {
    if (template.isDefault) {
      toast.error('Cannot delete default templates.');
      return;
    }
    toast.success(`Template "${template.name}" deleted`);
  };

  const handleToggleFavorite = (template: Template) => {
    toast.success(
      template.isFavorite
        ? `Removed "${template.name}" from favorites`
        : `Added "${template.name}" to favorites`
    );
  };

  const handleCreateTemplate = () => {
    navigate('/templates/create');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-2">Choose from professional newsletter templates</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/templates/demo')}
            className="flex items-center space-x-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50"
          >
            <EyeIcon className="w-4 h-4" />
            <span>Dynamic Demo</span>
          </button>
          <button
            onClick={handleCreateTemplate}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Template</span>
          </button>
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
                placeholder="Search templates..."
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
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Favorites only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            {/* Template Thumbnail */}
            <div className="relative h-48 bg-gray-100">
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                {template.isDefault && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Default
                  </span>
                )}
                <button
                  onClick={() => handleToggleFavorite(template)}
                  className="p-1 bg-white rounded-full shadow-sm hover:bg-gray-50"
                >
                  {template.isFavorite ? (
                    <StarIconSolid className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <StarIcon className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Template Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {template.category}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Tags */}
              {(template.tags && template.tags.length > 0) && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {(template.tags || []).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{template.tags.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Usage Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>Used {template.usageCount} times</span>
                <span>{new Date(template.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center space-x-1"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  <span>Use Template</span>
                </button>

                <button
                  onClick={() => handlePreviewTemplate(template)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  title="Preview"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>

                {!template.isDefault && (
                  <>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteTemplate(template)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <DocumentDuplicateIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search criteria or create a new template.</p>
          <button
            onClick={handleCreateTemplate}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Your First Template
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewTemplate.name}</h3>
                <p className="text-sm text-gray-500">{previewTemplate.description}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{
                  __html: previewTemplate.contentBoxes && previewTemplate.contentBoxes.length > 0
                    ? previewTemplate.contentBoxes.map(box => box.content).join('\n\n')
                    : previewTemplate.content
                }} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Category: {previewTemplate.category}</span>
                <span>Used {previewTemplate.usageCount} times</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleUseTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;