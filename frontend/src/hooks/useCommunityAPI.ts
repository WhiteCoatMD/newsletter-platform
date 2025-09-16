import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config';
import { mockPosts, mockCategories } from '../utils/mockData';

// Types
export interface CommunityPost {
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
  categoryInfo: {
    name: string;
    color: string;
    icon: string;
  };
  tags: string[];
  createdAt: string;
  lastActivity: string;
  stats: {
    views: number;
    replies: number;
    likes: number;
    dislikes: number;
    bookmarks?: number;
  };
  isPinned: boolean;
  isLocked: boolean;
  isFeatured: boolean;
}

export interface CommunityReply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  createdAt: string;
  editedAt?: string;
  likes: number;
  dislikes: number;
  isEdited: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  replies?: CommunityReply[];
}

export interface CommunityCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  postCount?: number;
  lastActivity?: string;
  displayOrder: number;
}

export interface PostFilters {
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'recent' | 'popular' | 'trending';
  search?: string;
  featured_only?: boolean;
}

// API helper function
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Custom hooks
export function usePosts(filters: PostFilters = {}) {
  return useQuery({
    queryKey: ['community', 'posts', filters],
    queryFn: async () => {
      // Try API first, fallback to mock data if it fails
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });

        return await apiCall(`/api/community/posts-mongo?${params.toString()}`);
      } catch (error) {
        console.warn('API call failed, using mock data:', error);
        // Combine localStorage posts with mock data
        const localPosts = JSON.parse(localStorage.getItem('community-posts') || '[]');
        const allPosts = [...localPosts, ...mockPosts];

        return {
          success: true,
          data: {
            posts: allPosts,
            pagination: {
              page: 1,
              limit: 20,
              total: allPosts.length,
              totalPages: 1
            }
          }
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePost(postId: string, includeReplies = true) {
  return useQuery({
    queryKey: ['community', 'post', postId, includeReplies],
    queryFn: () => apiCall(`/api/community/post/${postId}?include_replies=${includeReplies}`),
    enabled: !!postId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCategories(includeStats = false) {
  return useQuery({
    queryKey: ['community', 'categories', includeStats],
    queryFn: async () => {
      // Try API first, fallback to mock data if it fails
      try {
        return await apiCall(`/api/community/categories-mongo?include_stats=${includeStats}`);
      } catch (error) {
        console.warn('Categories API call failed, using mock data:', error);
        return {
          success: true,
          data: mockCategories
        };
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
    }) => apiCall('/api/community/posts-mongo', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

export function useReplies(postId: string) {
  return useQuery({
    queryKey: ['community', 'replies', postId],
    queryFn: async () => {
      try {
        return await apiCall(`/api/community/replies-mongo?postId=${postId}`);
      } catch (error) {
        console.warn('Replies API call failed, using empty array:', error);
        return {
          success: true,
          data: []
        };
      }
    },
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      postId: string;
      parentReplyId?: string;
      content: string;
    }) => apiCall('/api/community/replies-mongo', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'replies', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      postId: string;
      title?: string;
      content?: string;
      tags?: string[];
    }) => apiCall(`/api/community/post/${data.postId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => apiCall(`/api/community/post/${postId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

export function useInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      targetType: 'post' | 'reply';
      targetId: string;
      interactionType: 'like' | 'dislike' | 'bookmark';
      action: 'add' | 'remove';
    }) => {
      const { action, ...payload } = data;
      if (action === 'add') {
        return apiCall('/api/community/interactions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        return apiCall('/api/community/interactions', {
          method: 'DELETE',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to refresh counts
      if (variables.targetType === 'post') {
        queryClient.invalidateQueries({ queryKey: ['community', 'post', variables.targetId] });
        queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
      }
    },
  });
}

export function useUserInteractions(targetType: 'post' | 'reply', targetIds: string[]) {
  return useQuery({
    queryKey: ['community', 'interactions', targetType, targetIds],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('targetType', targetType);
      targetIds.forEach(id => params.append('targetIds', id));
      return apiCall(`/api/community/interactions?${params.toString()}`);
    },
    enabled: targetIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Moderation hooks - Updated to use MongoDB endpoints
export function useReports(filters = {}) {
  return useQuery({
    queryKey: ['community', 'moderation', 'reports', filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append('action', 'reports');
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
        return await apiCall(`/api/community/moderation-mongo?${params.toString()}`);
      } catch (error) {
        console.warn('Reports API call failed, using empty array:', error);
        return {
          success: true,
          data: {
            reports: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
          }
        };
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      reportId: string;
      status: string;
      moderatorNotes?: string;
    }) => apiCall('/api/community/moderation-mongo', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'moderation', 'reports'] });
    },
  });
}

export function useModerationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      actionType: string;
      targetType: 'post' | 'reply' | 'user';
      targetId: string;
      reason?: string;
      metadata?: any;
    }) => apiCall('/api/community/moderation-mongo?action=moderate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      targetType: 'post' | 'reply' | 'user';
      targetId: string;
      reason: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }) => apiCall('/api/community/moderation-mongo?action=report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'moderation', 'reports'] });
    },
  });
}