import React, { useState, useEffect } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  Cog6ToothIcon,
  BellIcon,
  TagIcon,
  ClockIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface UserPreferences {
  id?: string;
  userId: string;
  email: string;
  topics: string[];
  contentTypes: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  timePreference: string;
  categories: {
    [key: string]: boolean;
  };
  personalizedContent: boolean;
  marketingEmails: boolean;
  productUpdates: boolean;
  communityDigest: boolean;
}

const PreferenceManager: React.FC<{
  userId?: string;
  embedded?: boolean;
  onClose?: () => void;
}> = ({
  userId = 'current-user',
  embedded = false,
  onClose
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    userId,
    email: 'user@example.com',
    topics: [],
    contentTypes: [],
    frequency: 'weekly',
    timePreference: '09:00',
    categories: {},
    personalizedContent: true,
    marketingEmails: false,
    productUpdates: true,
    communityDigest: true
  });

  const [activeTab, setActiveTab] = useState<'topics' | 'frequency' | 'types' | 'privacy'>('topics');

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem(`user-preferences-${userId}`);
    if (savedPreferences) {
      const parsed = JSON.parse(savedPreferences);
      setPreferences(prev => ({ ...prev, ...parsed }));
    }
  }, [userId]);

  const availableTopics = [
    { id: 'technology', name: 'Technology', icon: '💻', description: 'Latest tech trends, gadgets, and innovations' },
    { id: 'business', name: 'Business', icon: '💼', description: 'Market insights, startup news, and business strategies' },
    { id: 'health', name: 'Health & Wellness', icon: '🏥', description: 'Health tips, medical breakthroughs, and wellness advice' },
    { id: 'science', name: 'Science', icon: '🔬', description: 'Research discoveries, space exploration, and scientific studies' },
    { id: 'politics', name: 'Politics', icon: '🏛️', description: 'Political news, policy updates, and government affairs' },
    { id: 'sports', name: 'Sports', icon: '⚽', description: 'Sports news, scores, and athletic achievements' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', description: 'Movies, music, celebrities, and pop culture' },
    { id: 'finance', name: 'Finance', icon: '💰', description: 'Investment tips, market analysis, and financial news' },
    { id: 'education', name: 'Education', icon: '📚', description: 'Learning resources, educational news, and academic insights' },
    { id: 'environment', name: 'Environment', icon: '🌍', description: 'Climate change, sustainability, and environmental news' }
  ];

  const contentTypes = [
    { id: 'articles', name: 'Articles', icon: '📰', description: 'In-depth articles and analysis' },
    { id: 'news', name: 'Breaking News', icon: '⚡', description: 'Latest breaking news and updates' },
    { id: 'tutorials', name: 'Tutorials', icon: '🎓', description: 'How-to guides and educational content' },
    { id: 'videos', name: 'Videos', icon: '📹', description: 'Video content and multimedia' },
    { id: 'podcasts', name: 'Podcasts', icon: '🎧', description: 'Audio content and podcast episodes' },
    { id: 'interviews', name: 'Interviews', icon: '🎤', description: 'Expert interviews and conversations' },
    { id: 'reviews', name: 'Reviews', icon: '⭐', description: 'Product and service reviews' },
    { id: 'research', name: 'Research', icon: '📊', description: 'Research papers and data analysis' }
  ];

  const toggleTopic = (topicId: string) => {
    setPreferences(prev => ({
      ...prev,
      topics: prev.topics.includes(topicId)
        ? prev.topics.filter(t => t !== topicId)
        : [...prev.topics, topicId],
      categories: {
        ...prev.categories,
        [topicId]: !prev.categories[topicId]
      }
    }));
  };

  const toggleContentType = (typeId: string) => {
    setPreferences(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(typeId)
        ? prev.contentTypes.filter(t => t !== typeId)
        : [...prev.contentTypes, typeId]
    }));
  };

  const updateFrequency = (frequency: UserPreferences['frequency']) => {
    setPreferences(prev => ({ ...prev, frequency }));
  };

  const updateTimePreference = (time: string) => {
    setPreferences(prev => ({ ...prev, timePreference: time }));
  };

  const savePreferences = () => {
    // Save to localStorage
    localStorage.setItem(`user-preferences-${userId}`, JSON.stringify(preferences));

    // In a real app, this would also save to the backend
    // await saveUserPreferences(preferences);

    toast.success('Preferences saved successfully!');

    if (onClose) {
      onClose();
    }
  };

  const resetPreferences = () => {
    const defaultPrefs: UserPreferences = {
      userId,
      email: preferences.email,
      topics: [],
      contentTypes: [],
      frequency: 'weekly',
      timePreference: '09:00',
      categories: {},
      personalizedContent: true,
      marketingEmails: false,
      productUpdates: true,
      communityDigest: true
    };

    setPreferences(defaultPrefs);
    toast.success('Preferences reset to defaults');
  };

  const getSelectedCount = () => {
    return preferences.topics.length + preferences.contentTypes.length;
  };

  const tabs = [
    { id: 'topics', name: 'Topics', icon: TagIcon },
    { id: 'types', name: 'Content Types', icon: EnvelopeIcon },
    { id: 'frequency', name: 'Frequency', icon: ClockIcon },
    { id: 'privacy', name: 'Privacy', icon: Cog6ToothIcon }
  ];

  const containerClasses = embedded
    ? "bg-white border border-gray-200 rounded-lg"
    : "max-w-4xl mx-auto bg-white shadow-lg rounded-lg";

  return (
    <div className={containerClasses}>
      {!embedded && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Cog6ToothIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Newsletter Preferences</h2>
              <p className="text-sm text-gray-600">
                Customize your newsletter experience with {getSelectedCount()} preferences selected
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{name}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Topics Tab */}
        {activeTab === 'topics' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Choose Your Interests</h3>
              <p className="text-gray-600">
                Select topics you're interested in to receive personalized content recommendations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTopics.map((topic) => (
                <div
                  key={topic.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    preferences.topics.includes(topic.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleTopic(topic.id)}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={preferences.topics.includes(topic.id)}
                        onChange={() => toggleTopic(topic.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{topic.icon}</span>
                        <h4 className="font-medium text-gray-900">{topic.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Types Tab */}
        {activeTab === 'types' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Content Types</h3>
              <p className="text-gray-600">
                Choose what types of content you'd like to receive in your newsletters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentTypes.map((type) => (
                <div
                  key={type.id}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    preferences.contentTypes.includes(type.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleContentType(type.id)}
                >
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={preferences.contentTypes.includes(type.id)}
                        onChange={() => toggleContentType(type.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{type.icon}</span>
                        <h4 className="font-medium text-gray-900">{type.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frequency Tab */}
        {activeTab === 'frequency' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Frequency</h3>
              <p className="text-gray-600">
                How often would you like to receive newsletters?
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { value: 'daily', label: 'Daily', description: 'Receive updates every day' },
                { value: 'weekly', label: 'Weekly', description: 'Receive a digest once per week' },
                { value: 'monthly', label: 'Monthly', description: 'Receive a monthly summary' }
              ].map((option) => (
                <div
                  key={option.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    preferences.frequency === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateFrequency(option.value as any)}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      checked={preferences.frequency === option.value}
                      onChange={() => updateFrequency(option.value as any)}
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

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Preferred Time</h4>
              <div className="flex items-center space-x-3">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={preferences.timePreference}
                  onChange={(e) => updateTimePreference(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Best time to receive emails
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Privacy & Communications</h3>
              <p className="text-gray-600">
                Control what types of emails you receive and how your data is used.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'personalizedContent',
                  label: 'Personalized Content',
                  description: 'Use my preferences to customize newsletter content'
                },
                {
                  key: 'productUpdates',
                  label: 'Product Updates',
                  description: 'Receive notifications about new features and improvements'
                },
                {
                  key: 'communityDigest',
                  label: 'Community Digest',
                  description: 'Weekly summary of community discussions and highlights'
                },
                {
                  key: 'marketingEmails',
                  label: 'Marketing Emails',
                  description: 'Promotional content and special offers'
                }
              ].map((setting) => (
                <div key={setting.key} className="flex items-start space-x-3">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={preferences[setting.key as keyof UserPreferences] as boolean}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        [setting.key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{setting.label}</h4>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <button
          onClick={resetPreferences}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Reset to Defaults
        </button>

        <div className="flex space-x-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={savePreferences}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <CheckIcon className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferenceManager;