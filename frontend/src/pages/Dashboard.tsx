import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Analytics from '../components/Dashboard/Analytics';
import { PlusIcon, PaperAirplaneIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/dashboard', {
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
      value: analyticsData.overview?.totalSubscribers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Published Posts',
      value: analyticsData.overview?.publishedPosts || 0,
      icon: PaperAirplaneIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Open Rate',
      value: analyticsData.metrics?.emailsSent > 0
        ? `${((analyticsData.metrics.totalUniqueOpens / analyticsData.metrics.emailsSent) * 100).toFixed(1)}%`
        : '0%',
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2">
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

      {/* Analytics Component */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : analyticsData ? (
        <Analytics data={analyticsData} />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No analytics data available yet</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;