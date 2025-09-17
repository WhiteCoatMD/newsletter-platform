import React from 'react';
import {
  BookOpenIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  SparklesIcon,
  EyeIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const UserManual: React.FC = () => {
  const sections = [
    {
      id: 'getting-started',
      title: '🚀 Getting Started',
      icon: SparklesIcon,
      items: [
        {
          title: 'Welcome!',
          content: 'NewsBuildr helps you create and send newsletters. Think of it like email, but prettier and smarter!'
        },
        {
          title: 'Your First Login',
          content: 'Use the email and password we gave you. Click "Sign in" and you\'re ready to go!'
        },
        {
          title: 'The Main Menu',
          content: 'Look at the left side. You\'ll see buttons like Dashboard, Create, Templates, and more. These take you to different parts of the site.'
        }
      ]
    },
    {
      id: 'creating-content',
      title: '✍️ Making Your Newsletter',
      icon: PencilSquareIcon,
      items: [
        {
          title: 'Step 1: Click "Create"',
          content: 'This opens a writing page where you can type your newsletter.'
        },
        {
          title: 'Step 2: Write Your Content',
          content: 'Type your newsletter like you\'re writing an email. Add pictures, make text bold, or change colors if you want.'
        },
        {
          title: 'Step 3: Save or Send',
          content: 'Click "Save" to keep it for later, or "Send" to email it to your readers right now.'
        }
      ]
    },
    {
      id: 'templates',
      title: '📄 Using Templates',
      icon: DocumentDuplicateIcon,
      items: [
        {
          title: 'What Are Templates?',
          content: 'Templates are like coloring books - they give you a pretty design, and you just fill in your words.'
        },
        {
          title: 'Pick a Template',
          content: 'Go to "Templates" and click on one you like. Then click "Use Template" to start writing.'
        },
        {
          title: 'Smart Templates',
          content: 'Some templates are smart! They automatically add interesting articles based on what your readers like.'
        },
        {
          title: 'Make Your Own',
          content: 'Click "Create Template" to build your own design. Drag and drop boxes to make it perfect!'
        }
      ]
    },
    {
      id: 'dynamic-content',
      title: '🔄 Dynamic Content Boxes',
      icon: SparklesIcon,
      items: [
        {
          title: 'What Are Dynamic Boxes?',
          content: 'These are magic boxes that fill themselves! They automatically add articles, news, or content that your readers will like.'
        },
        {
          title: 'Adding a Dynamic Box',
          content: 'When making a template, click "Dynamic Content" from the box menu. It will add a smart box that updates itself.'
        },
        {
          title: 'Setting Reader Preferences',
          content: 'Tell the box what topics your readers like (Technology, Sports, etc.) and it will find matching articles.'
        },
        {
          title: 'Three Types of Content',
          content: 'Personalized (based on what readers like), Trending (popular right now), or Curated (hand-picked quality).'
        },
        {
          title: 'Preference Boxes',
          content: 'Add a "Preference Manager" box so readers can choose their own topics and interests.'
        }
      ]
    },
    {
      id: 'subscribers',
      title: '👥 Managing Your Readers',
      icon: UsersIcon,
      items: [
        {
          title: 'Who Are Subscribers?',
          content: 'These are people who want to get your newsletters. Like a list of friends who want your updates.'
        },
        {
          title: 'Add New People',
          content: 'Go to "Subscribers" and click "Add" to put in someone\'s email address.'
        },
        {
          title: 'See Your List',
          content: 'You can see everyone who gets your newsletters and remove people if they don\'t want them anymore.'
        }
      ]
    },
    {
      id: 'sending',
      title: '📧 Sending Newsletters',
      icon: EnvelopeIcon,
      items: [
        {
          title: 'Send Right Away',
          content: 'When you finish writing, click "Send Now" to email everyone immediately.'
        },
        {
          title: 'Schedule for Later',
          content: 'Pick a date and time to send later. Great for sending on weekends or holidays!'
        },
        {
          title: 'Test First',
          content: 'Send a test to yourself to make sure it looks good before sending to everyone.'
        }
      ]
    },
    {
      id: 'analytics',
      title: '📊 Checking How You\'re Doing',
      icon: ChartBarIcon,
      items: [
        {
          title: 'See the Numbers',
          content: 'Go to "Analytics" to see how many people opened your newsletter and clicked on links.'
        },
        {
          title: 'What\'s Popular?',
          content: 'Find out which newsletters your readers liked most.'
        },
        {
          title: 'Growing Your List',
          content: 'See how many new people joined your newsletter list.'
        }
      ]
    },
    {
      id: 'community',
      title: '💬 Community Features',
      icon: ChatBubbleLeftRightIcon,
      items: [
        {
          title: 'Talk to Other Users',
          content: 'Share tips and ask questions with other newsletter creators.'
        },
        {
          title: 'Get Help',
          content: 'If you\'re stuck, ask the community for help!'
        },
        {
          title: 'Admin Tools',
          content: 'If you\'re an admin, you can moderate discussions and help keep things friendly.'
        }
      ]
    },
    {
      id: 'settings',
      title: '⚙️ Your Settings',
      icon: Cog6ToothIcon,
      items: [
        {
          title: 'Change Your Info',
          content: 'Update your name, email, or password in "Settings".'
        },
        {
          title: 'Newsletter Preferences',
          content: 'Choose what topics you like so smart templates can pick better content for you.'
        },
        {
          title: 'Logout',
          content: 'Click "Sign out" at the bottom of the menu when you\'re done.'
        }
      ]
    }
  ];

  const quickTips = [
    '💡 Save your work often - click "Save" while writing',
    '🎨 Try different templates to find your style',
    '📱 Your newsletters look good on phones too',
    '🔍 Use the search box to find old newsletters',
    '❓ Stuck? Check the community for help'
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 rounded-2xl shadow-lg">
            <BookOpenIcon className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
          NewsBuildr User Guide
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Everything you need to know to create awesome newsletters!
          This guide is written in simple terms so anyone can understand.
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="bg-blue-50 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ArrowRightIcon className="w-5 h-5 mr-2 text-blue-600" />
          Jump to Section
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className="text-left p-3 bg-white rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <div className="font-medium text-gray-900">{section.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-green-50 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Quick Tips
        </h2>
        <div className="space-y-2">
          {quickTips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-2">
              <span className="text-green-600 font-medium">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-8">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <section.icon className="w-6 h-6 mr-3 text-blue-600" />
                {section.title}
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {section.items.map((item, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Need Help Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 mt-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🤔 Still Need Help?
        </h2>
        <p className="text-gray-700 mb-6 text-lg">
          Don't worry! Everyone learns at their own pace.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-900 mb-2">Ask the Community</h3>
            <p className="text-sm text-gray-600 mb-4">
              Other users are friendly and love to help!
            </p>
            <button
              onClick={() => window.location.href = '/community'}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Community
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">📧</div>
            <h3 className="font-semibold text-gray-900 mb-2">Try It Out</h3>
            <p className="text-sm text-gray-600 mb-4">
              The best way to learn is by trying! Start small.
            </p>
            <button
              onClick={() => window.location.href = '/posts/new'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Newsletter
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-semibold text-gray-900 mb-2">Use Templates</h3>
            <p className="text-sm text-gray-600 mb-4">
              Templates make it easy - just fill in your words!
            </p>
            <button
              onClick={() => window.location.href = '/templates'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Templates
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 pt-8 border-t border-gray-200">
        <p className="text-gray-600">
          📚 This guide covers the basics. You'll discover more features as you explore!
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Remember: There's no wrong way to start. Just begin with one newsletter and have fun! 🎉
        </p>
      </div>
    </div>
  );
};

export default UserManual;