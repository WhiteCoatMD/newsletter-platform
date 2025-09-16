import React, { useState } from 'react';
import NewsletterEditor from '../components/Editor/NewsletterEditor';
import EnhancedAIAssistant from '../components/AI/EnhancedAIAssistant';
import { ArrowLeftIcon, EyeIcon, PaperAirplaneIcon, BookmarkIcon, XMarkIcon, ArrowPathIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

const PostEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newsletterId, setNewsletterId] = useState<string | null>(null);

  // Load template data if available
  React.useEffect(() => {
    const selectedTemplate = localStorage.getItem('selectedTemplate');
    if (selectedTemplate) {
      try {
        const templateData = JSON.parse(selectedTemplate);
        setTitle(templateData.name);
        setContent(templateData.content);
        if (templateData.heroImage) {
          setHeroImage(templateData.heroImage);
        }
        // Clear the template data after loading
        localStorage.removeItem('selectedTemplate');
        toast.success(`Template "${templateData.name}" loaded successfully!`);
      } catch (error) {
        console.error('Error loading template:', error);
        toast.error('Failed to load template');
      }
    }
  }, []);

  const handleContentGenerated = (generatedContent: any) => {
    console.log('Generated content received:', generatedContent);

    if (typeof generatedContent === 'string') {
      setContent(generatedContent);
    } else if (generatedContent) {
      // Handle AI API response structure
      if (generatedContent.title) {
        setTitle(generatedContent.title);
      }

      if (generatedContent.content) {
        setContent(generatedContent.content);
      } else if (typeof generatedContent === 'object' && generatedContent.sections) {
        // Convert sections to HTML
        const htmlContent = generatedContent.sections
          .map((section: any) => `<h2>${section.title}</h2><p>${section.content}</p>`)
          .join('\n\n');
        setContent(htmlContent);
      }
    }
  };

  const handleAudioGenerated = (url: string) => {
    setAudioUrl(url);
  };

  const handleImageGenerated = (imageUrl: string) => {
    setHeroImage(imageUrl);
  };

  const handleRemoveImage = () => {
    setHeroImage(null);
    toast.success('Hero image removed');
  };

  const handleRegenerateImage = async () => {
    if (!title.trim()) {
      toast.error('Please enter a newsletter title first');
      return;
    }

    setIsSaving(true);
    try {
      console.log('Regenerating image with title:', title);

      const response = await fetch(`${API_BASE_URL}/api/ai/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt: title,
          size: '1792x1024',
          style: 'vivid'
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Regenerate image result:', result);

      if (result.success && result.data?.url) {
        setHeroImage(result.data.url);
        toast.success('New hero image generated!');
      } else {
        throw new Error(result.message || 'No image URL returned');
      }
    } catch (error) {
      console.error('Image regeneration error:', error);
      toast.error('Failed to generate new image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setHeroImage(result);
      toast.success('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);

    // Reset the input
    event.target.value = '';
  };

  const handleSave = async (status: 'draft' | 'scheduled' = 'draft') => {
    if (!title.trim()) {
      toast.error('Please enter a newsletter title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please add some content to your newsletter');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletters/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: newsletterId,
          title,
          content,
          status,
          heroImage
        })
      });

      const result = await response.json();

      if (result.success) {
        setNewsletterId(result.data.id);
        toast.success(result.message);
      } else {
        toast.error(result.message || 'Failed to save newsletter');
      }
    } catch (error) {
      toast.error('Failed to save newsletter');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error('Please enter a newsletter title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please add some content to your newsletter');
      return;
    }

    const confirmSend = window.confirm(
      `Are you sure you want to send "${title}" to all subscribers? This action cannot be undone.`
    );

    if (!confirmSend) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletters/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: newsletterId,
          title,
          content,
          recipients: 'all'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        // Optionally redirect to newsletter list or dashboard
        // navigate('/newsletters');
      } else {
        toast.error(result.message || 'Failed to send newsletter');
      }
    } catch (error) {
      toast.error('Failed to send newsletter');
      console.error('Send error:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-900">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Newsletter</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <EyeIcon className="w-4 h-4" />
            <span>{showPreview ? 'Edit' : 'Preview'}</span>
          </button>

          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <BookmarkIcon className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            <span>{isSending ? 'Sending...' : 'Send Now'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Title Input */}
            <div className="p-6 border-b border-gray-200">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Newsletter title..."
                className="w-full text-2xl font-bold border-none outline-none resize-none placeholder-gray-400"
              />
            </div>

            {/* Hero Image */}
            {heroImage ? (
              <div className="px-6 pt-4">
                <div className="relative group">
                  <img
                    src={heroImage}
                    alt="Hero"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleRegenerateImage}
                      disabled={isSaving}
                      className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-lg disabled:opacity-50"
                      title="Regenerate with AI"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                    <label
                      className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 shadow-lg cursor-pointer"
                      title="Upload your own image"
                    >
                      <PhotoIcon className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={handleRemoveImage}
                      className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 shadow-lg"
                      title="Remove image"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 pt-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Add a hero image to your newsletter</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={handleRegenerateImage}
                      disabled={isSaving || !title.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      <span>{isSaving ? 'Generating...' : 'Generate with AI'}</span>
                    </button>
                    <label className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 cursor-pointer flex items-center space-x-2">
                      <PhotoIcon className="w-4 h-4" />
                      <span>Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {!title.trim() && (
                    <p className="text-xs text-gray-400 mt-2">Enter a title to generate an AI image</p>
                  )}
                </div>
              </div>
            )}

            {/* Content Editor */}
            <div className="p-6">
              {showPreview ? (
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
              ) : (
                <NewsletterEditor
                  initialContent={content}
                  onChange={setContent}
                  placeholder="Start writing your newsletter..."
                />
              )}
            </div>

            {/* Audio Player */}
            {audioUrl && (
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Audio Version</h3>
                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Sidebar */}
        <div className="lg:col-span-1 min-w-0">
          <div className="sticky top-4">
            <EnhancedAIAssistant
              onContentGenerated={handleContentGenerated}
              onAudioGenerated={handleAudioGenerated}
              onImageGenerated={handleImageGenerated}
              currentContent={content}
              newsletterName="My Newsletter"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;