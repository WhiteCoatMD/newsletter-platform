import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

interface Newsletter {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'sent' | 'scheduled';
  createdAt: string;
  sentAt?: string;
  statistics: {
    emailsSent: number;
    opensCount: number;
    clicksCount: number;
    unsubscribes: number;
  };
}

const Newsletters: React.FC = () => {
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent'>('all');

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletters/list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setNewsletters(result.data);
      } else {
        toast.error('Failed to load newsletters');
      }
    } catch (error) {
      toast.error('Failed to load newsletters');
      console.error('Fetch newsletters error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${title}"?`);
    if (!confirmDelete) return;

    try {
      // Simulate delete API call
      setNewsletters(newsletters.filter(n => n.id !== id));
      toast.success('Newsletter deleted successfully');
    } catch (error) {
      toast.error('Failed to delete newsletter');
    }
  };

  const handleDuplicate = async (newsletter: Newsletter) => {
    try {
      const duplicated = {
        ...newsletter,
        id: `newsletter_${Date.now()}`,
        title: `${newsletter.title} (Copy)`,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        sentAt: undefined,
        statistics: {
          emailsSent: 0,
          opensCount: 0,
          clicksCount: 0,
          unsubscribes: 0
        }
      };

      setNewsletters([duplicated, ...newsletters]);
      toast.success('Newsletter duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate newsletter');
    }
  };

  const filteredNewsletters = newsletters.filter(newsletter => {
    if (filter === 'all') return true;
    return newsletter.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOpenRate = (newsletter: Newsletter) => {
    if (newsletter.statistics.emailsSent === 0) return '0%';
    return ((newsletter.statistics.opensCount / newsletter.statistics.emailsSent) * 100).toFixed(1) + '%';
  };

  const getClickRate = (newsletter: Newsletter) => {
    if (newsletter.statistics.opensCount === 0) return '0%';
    return ((newsletter.statistics.clicksCount / newsletter.statistics.opensCount) * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletters</h1>
          <p className="text-gray-600 mt-2">Manage your newsletter campaigns and drafts</p>
        </div>
        <button
          onClick={() => navigate('/posts/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Newsletter</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm mb-6">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <div className="flex space-x-2">
                {['all', 'draft', 'sent'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption as any)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      filter === filterOption
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                    <span className="ml-1 text-xs">
                      ({filterOption === 'all' ? newsletters.length : newsletters.filter(n => n.status === filterOption).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter List */}
        <div className="divide-y divide-gray-200">
          {filteredNewsletters.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                {filter === 'all' ? 'No newsletters yet' : `No ${filter} newsletters`}
              </p>
              <button
                onClick={() => navigate('/posts/new')}
                className="mt-3 text-blue-600 hover:text-blue-700"
              >
                Create your first newsletter
              </button>
            </div>
          ) : (
            filteredNewsletters.map((newsletter) => (
              <div key={newsletter.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {newsletter.title}
                      </h3>
                      {getStatusBadge(newsletter.status)}
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>Created {formatDate(newsletter.createdAt)}</span>
                      {newsletter.sentAt && (
                        <span>Sent {formatDate(newsletter.sentAt)}</span>
                      )}
                      {newsletter.status === 'sent' && (
                        <>
                          <span>{newsletter.statistics.emailsSent.toLocaleString()} recipients</span>
                          <span>{getOpenRate(newsletter)} open rate</span>
                          <span>{getClickRate(newsletter)} click rate</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {/* Preview functionality */}}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Preview"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>

                    {newsletter.status === 'draft' && (
                      <button
                        onClick={() => navigate(`/posts/edit/${newsletter.id}`)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDuplicate(newsletter)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>

                    {newsletter.status === 'draft' && (
                      <button
                        onClick={() => {/* Send functionality */}}
                        className="p-2 text-blue-400 hover:text-blue-600"
                        title="Send Newsletter"
                      >
                        <PaperAirplaneIcon className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(newsletter.id, newsletter.title)}
                      className="p-2 text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Newsletters;