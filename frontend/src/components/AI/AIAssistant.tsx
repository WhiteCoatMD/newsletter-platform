import React, { useState } from 'react';
import { SparklesIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface AIAssistantProps {
  onContentGenerated?: (content: string) => void;
  onSubjectsGenerated?: (subjects: string[]) => void;
  currentContent?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  onContentGenerated,
  onSubjectsGenerated,
  currentContent
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'improve' | 'subjects' | 'analyze'>('generate');

  // Generate Content Tab
  const [generateForm, setGenerateForm] = useState({
    prompt: '',
    tone: 'professional',
    length: 'medium',
    targetAudience: 'general',
    includeIntro: true,
    includeConclusion: true
  });

  // Improve Content Tab
  const [improvementType, setImprovementType] = useState('general');

  const generateContent = async () => {
    if (!generateForm.prompt.trim()) {
      toast.error('Please enter a topic or prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-content', {
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
            includeIntro: generateForm.includeIntro,
            includeConclusion: generateForm.includeConclusion
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        onContentGenerated?.(result.data.content);
        toast.success('Content generated successfully!');
      } else {
        toast.error(result.message || 'Failed to generate content');
      }
    } catch (error) {
      toast.error('Failed to generate content');
      console.error('AI generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSubjects = async () => {
    if (!currentContent?.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: currentContent,
          count: 5
        })
      });

      const result = await response.json();

      if (result.success) {
        onSubjectsGenerated?.(result.data);
        toast.success('Subject lines generated!');
      } else {
        toast.error(result.message || 'Failed to generate subjects');
      }
    } catch (error) {
      toast.error('Failed to generate subject lines');
      console.error('AI subjects error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const improveContent = async () => {
    if (!currentContent?.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/improve-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: currentContent,
          improvementType
        })
      });

      const result = await response.json();

      if (result.success) {
        onContentGenerated?.(result.data.improvedContent);
        toast.success(`Content improved for ${improvementType}!`);
      } else {
        toast.error(result.message || 'Failed to improve content');
      }
    } catch (error) {
      toast.error('Failed to improve content');
      console.error('AI improvement error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeContent = async () => {
    if (!currentContent?.trim()) {
      toast.error('Please add some content first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/analyze-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: currentContent
        })
      });

      const result = await response.json();

      if (result.success) {
        const analysis = result.data;
        const message = `
          Sentiment: ${analysis.sentiment}
          Difficulty: ${analysis.difficulty}
          Engagement Score: ${analysis.engagementScore}/10

          Suggestions:
          ${analysis.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}
        `;

        // Show analysis in a modal or toast (simplified here)
        alert(message);
        toast.success('Content analyzed!');
      } else {
        toast.error(result.message || 'Failed to analyze content');
      }
    } catch (error) {
      toast.error('Failed to analyze content');
      console.error('AI analysis error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: 'generate', label: 'Generate', icon: SparklesIcon },
    { id: 'improve', label: 'Improve', icon: ArrowPathIcon },
    { id: 'subjects', label: 'Subjects', icon: PlusIcon },
    { id: 'analyze', label: 'Analyze', icon: SparklesIcon }
  ];

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
                  ? 'border-blue-500 text-blue-600'
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
                  checked={generateForm.includeIntro}
                  onChange={(e) => setGenerateForm({ ...generateForm, includeIntro: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Introduction</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generateForm.includeConclusion}
                  onChange={(e) => setGenerateForm({ ...generateForm, includeConclusion: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Conclusion</span>
              </label>
            </div>

            <button
              onClick={generateContent}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <div className="loading-spinner"></div>
              ) : (
                <SparklesIcon className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate Content'}</span>
            </button>
          </div>
        )}

        {activeTab === 'improve' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Improvement Focus
              </label>
              <select
                value={improvementType}
                onChange={(e) => setImprovementType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="general">General Improvement</option>
                <option value="engagement">Increase Engagement</option>
                <option value="clarity">Improve Clarity</option>
                <option value="persuasion">More Persuasive</option>
              </select>
            </div>

            <button
              onClick={improveContent}
              disabled={isGenerating || !currentContent}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <div className="loading-spinner"></div>
              ) : (
                <ArrowPathIcon className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Improving...' : 'Improve Content'}</span>
            </button>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate compelling subject lines based on your current content for A/B testing.
            </p>

            <button
              onClick={generateSubjects}
              disabled={isGenerating || !currentContent}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <div className="loading-spinner"></div>
              ) : (
                <PlusIcon className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Generate Subject Lines'}</span>
            </button>
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Get detailed analysis of your content including sentiment, difficulty, and improvement suggestions.
            </p>

            <button
              onClick={analyzeContent}
              disabled={isGenerating || !currentContent}
              className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isGenerating ? (
                <div className="loading-spinner"></div>
              ) : (
                <SparklesIcon className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Analyzing...' : 'Analyze Content'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;