import React, { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FireIcon,
  ClockIcon,
  StarIcon,
  UserIcon,
  EllipsisVerticalIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  HandThumbUpIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import PostView from '../components/Community/PostView';
import ModerationPanel from '../components/Community/ModerationPanel';
import NewPostModal from '../components/Community/NewPostModal';
import { usePosts, useCategories, type CommunityPost, type CommunityCategory } from '../hooks/useCommunityAPI';
import { useQueryClient } from '@tanstack/react-query';



const Community: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showModerationPanel, setShowModerationPanel] = useState(false);

  const queryClient = useQueryClient();

  // API hooks
  const { data: postsData, isLoading: postsLoading, error: postsError } = usePosts({
    category: categoryFilter,
    sort: sortBy,
    search: searchTerm,
    page: 1,
    limit: 20
  });

  const { data: categoriesData } = useCategories(true);

  // Extract data from API responses
  const posts = postsData?.data?.posts || [];
  const categories = (categoriesData?.data as CommunityCategory[]) || [];
  const categoryNames = categories.length > 0 ? categories.map(c => c.name) : ['Tips & Strategies', 'Showcase', 'Tools & Tech', 'Announcements', 'Q&A', 'Off-Topic'];
  const availableCategories = ['all', ...categoryNames];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">Admin</span>;
      case 'moderator':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Mod</span>;
      case 'premium':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Premium</span>;
      default:
        return null;
    }
  };

  const handleShowNewPostModal = () => {
    setShowNewPostModal(true);
  };

  const handleViewPost = (post: CommunityPost) => {
    setSelectedPost(post);
  };

  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }) => {
    try {
      // Try API first, fallback to localStorage if it fails
      try {
        const response = await fetch(`${window.location.origin}/api/community/posts-mongo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log('Post created via API:', result);
      } catch (apiError) {
        console.warn('API post creation failed, saving locally:', apiError);

        // Save to localStorage as fallback
        const newPost = {
          id: Date.now().toString(),
          title: postData.title,
          content: postData.content,
          author: {
            id: 'current-user',
            name: 'You',
            avatar: 'https://ui-avatars.com/api/?name=You&background=3B82F6&color=fff',
            role: 'subscriber',
            joinedDate: new Date().toISOString()
          },
          category: postData.category,
          categoryInfo: {
            name: postData.category,
            color: '#3B82F6',
            icon: '📝'
          },
          tags: postData.tags,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          stats: {
            views: 1,
            replies: 0,
            likes: 0,
            dislikes: 0
          },
          isPinned: false,
          isLocked: false,
          isFeatured: false
        };

        // Save to localStorage
        const existingPosts = JSON.parse(localStorage.getItem('community-posts') || '[]');
        existingPosts.unshift(newPost);
        localStorage.setItem('community-posts', JSON.stringify(existingPosts));

        console.log('Post saved locally:', newPost);

        // Invalidate queries to refresh the posts list
        queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
      }

      // Always invalidate queries after any successful post creation
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  };

  // If a post is selected, show the detailed post view
  if (selectedPost) {
    return (
      <PostView
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg mr-4">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Community
                </h1>
                <p className="text-gray-500 mt-1 text-lg">Connect with fellow newsletter creators and subscribers</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Admin/Moderator Only */}
            <button
              onClick={() => setShowModerationPanel(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
              title="Moderation Panel (Admin Only)"
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>Moderate</span>
            </button>
            <button
              onClick={handleShowNewPostModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Post</span>
            </button>
          </div>
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <ChatBubbleLeftIcon className="w-8 h-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Posts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">1,247</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <UserIcon className="w-8 h-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Active Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">8,932</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <EyeIcon className="w-8 h-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Monthly Views</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">47.2K</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FireIcon className="w-8 h-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Trending Topics</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">AI Tools</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortBy === 'recent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Recent
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortBy === 'popular' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <StarIcon className="w-4 h-4 inline mr-1" />
                Popular
              </button>
              <button
                onClick={() => setSortBy('trending')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortBy === 'trending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FireIcon className="w-4 h-4 inline mr-1" />
                Trending
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {postsLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading posts...</span>
        </div>
      )}

      {/* Error State */}
      {postsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Posts</h3>
          <p className="text-red-700">
            {postsError instanceof Error ? postsError.message : 'Failed to load community posts'}
          </p>
        </div>
      )}

      {/* Posts List */}
      {!postsLoading && !postsError && (
          <div className="space-y-6">
            {posts.map((post: CommunityPost) => (
            <div
              key={post.id}
              className={`bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${
                post.isFeatured ? 'ring-2 ring-gradient-to-r from-blue-400 to-indigo-400 ring-opacity-50' : ''
              } ${post.isPinned ? 'bg-gradient-to-r from-yellow-50/90 to-amber-50/90' : ''}`}
              onClick={() => handleViewPost(post)}
            >
              <div className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Post Header */}
                  <div className="flex items-center space-x-2 mb-2">
                    {post.isPinned && <StarIcon className="w-4 h-4 text-green-600" />}
                    {post.isLocked && <LockClosedIcon className="w-4 h-4 text-gray-500" />}
                    {post.isFeatured && <StarIconSolid className="w-4 h-4 text-yellow-500" />}
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {post.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
                    {post.title}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {post.content}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Author and Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{post.author.name}</span>
                          {getRoleBadge(post.author.role)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        {post.stats.views}
                      </span>
                      <span className="flex items-center">
                        <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
                        {post.stats.replies}
                      </span>
                      <span className="flex items-center">
                        <HandThumbUpIcon className="w-4 h-4 mr-1" />
                        {post.stats.likes}
                      </span>
                    </div>
                  </div>
                </div>

                <button className="text-gray-400 hover:text-gray-600">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {!postsLoading && !postsError && posts.length === 0 && (
        <div className="text-center py-12">
          <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search criteria or start a new discussion.</p>
          <button
            onClick={handleShowNewPostModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Start a Discussion
          </button>
        </div>
      )}

      {/* New Post Modal */}
      <NewPostModal
        isVisible={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        onSubmit={handleCreatePost}
        categories={categoryNames}
      />

      {/* Moderation Panel */}
      <ModerationPanel
        isVisible={showModerationPanel}
        onClose={() => setShowModerationPanel(false)}
      />
    </div>
  );
};

export default Community;