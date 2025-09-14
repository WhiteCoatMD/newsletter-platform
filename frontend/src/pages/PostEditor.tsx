import React, { useState } from 'react';
import NewsletterEditor from '../components/Editor/NewsletterEditor';
import EnhancedAIAssistant from '../components/AI/EnhancedAIAssistant';
import { ArrowLeftIcon, EyeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const PostEditor: React.FC = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);

  const handleContentGenerated = (generatedContent: any) => {
    if (typeof generatedContent === 'string') {
      setContent(generatedContent);
    } else if (generatedContent.content) {
      // Handle structured content from AI
      if (generatedContent.content.title) {
        setTitle(generatedContent.content.title);
      }

      if (generatedContent.content.sections) {
        // Convert sections to HTML
        const htmlContent = generatedContent.content.sections
          .map((section: any) => `<h2>${section.title}</h2><p>${section.content}</p>`)
          .join('\n\n');
        setContent(htmlContent);
      } else {
        setContent(generatedContent.content);
      }
    }
  };

  const handleAudioGenerated = (url: string, metadata: any) => {
    setAudioUrl(url);
  };

  const handleImageGenerated = (imageUrl: string) => {
    setHeroImage(imageUrl);
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
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            <PaperAirplaneIcon className="w-4 h-4" />
            <span>Send</span>
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
            {heroImage && (
              <div className="px-6 pt-4">
                <img
                  src={heroImage}
                  alt="Hero"
                  className="w-full h-48 object-cover rounded-lg"
                />
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
        <div className="lg:col-span-1">
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
  );
};

export default PostEditor;