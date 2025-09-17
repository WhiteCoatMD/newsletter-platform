import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ContentBox {
  id: string;
  type: 'text' | 'image' | 'cta' | 'divider' | 'dynamic-content' | 'preference-box';
  title: string;
  content: string;
  settings: {
    backgroundColor?: string;
    textColor?: string;
    alignment?: 'left' | 'center' | 'right';
    fontSize?: 'small' | 'medium' | 'large';
    padding?: string;
    // Dynamic content settings
    contentSource?: 'curated' | 'trending' | 'personalized';
    categories?: string[];
    maxItems?: number;
    // Preference box settings
    preferenceType?: 'topics' | 'frequency' | 'content-type';
  };
}

interface Template {
  id?: string;
  name: string;
  description: string;
  category: string;
  contentBoxes: ContentBox[];
  globalSettings: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    headerImage?: string;
    footerText?: string;
  };
}

const TemplateEditor: React.FC = () => {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template>({
    name: 'New Template',
    description: 'A custom newsletter template',
    category: 'Custom',
    contentBoxes: [
      {
        id: '1',
        type: 'text',
        title: 'Welcome Message',
        content: '<h1>Welcome to our Newsletter!</h1><p>Thank you for subscribing to our updates.</p>',
        settings: {
          backgroundColor: '#ffffff',
          textColor: '#000000',
          alignment: 'center',
          fontSize: 'medium',
          padding: '20px'
        }
      }
    ],
    globalSettings: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      footerText: 'Thanks for reading! You received this email because you subscribed to our newsletter.'
    }
  });

  const [selectedBoxId, setSelectedBoxId] = useState<string | null>('1');
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const contentBoxTypes = [
    { type: 'text', label: 'Text Block', icon: '📝' },
    { type: 'image', label: 'Image Block', icon: '🖼️' },
    { type: 'cta', label: 'Call to Action', icon: '🎯' },
    { type: 'divider', label: 'Divider', icon: '➖' },
    { type: 'dynamic-content', label: 'Dynamic Content', icon: '🔄' },
    { type: 'preference-box', label: 'Preference Manager', icon: '⚙️' }
  ];

  const categories = ['Newsletter', 'Product', 'Event', 'Blog', 'Sales', 'Seasonal', 'Custom'];
  const contentSources = ['curated', 'trending', 'personalized'];
  const preferenceTypes = ['topics', 'frequency', 'content-type'];

  const addContentBox = (type: ContentBox['type']) => {
    const newBox: ContentBox = {
      id: Date.now().toString(),
      type,
      title: getDefaultTitle(type),
      content: getDefaultContent(type),
      settings: getDefaultSettings(type)
    };

    setTemplate(prev => ({
      ...prev,
      contentBoxes: [...prev.contentBoxes, newBox]
    }));

    setSelectedBoxId(newBox.id);
    toast.success(`Added ${type} block`);
  };

  const getDefaultTitle = (type: ContentBox['type']): string => {
    switch (type) {
      case 'text': return 'Text Block';
      case 'image': return 'Image Block';
      case 'cta': return 'Call to Action';
      case 'divider': return 'Divider';
      case 'dynamic-content': return 'Dynamic Content';
      case 'preference-box': return 'Preference Manager';
      default: return 'Content Block';
    }
  };

  const getDefaultContent = (type: ContentBox['type']): string => {
    switch (type) {
      case 'text':
        return '<p>Add your text content here. You can use <strong>bold</strong>, <em>italic</em>, and other formatting.</p>';
      case 'image':
        return '<img src="https://via.placeholder.com/600x300" alt="Placeholder image" style="width: 100%; height: auto;" />';
      case 'cta':
        return '<div style="text-align: center; margin: 20px 0;"><a href="#" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Click Here</a></div>';
      case 'divider':
        return '<hr style="border: none; height: 2px; background: #e5e7eb; margin: 20px 0;" />';
      case 'dynamic-content':
        return '<div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;"><h3>📰 Dynamic Content Block</h3><p>This section will automatically populate with content based on reader preferences.</p><p><strong>Content Source:</strong> Curated articles</p><p><strong>Categories:</strong> Technology, Business</p></div>';
      case 'preference-box':
        return '<div style="background: #dbeafe; padding: 20px; border-radius: 8px; text-align: center;"><h3>⚙️ Preference Manager</h3><p>Readers can customize their newsletter preferences here.</p><button style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Update Preferences</button></div>';
      default:
        return '<p>Content block</p>';
    }
  };

  const getDefaultSettings = (type: ContentBox['type']) => {
    const baseSettings = {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      alignment: 'left' as const,
      fontSize: 'medium' as const,
      padding: '20px'
    };

    switch (type) {
      case 'dynamic-content':
        return {
          ...baseSettings,
          contentSource: 'curated' as const,
          categories: ['Technology', 'Business'],
          maxItems: 3
        };
      case 'preference-box':
        return {
          ...baseSettings,
          preferenceType: 'topics' as const,
          alignment: 'center' as const
        };
      case 'cta':
        return {
          ...baseSettings,
          alignment: 'center' as const
        };
      default:
        return baseSettings;
    }
  };

  const updateContentBox = (id: string, updates: Partial<ContentBox>) => {
    setTemplate(prev => ({
      ...prev,
      contentBoxes: (prev.contentBoxes || []).map(box =>
        box.id === id ? { ...box, ...updates } : box
      )
    }));
  };

  const deleteContentBox = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      contentBoxes: prev.contentBoxes.filter(box => box.id !== id)
    }));

    if (selectedBoxId === id) {
      setSelectedBoxId(template.contentBoxes[0]?.id || null);
    }

    toast.success('Content block deleted');
  };

  const moveContentBox = (id: string, direction: 'up' | 'down') => {
    const currentIndex = template.contentBoxes.findIndex(box => box.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= template.contentBoxes.length) return;

    const newBoxes = [...template.contentBoxes];
    [newBoxes[currentIndex], newBoxes[newIndex]] = [newBoxes[newIndex], newBoxes[currentIndex]];

    setTemplate(prev => ({
      ...prev,
      contentBoxes: newBoxes
    }));
  };

  const generateHTML = () => {
    const { globalSettings, contentBoxes } = template;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name}</title>
  <style>
    body {
      font-family: ${globalSettings.fontFamily};
      line-height: 1.6;
      color: ${globalSettings.secondaryColor};
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .content-box {
      margin-bottom: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  ${globalSettings.headerImage ? `<img src="${globalSettings.headerImage}" alt="Header" style="width: 100%; height: auto; margin-bottom: 20px;" />` : ''}

  ${(contentBoxes || []).map(box => `
    <div class="content-box" style="
      background-color: ${box.settings.backgroundColor || '#ffffff'};
      color: ${box.settings.textColor || '#000000'};
      text-align: ${box.settings.alignment || 'left'};
      padding: ${box.settings.padding || '20px'};
      font-size: ${box.settings.fontSize === 'small' ? '14px' : box.settings.fontSize === 'large' ? '18px' : '16px'};
    ">
      ${box.content}
    </div>
  `).join('')}

  ${globalSettings.footerText ? `
    <div class="footer">
      <p>${globalSettings.footerText}</p>
    </div>
  ` : ''}
</body>
</html>`;

    return htmlContent;
  };

  const saveTemplate = () => {
    try {
      // Validate template data
      if (!template.name || !template.name.trim()) {
        toast.error('Template name is required');
        return;
      }

      if (!template.contentBoxes || template.contentBoxes.length === 0) {
        toast.error('Template must have at least one content box');
        return;
      }

      // In a real app, this would save to the backend
      const templateData = {
        ...template,
        id: template.id || Date.now().toString(),
        createdAt: template.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: false,
        isFavorite: false,
        usageCount: 0,
        contentBoxes: template.contentBoxes || []
      };

      // Save to localStorage for now
      const existingTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]');
      const updatedTemplates = template.id
        ? existingTemplates.map((t: any) => t.id === template.id ? templateData : t)
        : [...existingTemplates, templateData];

      localStorage.setItem('customTemplates', JSON.stringify(updatedTemplates));

      toast.success(`Template "${template.name}" saved successfully!`);
      // Add a small delay before navigation to ensure toast is shown
      setTimeout(() => navigate('/templates'), 500);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template. Please try again.');
    }
  };

  const selectedBox = (template.contentBoxes || []).find(box => box.id === selectedBoxId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Editor</h1>
            <p className="text-gray-600 mt-2">Create and customize your newsletter template</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <EyeIcon className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={saveTemplate}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              <span>Save Template</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Template Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Template Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={template.description}
                    onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={template.category}
                    onChange={(e) => setTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={template.globalSettings.primaryColor}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      globalSettings: { ...prev.globalSettings, primaryColor: e.target.value }
                    }))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Add Content Blocks */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Content Blocks</h3>

              <div className="space-y-2">
                {contentBoxTypes.map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => addContentBox(type as ContentBox['type'])}
                    className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm font-medium">{label}</span>
                    <PlusIcon className="w-4 h-4 ml-auto text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Content Blocks List */}
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-lg font-medium text-gray-900">Content Blocks</h3>
              </div>

              <div className="p-4 space-y-3">
                {(template.contentBoxes || []).map((box, index) => (
                  <div
                    key={box.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedBoxId === box.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedBoxId(box.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{box.title}</h4>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveContentBox(box.id, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveContentBox(box.id, 'down');
                          }}
                          disabled={index === template.contentBoxes.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ArrowDownIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteContentBox(box.id);
                          }}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      Type: <span className="capitalize">{box.type.replace('-', ' ')}</span>
                    </div>

                    <div
                      className="prose prose-sm max-w-none border border-gray-100 rounded p-2 bg-gray-50"
                      dangerouslySetInnerHTML={{ __html: box.content.substring(0, 150) + (box.content.length > 150 ? '...' : '') }}
                    />
                  </div>
                ))}

                {template.contentBoxes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No content blocks yet. Add some from the sidebar!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="lg:col-span-1">
            {selectedBox && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Block Settings</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={selectedBox.title}
                      onChange={(e) => updateContentBox(selectedBox.id, { title: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={selectedBox.content}
                      onChange={(e) => updateContentBox(selectedBox.id, { content: e.target.value })}
                      rows={6}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={selectedBox.settings.backgroundColor || '#ffffff'}
                      onChange={(e) => updateContentBox(selectedBox.id, {
                        settings: { ...selectedBox.settings, backgroundColor: e.target.value }
                      })}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Alignment</label>
                    <select
                      value={selectedBox.settings.alignment || 'left'}
                      onChange={(e) => updateContentBox(selectedBox.id, {
                        settings: { ...selectedBox.settings, alignment: e.target.value as 'left' | 'center' | 'right' }
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  {/* Dynamic Content Settings */}
                  {selectedBox.type === 'dynamic-content' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content Source</label>
                        <select
                          value={selectedBox.settings.contentSource || 'curated'}
                          onChange={(e) => updateContentBox(selectedBox.id, {
                            settings: { ...selectedBox.settings, contentSource: e.target.value as 'curated' | 'trending' | 'personalized' }
                          })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="curated">Curated Content</option>
                          <option value="trending">Trending Articles</option>
                          <option value="personalized">Personalized Based on Preferences</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Items</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={selectedBox.settings.maxItems || 3}
                          onChange={(e) => updateContentBox(selectedBox.id, {
                            settings: { ...selectedBox.settings, maxItems: parseInt(e.target.value) }
                          })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                        <div className="space-y-2">
                          {['Technology', 'Business', 'Health', 'Science', 'Politics', 'Sports', 'Entertainment'].map(category => (
                            <label key={category} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedBox.settings.categories?.includes(category) || false}
                                onChange={(e) => {
                                  const categories = selectedBox.settings.categories || [];
                                  const newCategories = e.target.checked
                                    ? [...categories, category]
                                    : categories.filter(c => c !== category);
                                  updateContentBox(selectedBox.id, {
                                    settings: { ...selectedBox.settings, categories: newCategories }
                                  });
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">{category}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Preference Box Settings */}
                  {selectedBox.type === 'preference-box' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preference Type</label>
                      <select
                        value={selectedBox.settings.preferenceType || 'topics'}
                        onChange={(e) => updateContentBox(selectedBox.id, {
                          settings: { ...selectedBox.settings, preferenceType: e.target.value as 'topics' | 'frequency' | 'content-type' }
                        })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="topics">Topic Preferences</option>
                        <option value="frequency">Email Frequency</option>
                        <option value="content-type">Content Type Preferences</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Template Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: generateHTML() }}
                />
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;