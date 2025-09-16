import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Helper function to get user from token
async function getUserFromToken(authHeader: string) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const token = authHeader.substring(7);
  // In a real app, you'd verify the JWT token here
  // For now, we'll use a simple user lookup
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [token]);
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;

    switch (method) {
      case 'GET':
        return await getPosts(req, res);
      case 'POST':
        return await createPost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Community posts API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function getPosts(req: VercelRequest, res: VercelResponse) {
  const {
    page = 1,
    limit = 20,
    category = 'all',
    sort = 'recent',
    search = '',
    featured_only = 'false'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  let orderBy = 'p.created_at DESC';
  switch (sort) {
    case 'popular':
      orderBy = '(p.likes_count + p.replies_count) DESC, p.created_at DESC';
      break;
    case 'trending':
      orderBy = 'p.views_count DESC, p.last_activity_at DESC';
      break;
    case 'recent':
    default:
      orderBy = 'p.last_activity_at DESC';
      break;
  }

  let whereClause = 'WHERE p.is_deleted = FALSE';
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (category !== 'all') {
    whereClause += ` AND p.category = $${paramIndex}`;
    queryParams.push(category);
    paramIndex++;
  }

  if (search) {
    whereClause += ` AND (p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex + 1} OR $${paramIndex + 2} = ANY(p.tags))`;
    queryParams.push(`%${search}%`, `%${search}%`, search);
    paramIndex += 3;
  }

  if (featured_only === 'true') {
    whereClause += ' AND p.is_featured = TRUE';
  }

  const query = `
    SELECT
      p.*,
      u.name as author_name,
      u.avatar_url as author_avatar,
      u.role as author_role,
      c.name as category_name,
      c.color as category_color,
      c.icon as category_icon,
      (SELECT COUNT(*) FROM community_interactions WHERE target_type = 'post' AND target_id = p.id AND interaction_type = 'bookmark') as bookmarks_count
    FROM community_posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN community_categories c ON p.category = c.name
    ${whereClause}
    ORDER BY p.is_pinned DESC, ${orderBy}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(Number(limit), offset);

  const result = await pool.query(query, queryParams);

  // Get total count for pagination
  const countQuery = `
    SELECT COUNT(*)
    FROM community_posts p
    ${whereClause.replace(/JOIN.*?(?=WHERE|$)/, '')}
  `;
  const countParams = queryParams.slice(0, -2); // Remove limit and offset
  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  const posts = result.rows.map(post => ({
    id: post.id,
    title: post.title,
    content: post.content,
    author: {
      id: post.author_id,
      name: post.author_name,
      avatar: post.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name)}`,
      role: post.author_role,
      joinedDate: post.created_at
    },
    category: post.category,
    categoryInfo: {
      name: post.category_name || post.category,
      color: post.category_color || '#6B7280',
      icon: post.category_icon || 'folder'
    },
    tags: post.tags || [],
    createdAt: post.created_at,
    lastActivity: post.last_activity_at,
    stats: {
      views: post.views_count,
      replies: post.replies_count,
      likes: post.likes_count,
      dislikes: post.dislikes_count,
      bookmarks: post.bookmarks_count
    },
    isPinned: post.is_pinned,
    isLocked: post.is_locked,
    isFeatured: post.is_featured
  }));

  return res.status(200).json({
    success: true,
    data: {
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}

async function createPost(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);

  const { title, content, category = 'general', tags = [] } = req.body;

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title and content are required'
    });
  }

  if (title.length > 255) {
    return res.status(400).json({
      success: false,
      message: 'Title must be 255 characters or less'
    });
  }

  // Check if user is banned
  if (user.is_banned && (!user.banned_until || new Date(user.banned_until) > new Date())) {
    return res.status(403).json({
      success: false,
      message: 'You are currently banned from posting'
    });
  }

  const query = `
    INSERT INTO community_posts (title, content, author_id, category, tags)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const result = await pool.query(query, [
    title.trim(),
    content.trim(),
    user.id,
    category,
    Array.isArray(tags) ? tags : []
  ]);

  const post = result.rows[0];

  // Get the complete post data with author info
  const postQuery = `
    SELECT
      p.*,
      u.name as author_name,
      u.avatar_url as author_avatar,
      u.role as author_role,
      c.name as category_name,
      c.color as category_color,
      c.icon as category_icon
    FROM community_posts p
    JOIN users u ON p.author_id = u.id
    LEFT JOIN community_categories c ON p.category = c.name
    WHERE p.id = $1
  `;

  const postResult = await pool.query(postQuery, [post.id]);
  const fullPost = postResult.rows[0];

  const responsePost = {
    id: fullPost.id,
    title: fullPost.title,
    content: fullPost.content,
    author: {
      id: fullPost.author_id,
      name: fullPost.author_name,
      avatar: fullPost.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullPost.author_name)}`,
      role: fullPost.author_role,
      joinedDate: fullPost.created_at
    },
    category: fullPost.category,
    categoryInfo: {
      name: fullPost.category_name || fullPost.category,
      color: fullPost.category_color || '#6B7280',
      icon: fullPost.category_icon || 'folder'
    },
    tags: fullPost.tags || [],
    createdAt: fullPost.created_at,
    lastActivity: fullPost.last_activity_at,
    stats: {
      views: 0,
      replies: 0,
      likes: 0,
      dislikes: 0,
      bookmarks: 0
    },
    isPinned: false,
    isLocked: false,
    isFeatured: false
  };

  return res.status(201).json({
    success: true,
    data: responsePost,
    message: 'Post created successfully'
  });
}