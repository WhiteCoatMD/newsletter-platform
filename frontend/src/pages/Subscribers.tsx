import React, { useState } from 'react';
import {
  UserGroupIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  CreditCardIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Subscriber {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive' | 'unsubscribed';
  subscriptionType: 'free' | 'paid';
  subscribedAt: string;
  lastEmailOpened: string | null;
  totalOpens: number;
  totalClicks: number;
  tags: string[];
}

const Subscribers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'unsubscribed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);

  // Mock data - in real app this would come from API
  const mockSubscribers: Subscriber[] = [
    {
      id: '1',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      status: 'active',
      subscriptionType: 'paid',
      subscribedAt: '2024-01-15T10:30:00Z',
      lastEmailOpened: '2024-12-01T14:22:00Z',
      totalOpens: 47,
      totalClicks: 12,
      tags: ['vip', 'engaged']
    },
    {
      id: '2',
      email: 'sarah.wilson@company.com',
      firstName: 'Sarah',
      lastName: 'Wilson',
      status: 'active',
      subscriptionType: 'free',
      subscribedAt: '2024-03-20T08:15:00Z',
      lastEmailOpened: '2024-11-28T09:45:00Z',
      totalOpens: 23,
      totalClicks: 5,
      tags: ['newsletter-enthusiast']
    },
    {
      id: '3',
      email: 'mike.chen@startup.io',
      firstName: 'Mike',
      lastName: 'Chen',
      status: 'active',
      subscriptionType: 'paid',
      subscribedAt: '2024-02-08T16:45:00Z',
      lastEmailOpened: '2024-12-02T11:30:00Z',
      totalOpens: 89,
      totalClicks: 34,
      tags: ['power-user', 'early-adopter']
    },
    {
      id: '4',
      email: 'inactive@email.com',
      firstName: 'Jane',
      lastName: 'Smith',
      status: 'inactive',
      subscriptionType: 'free',
      subscribedAt: '2024-01-10T12:00:00Z',
      lastEmailOpened: '2024-08-15T10:20:00Z',
      totalOpens: 3,
      totalClicks: 0,
      tags: []
    }
  ];

  const filteredSubscribers = mockSubscribers.filter(subscriber => {
    const matchesSearch =
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.lastName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || subscriber.status === statusFilter;
    const matchesType = typeFilter === 'all' || subscriber.subscriptionType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: mockSubscribers.length,
    active: mockSubscribers.filter(s => s.status === 'active').length,
    paid: mockSubscribers.filter(s => s.subscriptionType === 'paid').length,
    free: mockSubscribers.filter(s => s.subscriptionType === 'free').length
  };

  const handleExport = () => {
    toast.success('Exporting subscribers list...');
  };

  const handleImport = () => {
    toast.success('Import functionality would open file picker');
  };

  const handleBulkAction = (action: string) => {
    if (selectedSubscribers.length === 0) {
      toast.error('Please select subscribers first');
      return;
    }
    toast.success(`${action} applied to ${selectedSubscribers.length} subscribers`);
    setSelectedSubscribers([]);
  };

  const toggleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(filteredSubscribers.map(s => s.id));
    }
  };

  const toggleSelectSubscriber = (id: string) => {
    setSelectedSubscribers(prev =>
      prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'inactive':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Inactive</span>;
      case 'unsubscribed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Unsubscribed</span>;
      default:
        return null;
    }
  };

  const getSubscriptionBadge = (type: string) => {
    return type === 'paid' ? (
      <CreditCardIcon className="w-4 h-4 text-blue-600" title="Paid subscriber" />
    ) : (
      <UserIcon className="w-4 h-4 text-gray-400" title="Free subscriber" />
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscribers</h1>
          <p className="text-gray-600 mt-2">Manage your newsletter audience</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleImport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            <PlusIcon className="w-4 h-4" />
            <span>Add Subscriber</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Subscribers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CreditCardIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-gray-900">{stats.paid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UserIcon className="w-8 h-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Free</p>
              <p className="text-2xl font-bold text-gray-900">{stats.free.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search subscribers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {selectedSubscribers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{selectedSubscribers.length} selected</span>
              <button
                onClick={() => handleBulkAction('Tag')}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Tag
              </button>
              <button
                onClick={() => handleBulkAction('Unsubscribe')}
                className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
              >
                Unsubscribe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscriber
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscribed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedSubscribers.includes(subscriber.id)}
                      onChange={() => toggleSelectSubscriber(subscriber.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subscriber.firstName} {subscriber.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{subscriber.email}</div>
                      {subscriber.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {subscriber.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(subscriber.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getSubscriptionBadge(subscriber.subscriptionType)}
                      <span className="text-sm text-gray-900 capitalize">{subscriber.subscriptionType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {subscriber.totalOpens} opens
                    </div>
                    <div className="text-sm text-gray-500">
                      {subscriber.totalClicks} clicks
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(subscriber.subscribedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubscribers.length === 0 && (
          <div className="text-center py-8">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No subscribers found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscribers;