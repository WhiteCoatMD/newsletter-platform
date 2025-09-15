import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Analytics from '../components/Dashboard/Analytics';
import { API_BASE_URL } from '../config';

const AnalyticsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Track your newsletter performance and audience engagement</p>
      </div>

      {data && <Analytics data={data} />}
    </div>
  );
};

export default AnalyticsPage;