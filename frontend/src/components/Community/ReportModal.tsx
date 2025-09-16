import React, { useState } from 'react';
import { XMarkIcon, FlagIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useCreateReport } from '../../hooks/useCommunityAPI';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'reply' | 'user';
  targetId: string;
  targetTitle: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const createReportMutation = useCreateReport();

  const reportReasons = [
    'Spam or unwanted content',
    'Harassment or bullying',
    'Hate speech or discrimination',
    'Violence or threats',
    'Misinformation',
    'Copyright infringement',
    'Adult content',
    'Off-topic content',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    try {
      await createReportMutation.mutateAsync({
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
        priority
      });

      toast.success('Report submitted successfully. Thank you for helping keep our community safe.');

      // Reset form
      setReason('');
      setDescription('');
      setPriority('medium');
      onClose();
    } catch (error) {
      toast.error('Failed to submit report. Please try again.');
      console.error('Report submission error:', error);
    }
  };

  const handleClose = () => {
    setReason('');
    setDescription('');
    setPriority('medium');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FlagIcon className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Report Content</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Target Info */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reporting {targetType}:
            </label>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-900 font-medium truncate">
                {targetTitle}
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's wrong with this {targetType}? *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="">Select a reason...</option>
              {reportReasons.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Details */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional context that might help our moderation team..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Priority */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="low">Low - Minor issue</option>
              <option value="medium">Medium - Moderate concern</option>
              <option value="high">High - Serious issue</option>
              <option value="urgent">Urgent - Immediate attention needed</option>
            </select>
          </div>

          {/* Disclaimer */}
          <div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> False reports may result in action against your account.
              Reports are reviewed by our moderation team and appropriate action will be taken
              if the content violates our community guidelines.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createReportMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createReportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;