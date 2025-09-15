import React, { useState, useCallback } from 'react';
import { API_BASE_URL } from '../../config';
import {
  SparklesIcon,
  ArrowPathIcon,
  MicrophoneIcon,
  PhotoIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface EnhancedAIAssistantProps {
  onContentGenerated?: (content: any) => void;
  onAudioGenerated?: (audioUrl: string, metadata: any) => void;
  onImageGenerated?: (imageUrl: string) => void;
  currentContent?: string;
  newsletterName?: string;
}

const EnhancedAIAssistant: React.FC<EnhancedAIAssistantProps> = ({
  onContentGenerated,
  onAudioGenerated,
  onImageGenerated,
  currentContent,
  newsletterName
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'improve' | 'audio' | 'seo' | 'personalize' | 'health'>('generate');
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Enhanced generation form
  const [generateForm, setGenerateForm] = useState({
    prompt: '',
    tone: 'professional',
    length: 'medium',
    targetAudience: 'general',
    includeImages: true,
    includeUTM: true,
    includeStructured: true
  });

  // Multi-pass improvement form
  const [improvementForm, setImprovementForm] = useState({
    vertical: 'general' as 'health' | 'finance' | 'general',
    focus: 'engagement' as 'engagement' | 'clarity' | 'persuasion',
    targetLength: 1000
  });

  // Audio form
  const [audioForm, setAudioForm] = useState({
    voice: 'alloy',
    includeIntro: true,
    includeOutro: true
  });

  // SEO form
  const [seoForm, setSeoForm] = useState({
    keywords: '',
    platforms: ['twitter', 'linkedin', 'facebook'],
    includeImages: true
  });

  const generateEnhancedContent = useCallback(async () => {
    if (!generateForm.prompt.trim()) {
      toast.error('Please enter a topic or prompt');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt: generateForm.prompt,
          options: {
            tone: generateForm.tone,
            length: generateForm.length,
            targetAudience: generateForm.targetAudience,
            includeImages: generateForm.includeImages,
            includeUTM: generateForm.includeUTM,
            newsletterName
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }

      if (result.success) {
        onContentGenerated?.(result.data);

        if (result.data.heroImage) {
          onImageGenerated?.(result.data.heroImage.url);
          toast.success('Content and hero image generated!');
        } else {
          toast.success('Enhanced content generated!');
        }

        if (result.data.utmData) {
          toast.success('UTM tracking parameters included!');
        }
      } else {
        toast.error(result.message || 'Failed to generate content');
      }
    } catch (error) {
      toast.error('Failed to generate enhanced content');
      console.error('Enhanced generation error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [generateForm, newsletterName, onContentGenerated, onImageGenerated]);

  const improveContentMultiPass = useCallback(async () => {
    if (!currentContent?.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/improve-multipass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: currentContent,
          options: {
            vertical: improvementForm.vertical,
            focus: improvementForm.focus,
            targetLength: improvementForm.targetLength
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }

      if (result.success) {
        onContentGenerated?.(result.data.finalContent);

        // Show improvement summary
        const passes = result.data.passes.length;
        const complianceScore = result.data.improvements.complianceScore;

        toast.success(`Content improved through ${passes} passes! Compliance score: ${complianceScore}%`);

        if (complianceScore < 80) {
          toast.error('⚠️ Compliance issues detected. Please review the suggestions.');
        }
      } else {
        toast.error(result.message || 'Failed to improve content');
      }
    } catch (error) {
      toast.error('Failed to improve content');
      console.error('Multi-pass improvement error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentContent, improvementForm, onContentGenerated]);

  const createAudioNewsletter = useCallback(async () => {
    if (!currentContent?.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/create-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: currentContent,
          options: audioForm
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }

      if (result.success) {
        onAudioGenerated?.(result.data.audioUrl, {
          duration: result.data.duration,
          voice: result.data.voice,
          wordCount: result.data.wordCount
        });

        const minutes = Math.floor(result.data.duration / 60);
        const seconds = result.data.duration % 60;
        toast.success(`Audio newsletter created! Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        toast.error(result.message || 'Failed to create audio newsletter');
      }
    } catch (error) {
      toast.error('Failed to create audio newsletter');
      console.error('Audio creation error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentContent, audioForm, onAudioGenerated]);

  const generateSEOPackage = useCallback(async () => {
    if (!currentContent?.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setIsProcessing(true);
    try {
      const keywords = seoForm.keywords.split(',').map(k => k.trim()).filter(k => k);

      const response = await fetch(`${API_BASE_URL}/api/ai/seo-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: currentContent,
          keywords,
          options: {
            platforms: seoForm.platforms,
            includeImages: seoForm.includeImages
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }

      if (result.success) {
        // Show SEO data in a modal or update UI
        const seoData = result.data;

        toast.success(`SEO package generated for ${seoForm.platforms.length} platforms!`);

        // You could emit this data to parent component for display
        console.log('SEO Package:', seoData);

        if (seoData.socialImages && Object.keys(seoData.socialImages).length > 0) {
          toast.success('Social media images included!');
        }
      } else {
        toast.error(result.message || 'Failed to generate SEO package');
      }
    } catch (error) {
      toast.error('Failed to generate SEO package');
      console.error('SEO package error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentContent, seoForm]);

  const checkSystemHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }

      if (result.success) {
        setSystemHealth(result.data);
        toast.success('AI system health updated');
      } else {
        toast.error('Failed to check system health');
      }
    } catch (error) {
      toast.error('Failed to check system health');
      console.error('Health check error:', error);
    }
  }, []);

  const tabs = [
    { id: 'generate', label: 'Generate', icon: SparklesIcon, color: 'blue' },
    { id: 'improve', label: 'Improve', icon: ArrowPathIcon, color: 'green' },
    { id: 'audio', label: 'Audio', icon: MicrophoneIcon, color: 'purple' },
    { id: 'seo', label: 'SEO & Social', icon: GlobeAltIcon, color: 'orange' },
    { id: 'health', label: 'Health', icon: ChartBarIcon, color: 'gray' }
  ];

  React.useEffect(() => {
    if (activeTab === 'health') {
      checkSystemHealth();
    }
  }, [activeTab, checkSystemHealth]);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? `border-${tab.color}-500 text-${tab.color}-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'generate' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic or Prompt
              </label>
              <textarea
                value={generateForm.prompt}
                onChange={(e) => setGenerateForm({ ...generateForm, prompt: e.target.value })}
                placeholder="Enter your newsletter topic or detailed prompt..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                <select
                  value={generateForm.tone}
                  onChange={(e) => setGenerateForm({ ...generateForm, tone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                  <option value="conversational">Conversational</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                <select
                  value={generateForm.length}
                  onChange={(e) => setGenerateForm({ ...generateForm, length: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <select
                value={generateForm.targetAudience}
                onChange={(e) => setGenerateForm({ ...generateForm, targetAudience: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="general">General</option>
                <option value="professionals">Professionals</option>
                <option value="entrepreneurs">Entrepreneurs</option>
                <option value="developers">Developers</option>
                <option value="marketers">Marketers</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generateForm.includeImages}
                  onChange={(e) => setGenerateForm({ ...generateForm, includeImages: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Generate Hero Image</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generateForm.includeUTM}
                  onChange={(e) => setGenerateForm({ ...generateForm, includeUTM: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include UTM Tracking</span>
              </label>
            </div>

            <button
              onClick={generateEnhancedContent}
              disabled={isProcessing}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  <PhotoIcon className="w-4 h-4" />
                </>
              )}
              <span>{isProcessing ? 'Generating...' : 'Generate Enhanced Content'}</span>
            </button>
          </div>
        )}

        {activeTab === 'improve' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Multi-Pass AI Improvement</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your content will go through compliance checking, style improvement, and focus-specific enhancement.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry Vertical</label>
                <select
                  value={improvementForm.vertical}
                  onChange={(e) => setImprovementForm({ ...improvementForm, vertical: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="general">General</option>
                  <option value="health">Health & Medical</option>
                  <option value="finance">Finance & Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Focus Area</label>
                <select
                  value={improvementForm.focus}
                  onChange={(e) => setImprovementForm({ ...improvementForm, focus: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="engagement">Increase Engagement</option>
                  <option value="clarity">Improve Clarity</option>
                  <option value="persuasion">More Persuasive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Length (words): {improvementForm.targetLength}
              </label>
              <input
                type="range"
                min="300"
                max="3000"
                step="100"
                value={improvementForm.targetLength}
                onChange={(e) => setImprovementForm({ ...improvementForm, targetLength: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <button
              onClick={improveContentMultiPass}
              disabled={isProcessing || !currentContent}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <div className="loading-spinner"></div>
              ) : (
                <ArrowPathIcon className="w-4 h-4" />
              )}
              <span>{isProcessing ? 'Processing...' : 'Multi-Pass Improvement'}</span>
            </button>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Convert your newsletter to an audio version using AI voice synthesis.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
              <select
                value={audioForm.voice}
                onChange={(e) => setAudioForm({ ...audioForm, voice: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="alloy">Alloy (Neutral)</option>
                <option value="echo">Echo (Male)</option>
                <option value="fable">Fable (British Male)</option>
                <option value="onyx">Onyx (Deep Male)</option>
                <option value="nova">Nova (Female)</option>
                <option value="shimmer">Shimmer (Soft Female)</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={audioForm.includeIntro}
                  onChange={(e) => setAudioForm({ ...audioForm, includeIntro: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Introduction</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={audioForm.includeOutro}
                  onChange={(e) => setAudioForm({ ...audioForm, includeOutro: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Outro</span>
              </label>
            </div>

            <button
              onClick={createAudioNewsletter}
              disabled={isProcessing || !currentContent}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <div className="loading-spinner"></div>
              ) : (
                <MicrophoneIcon className="w-4 h-4" />
              )}
              <span>{isProcessing ? 'Creating Audio...' : 'Create Audio Newsletter'}</span>
            </button>
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate comprehensive SEO metadata and social media content for your newsletter.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={seoForm.keywords}
                onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })}
                placeholder="newsletter, marketing, growth..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Social Platforms</label>
              <div className="space-y-2">
                {['twitter', 'linkedin', 'facebook', 'instagram'].map((platform) => (
                  <label key={platform} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={seoForm.platforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSeoForm({ ...seoForm, platforms: [...seoForm.platforms, platform] });
                        } else {
                          setSeoForm({ ...seoForm, platforms: seoForm.platforms.filter(p => p !== platform) });
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={seoForm.includeImages}
                onChange={(e) => setSeoForm({ ...seoForm, includeImages: e.target.checked })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-700">Generate Social Media Images</span>
            </label>

            <button
              onClick={generateSEOPackage}
              disabled={isProcessing || !currentContent}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <div className="loading-spinner"></div>
              ) : (
                <GlobeAltIcon className="w-4 h-4" />
              )}
              <span>{isProcessing ? 'Generating...' : 'Generate SEO Package'}</span>
            </button>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">AI System Health</h3>
              <button
                onClick={checkSystemHealth}
                className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-md hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>

            {systemHealth ? (
              <div className="space-y-4">
                {/* Provider Health */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Provider Status</h4>
                  <div className="space-y-2">
                    {systemHealth.providerHealth.map((provider: any) => (
                      <div key={provider.provider} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium capitalize">{provider.provider}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${provider.available ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          <span className="text-sm text-gray-600">
                            {(provider.successRate * 100).toFixed(1)}% success
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Analytics */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Task Performance (24h)</h4>
                  <div className="space-y-2">
                    {Object.entries(systemHealth.taskAnalytics).map(([task, stats]: [string, any]) => (
                      <div key={task} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="capitalize">{task.replace('_', ' ')}</span>
                        <span className="text-gray-600">
                          {stats.successful}/{stats.total} ({((stats.successful / stats.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Click refresh to check system health</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAIAssistant;