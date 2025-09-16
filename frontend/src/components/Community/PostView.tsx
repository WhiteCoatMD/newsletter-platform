import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpIconSolid,
  HandThumbDownIcon as HandThumbDownIconSolid,
  BookmarkIcon as BookmarkIconSolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useReplies, useCreateReply } from '../../hooks/useCommunityAPI';

interface Reply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: 'admin' | 'moderator' | 'subscriber' | 'premium';
  };
  createdAt: string;
  editedAt?: string;
  likes: number;
  dislikes: number;
  isLiked: boolean;
  isDisliked: boolean;
  replies?: Reply[];
}

interface PostViewProps {
  post: {
    id: string;
    title: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar: string;
      role: 'admin' | 'moderator' | 'subscriber' | 'premium';
      joinedDate: string;
    };
    category: string;
    tags: string[];
    createdAt: string;
    stats: {
      views: number;
      replies: number;
      likes: number;
      dislikes: number;
    };
  };
  onBack: () => void;
}

const PostView: React.FC<PostViewProps> = ({ post, onBack }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  // API hooks
  const { data: repliesData, isLoading: repliesLoading } = useReplies(post.id);
  const createReplyMutation = useCreateReply();

  const replies = repliesData?.data || [];


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

  const handleLike = () => {
    if (isDisliked) setIsDisliked(false);
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Like removed' : 'Post liked!');
  };

  const handleDislike = () => {
    if (isLiked) setIsLiked(false);
    setIsDisliked(!isDisliked);
    toast.success(isDisliked ? 'Dislike removed' : 'Post disliked');
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      await createReplyMutation.mutateAsync({
        postId: post.id,
        content: replyContent
      });
      toast.success('Reply posted!');
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      toast.error('Failed to post reply. Please try again.');
      console.error('Reply submission error:', error);
    }
  };

  const handleReplyLike = () => {
    toast.success('Reply liked!');
  };

  const renderReply = (reply: Reply, isNested = false) => (
    <div key={reply.id} className={`${isNested ? 'ml-12' : ''} mb-6`}>
      <div className="bg-gray-50 rounded-lg p-4">
        {/* Reply Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <img
              src={reply.author.avatar}
              alt={reply.author.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{reply.author.name}</span>
                {getRoleBadge(reply.author.role)}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{new Date(reply.createdAt).toLocaleString()}</span>
                {reply.editedAt && <span>(edited)</span>}
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Reply Content */}
        <p className="text-gray-700 mb-3">{reply.content}</p>

        {/* Reply Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleReplyLike}
            className={`flex items-center space-x-1 text-sm ${
              reply.isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {reply.isLiked ? (
              <HandThumbUpIconSolid className="w-4 h-4" />
            ) : (
              <HandThumbUpIcon className="w-4 h-4" />
            )}
            <span>{reply.likes}</span>
          </button>

          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>Reply</span>
          </button>

          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
            <ShareIcon className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-4">
          {reply.replies.map(nestedReply => renderReply(nestedReply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>Back to Community</span>
      </button>

      {/* Post Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {post.category}
          </span>
          <button className="text-gray-400 hover:text-gray-600">
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

        {/* Author Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{post.author.name}</span>
                {getRoleBadge(post.author.role)}
              </div>
              <div className="text-sm text-gray-500">
                Posted {new Date(post.createdAt).toLocaleDateString()} • Member since {new Date(post.author.joinedDate).getFullYear()}
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 leading-relaxed">{post.content}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Post Stats */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>{post.stats.views} views</span>
            <span>{post.stats.replies} replies</span>
            <span>{post.stats.likes} likes</span>
          </div>

          {/* Post Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md ${
                isLiked ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {isLiked ? (
                <HandThumbUpIconSolid className="w-4 h-4" />
              ) : (
                <HandThumbUpIcon className="w-4 h-4" />
              )}
              <span>Like</span>
            </button>

            <button
              onClick={handleDislike}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md ${
                isDisliked ? 'bg-red-100 text-red-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {isDisliked ? (
                <HandThumbDownIconSolid className="w-4 h-4" />
              ) : (
                <HandThumbDownIcon className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md ${
                isBookmarked ? 'bg-yellow-100 text-yellow-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {isBookmarked ? (
                <BookmarkIconSolid className="w-4 h-4" />
              ) : (
                <BookmarkIcon className="w-4 h-4" />
              )}
            </button>

            <button className="flex items-center space-x-1 px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <ShareIcon className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Join the Discussion</h3>

        {!showReplyForm ? (
          <button
            onClick={() => setShowReplyForm(true)}
            className="w-full p-4 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-500 hover:text-gray-700"
          >
            Add your thoughts to the discussion...
          </button>
        ) : (
          <div>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={createReplyMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createReplyMutation.isPending ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replies */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-6">
          Replies ({replies.length})
        </h3>

        {repliesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading replies...</p>
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8">
            <ChatBubbleLeftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No replies yet. Be the first to join the discussion!</p>
          </div>
        ) : (
          <div>
            {replies.map(reply => renderReply(reply))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostView;