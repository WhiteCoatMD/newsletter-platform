import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  TrashIcon,
  EyeSlashIcon,
  UserMinusIcon,
  FlagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useReports, useUpdateReport, useModerationAction } from '../../hooks/useCommunityAPI';

interface ModerationAction {
  id: string;
  type: 'report' | 'violation' | 'appeal';
  title: string;
  description: string;
  reporter?: {
    name: string;
    avatar: string;
  };
  target: {
    type: 'post' | 'reply' | 'user';
    id: string;
    title: string;
    author: string;
  };
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
}

interface ModerationPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const ModerationPanel: React.FC<ModerationPanelProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'actions' | 'users'>('reports');
  const [reportFilters, setReportFilters] = useState({ status: 'pending', page: 1, limit: 20 });
  const [quickActionTarget, setQuickActionTarget] = useState({
    type: 'post' as 'post' | 'reply' | 'user',
    id: '',
    title: ''
  });
  const [bulkActionSettings, setBulkActionSettings] = useState({
    action: '',
    reason: '',
    selectedItems: new Set<string>()
  });

  // API hooks
  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useReports(reportFilters);
  const updateReportMutation = useUpdateReport();
  const moderationActionMutation = useModerationAction();

  // Get reports from API
  const reports = reportsData?.data?.reports || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleModerateAction = async (action: string, reportId: string) => {
    try {
      const report = reports.find(r => r.id === reportId);

      if (action === 'View') {
        if (report?.target) {
          // Set the quick action target to the reported item for potential follow-up actions
          setQuickActionTarget({
            type: report.target.type as 'post' | 'reply' | 'user',
            id: report.target.id,
            title: report.target.title
          });

          // Switch to the actions tab to show available actions
          setActiveTab('actions');

          toast.success(`Loaded ${report.target.type}: ${report.target.title} for moderation`);
        } else {
          toast.error('Target not found for this report');
        }
        return;
      }

      if (action === 'Resolve') {
        await updateReportMutation.mutateAsync({
          reportId,
          status: 'resolved',
          actionTaken: 'Report resolved by moderator'
        });
        toast.success('Report resolved successfully');
        refetchReports();
      }

      if (action === 'Dismiss') {
        await updateReportMutation.mutateAsync({
          reportId,
          status: 'dismissed',
          moderatorNotes: 'Report dismissed - no action needed'
        });
        toast.success('Report dismissed');
        refetchReports();
      }
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} report`);
      console.error(`${action} error:`, error);
    }
  };

  const handleQuickAction = async (actionName: string, actionType: string) => {
    try {
      if (!quickActionTarget.id) {
        toast.error('Please specify a target for the action');
        return;
      }

      await moderationActionMutation.mutateAsync({
        actionType,
        targetType: quickActionTarget.type,
        targetId: quickActionTarget.id,
        reason: `Applied via quick action: ${actionName}`
      });

      toast.success(`${actionName} applied successfully to ${quickActionTarget.title}`);

      // Clear the target after successful action
      setQuickActionTarget({ type: 'post', id: '', title: '' });

      // Refresh reports if this was related to a report
      refetchReports();
    } catch (error) {
      toast.error(`Failed to apply ${actionName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Quick action error:', error);
    }
  };

  const handleBulkAction = async () => {
    try {
      if (!bulkActionSettings.action) {
        toast.error('Please select an action');
        return;
      }

      if (bulkActionSettings.selectedItems.size === 0) {
        toast.error('Please select items to apply the action to');
        return;
      }

      const promises = Array.from(bulkActionSettings.selectedItems).map(itemId => {
        const report = reports.find(r => r.id === itemId);
        if (!report?.target) return Promise.resolve();

        return moderationActionMutation.mutateAsync({
          actionType: bulkActionSettings.action,
          targetType: report.target.type as 'post' | 'reply' | 'user',
          targetId: report.target.id,
          reason: bulkActionSettings.reason || `Applied via bulk action: ${bulkActionSettings.action}`
        });
      });

      await Promise.all(promises);

      toast.success(`${bulkActionSettings.action} applied to ${bulkActionSettings.selectedItems.size} items`);

      // Clear selections
      setBulkActionSettings({
        action: '',
        reason: '',
        selectedItems: new Set()
      });

      refetchReports();
    } catch (error) {
      toast.error(`Failed to apply bulk action: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Bulk action error:', error);
    }
  };

  const toggleBulkSelection = (itemId: string) => {
    const newSelection = new Set(bulkActionSettings.selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setBulkActionSettings({
      ...bulkActionSettings,
      selectedItems: newSelection
    });
  };

  const quickActions = [
    { name: 'Pin Post', icon: FlagIcon, action: 'pin' },
    { name: 'Lock Thread', icon: LockClosedIcon, action: 'lock' },
    { name: 'Remove Content', icon: TrashIcon, action: 'remove' },
    { name: 'Hide Content', icon: EyeSlashIcon, action: 'hide' },
    { name: 'Warn User', icon: ExclamationTriangleIcon, action: 'warn' },
    { name: 'Timeout User', icon: ClockIcon, action: 'timeout' }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Moderation Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FlagIcon className="w-4 h-4 inline mr-2" />
              Reports ({reports.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ShieldCheckIcon className="w-4 h-4 inline mr-2" />
              Quick Actions
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserMinusIcon className="w-4 h-4 inline mr-2" />
              User Management
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Reported Content</h3>
                <div className="flex space-x-2">
                  <select
                    value={reportFilters.status}
                    onChange={(e) => setReportFilters({...reportFilters, status: e.target.value})}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="all">All</option>
                  </select>
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                    Sort
                  </button>
                </div>
              </div>

              {reportsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <FlagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reports found</p>
                </div>
              ) : (
                reports.map((report) => (
                <div key={report.id} className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={bulkActionSettings.selectedItems.has(report.id)}
                        onChange={() => toggleBulkSelection(report.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                          {report.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                          {report.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-1">{report.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>

                      {report.target && (
                        <div className="bg-white rounded p-3 mb-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">
                              {report.target.type?.toUpperCase()}:
                            </span>
                            <span className="text-sm font-medium">{report.target.title}</span>
                          </div>
                          <p className="text-xs text-gray-500">by {report.target.author}</p>
                        </div>
                      )}

                      {report.reporter && (
                        <div className="flex items-center space-x-2 mb-3">
                          <img
                            src={report.reporter.avatar}
                            alt={report.reporter.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-600">
                            Reported by {report.reporter.name}
                          </span>
                        </div>
                      )}

                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reason:</span> {report.reason}
                      </p>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleModerateAction('View', report.id)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleModerateAction('Resolve', report.id)}
                        disabled={updateReportMutation.isPending}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                        {updateReportMutation.isPending ? 'Resolving...' : 'Resolve'}
                      </button>
                      <button
                        onClick={() => handleModerateAction('Dismiss', report.id)}
                        disabled={updateReportMutation.isPending}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        {updateReportMutation.isPending ? 'Dismissing...' : 'Dismiss'}
                      </button>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Moderation Actions</h3>

              {/* Target Selection */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Target Selection</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={quickActionTarget.type}
                    onChange={(e) => setQuickActionTarget({...quickActionTarget, type: e.target.value as 'post' | 'reply' | 'user', id: '', title: ''})}
                    className="border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="post">Post</option>
                    <option value="reply">Reply</option>
                    <option value="user">User</option>
                  </select>

                  <input
                    type="text"
                    value={quickActionTarget.id}
                    onChange={(e) => setQuickActionTarget({...quickActionTarget, id: e.target.value})}
                    placeholder="Target ID"
                    className="border border-gray-300 rounded px-3 py-2"
                  />

                  <input
                    type="text"
                    value={quickActionTarget.title}
                    onChange={(e) => setQuickActionTarget({...quickActionTarget, title: e.target.value})}
                    placeholder="Title/Name (optional)"
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                {quickActionTarget.id ? (
                  <div className="mt-2 text-sm text-green-600">
                    ✓ Ready to apply actions to {quickActionTarget.type}: {quickActionTarget.title || quickActionTarget.id}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500">
                    Please enter a target ID to enable quick actions
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.action}
                    onClick={() => handleQuickAction(action.name, action.action)}
                    disabled={moderationActionMutation.isPending}
                    className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <action.icon className="w-8 h-8 text-gray-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">{action.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <h4 className="font-medium text-gray-900 mb-4">Bulk Actions</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <select
                      value={bulkActionSettings.action}
                      onChange={(e) => setBulkActionSettings({...bulkActionSettings, action: e.target.value})}
                      className="border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select Action</option>
                      <option value="remove">Remove Selected</option>
                      <option value="lock">Lock Selected</option>
                      <option value="pin">Pin Selected</option>
                      <option value="hide">Hide Selected</option>
                      <option value="warn">Warn Users</option>
                    </select>
                    <input
                      type="text"
                      value={bulkActionSettings.reason}
                      onChange={(e) => setBulkActionSettings({...bulkActionSettings, reason: e.target.value})}
                      placeholder="Reason (optional)"
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                    />
                    <button
                      onClick={handleBulkAction}
                      disabled={!bulkActionSettings.action || bulkActionSettings.selectedItems.size === 0 || moderationActionMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {moderationActionMutation.isPending ? 'Applying...' : `Apply (${bulkActionSettings.selectedItems.size})`}
                    </button>
                  </div>
                  {bulkActionSettings.selectedItems.size > 0 && (
                    <div className="mt-2 text-sm text-blue-600">
                      {bulkActionSettings.selectedItems.size} item(s) selected for bulk action
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Management</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                  />
                  <select className="border border-gray-300 rounded px-3 py-2">
                    <option>All Users</option>
                    <option>Flagged Users</option>
                    <option>Banned Users</option>
                    <option>Premium Users</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600">User management interface would display here with options to:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                    <li>View user profiles and activity</li>
                    <li>Warn, timeout, or ban users</li>
                    <li>Review user reports and history</li>
                    <li>Manage user roles and permissions</li>
                    <li>Send direct messages to users</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleString()}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationPanel;