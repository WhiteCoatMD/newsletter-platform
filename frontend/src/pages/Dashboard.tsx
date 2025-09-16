import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PaperAirplaneIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/test/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      return result.data;
    }
  });

  const quickStats = analyticsData ? [
    {
      name: 'Total Subscribers',
      value: analyticsData.subscribers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Emails Sent',
      value: analyticsData.emailsSent || 0,
      icon: PaperAirplaneIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Open Rate',
      value: analyticsData.openRate ? `${analyticsData.openRate}%` : '0%',
      icon: ChartBarIcon,
      color: 'bg-purple-500'
    }
  ] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome back! Here's your newsletter performance.</p>
          </div>
          <button
            onClick={() => navigate('/posts/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {quickStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickStats.map((stat) => (
            <div key={stat.name} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Emails */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : analyticsData?.recentEmails ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Recent Emails</h2>
          </div>
          <div className="divide-y">
            {analyticsData.recentEmails.map((email: any) => (
              <div key={email.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{email.subject}</h3>
                    <p className="text-sm text-gray-500">
                      Sent {new Date(email.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-green-600">{email.openRate}% opens</span>
                    <span className="text-blue-600">{email.clickRate}% clicks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No recent emails available</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;