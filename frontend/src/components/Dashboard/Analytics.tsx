import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsProps {
  data: {
    overview: {
      totalNewsletters: number;
      totalSubscribers: number;
      paidSubscribers: number;
      freeSubscribers: number;
      totalPosts: number;
      publishedPosts: number;
    };
    metrics: {
      totalOpens: number;
      totalUniqueOpens: number;
      totalClicks: number;
      totalUniqueClicks: number;
      totalRevenue: number;
      totalUnsubscribes: number;
      emailsSent: number;
    };
    subscriberGrowth: Array<{
      _id: string;
      count: number;
    }>;
    topPosts: Array<{
      _id: string;
      title: string;
      uniqueOpens: number;
      uniqueClicks: number;
      publishedAt: string;
    }>;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const Analytics: React.FC<AnalyticsProps> = ({ data }) => {
  const { overview, metrics, subscriberGrowth, topPosts } = data;

  // Calculate rates
  const openRate = metrics.emailsSent > 0 ? ((metrics.totalUniqueOpens / metrics.emailsSent) * 100).toFixed(1) : '0';
  const clickRate = metrics.totalUniqueOpens > 0 ? ((metrics.totalUniqueClicks / metrics.totalUniqueOpens) * 100).toFixed(1) : '0';
  const unsubscribeRate = metrics.emailsSent > 0 ? ((metrics.totalUnsubscribes / metrics.emailsSent) * 100).toFixed(2) : '0';

  // Prepare subscriber type data for pie chart
  const subscriberTypeData = [
    { name: 'Free Subscribers', value: overview.freeSubscribers, color: COLORS[0] },
    { name: 'Paid Subscribers', value: overview.paidSubscribers, color: COLORS[1] }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Subscribers</h3>
          <p className="text-2xl font-bold text-gray-900">{overview.totalSubscribers.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">
            {overview.paidSubscribers} paid, {overview.freeSubscribers} free
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Posts</h3>
          <p className="text-2xl font-bold text-gray-900">{overview.totalPosts}</p>
          <p className="text-xs text-gray-500 mt-1">{overview.publishedPosts} published</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Open Rate</h3>
          <p className="text-2xl font-bold text-green-600">{openRate}%</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.totalUniqueOpens} unique opens</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Click Rate</h3>
          <p className="text-2xl font-bold text-blue-600">{clickRate}%</p>
          <p className="text-xs text-gray-500 mt-1">{metrics.totalUniqueClicks} unique clicks</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscriber Growth Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subscriber Growth (30 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={subscriberGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subscriber Types Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Subscriber Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriberTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {subscriberTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Emails Sent</span>
              <span className="text-sm font-medium">{metrics.emailsSent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Opens</span>
              <span className="text-sm font-medium">{metrics.totalOpens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unique Opens</span>
              <span className="text-sm font-medium">{metrics.totalUniqueOpens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Clicks</span>
              <span className="text-sm font-medium">{metrics.totalClicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unique Clicks</span>
              <span className="text-sm font-medium">{metrics.totalUniqueClicks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unsubscribes</span>
              <span className="text-sm font-medium text-red-600">{metrics.totalUnsubscribes}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Key Rates</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Open Rate</span>
                <span className="text-sm font-medium">{openRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(parseFloat(openRate), 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Click Rate</span>
                <span className="text-sm font-medium">{clickRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(parseFloat(clickRate), 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Unsubscribe Rate</span>
                <span className="text-sm font-medium">{unsubscribeRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${Math.min(parseFloat(unsubscribeRate) * 10, 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total Revenue</span>
                <span className="text-lg font-bold text-green-600">
                  ${metrics.totalRevenue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Posts</h3>
          <div className="space-y-3">
            {topPosts.slice(0, 5).map((post) => (
              <div key={post._id} className="border-l-2 border-blue-500 pl-3">
                <h4 className="text-sm font-medium text-gray-900 truncate">{post.title}</h4>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{post.uniqueOpens} opens</span>
                  <span>{post.uniqueClicks} clicks</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {topPosts.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No published posts yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;