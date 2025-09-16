import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function getUserFromToken(authHeader: string) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const token = authHeader.substring(7);
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [token]);
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;
    const { id } = req.query;

    switch (method) {
      case 'GET':
        return await getPost(req, res, id as string);
      case 'PUT':
        return await updatePost(req, res, id as string);
      case 'DELETE':
        return await deletePost(req, res, id as string);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Community post API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function getPost(req: VercelRequest, res: VercelResponse, postId: string) {
  const { include_replies = 'true' } = req.query;

  // Get the post
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
    WHERE p.id = $1 AND p.is_deleted = FALSE
  `;

  const postResult = await pool.query(postQuery, [postId]);

  if (postResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  const post = postResult.rows[0];

  // Record view if user is provided
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const user = await getUserFromToken(authHeader);
      // Insert view interaction (will be ignored if already exists due to UNIQUE constraint)
      await pool.query(
        'INSERT INTO community_interactions (user_id, target_type, target_id, interaction_type) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [user.id, 'post', postId, 'view']
      );
    } catch (error) {
      // Ignore auth errors for view tracking
    }
  }

  const responsePost = {
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
      dislikes: post.dislikes_count
    },
    isPinned: post.is_pinned,
    isLocked: post.is_locked,
    isFeatured: post.is_featured
  };

  let replies = [];

  if (include_replies === 'true') {
    // Get replies with nested structure
    const repliesQuery = `
      WITH RECURSIVE reply_tree AS (
        -- Base case: top-level replies
        SELECT
          r.*,
          u.name as author_name,
          u.avatar_url as author_avatar,
          u.role as author_role,
          0 as level
        FROM community_replies r
        JOIN users u ON r.author_id = u.id
        WHERE r.post_id = $1 AND r.parent_reply_id IS NULL AND r.is_deleted = FALSE

        UNION ALL

        -- Recursive case: nested replies
        SELECT
          r.*,
          u.name as author_name,
          u.avatar_url as author_avatar,
          u.role as author_role,
          rt.level + 1 as level
        FROM community_replies r
        JOIN users u ON r.author_id = u.id
        JOIN reply_tree rt ON r.parent_reply_id = rt.id
        WHERE r.is_deleted = FALSE AND rt.level < 3
      )
      SELECT * FROM reply_tree
      ORDER BY level, created_at ASC
    `;

    const repliesResult = await pool.query(repliesQuery, [postId]);

    // Build nested reply structure
    const replyMap = new Map();
    const topLevelReplies = [];

    repliesResult.rows.forEach(reply => {
      const formattedReply = {
        id: reply.id,
        content: reply.content,
        author: {
          id: reply.author_id,
          name: reply.author_name,
          avatar: reply.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.author_name)}`,
          role: reply.author_role
        },
        createdAt: reply.created_at,
        editedAt: reply.edited_at,
        likes: reply.likes_count,
        dislikes: reply.dislikes_count,
        isEdited: reply.is_edited,
        isLiked: false, // Would need to check user interactions
        isDisliked: false,
        replies: []
      };

      replyMap.set(reply.id, formattedReply);

      if (reply.parent_reply_id === null) {
        topLevelReplies.push(formattedReply);
      } else {
        const parent = replyMap.get(reply.parent_reply_id);
        if (parent) {
          parent.replies.push(formattedReply);
        }
      }
    });

    replies = topLevelReplies;
  }

  return res.status(200).json({
    success: true,
    data: {
      post: responsePost,
      replies
    }
  });
}

async function updatePost(req: VercelRequest, res: VercelResponse, postId: string) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  const { title, content, tags } = req.body;

  // Get the post to check ownership
  const postResult = await pool.query(
    'SELECT * FROM community_posts WHERE id = $1 AND is_deleted = FALSE',
    [postId]
  );

  if (postResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  const post = postResult.rows[0];

  // Check if user owns the post or is admin/moderator
  if (post.author_id !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own posts'
    });
  }

  // Check if post is locked
  if (post.is_locked && user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      message: 'This post is locked and cannot be edited'
    });
  }

  const updates = [];
  const values = [];
  let valueIndex = 1;

  if (title !== undefined) {
    if (!title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot be empty'
      });
    }
    updates.push(`title = $${valueIndex}`);
    values.push(title.trim());
    valueIndex++;
  }

  if (content !== undefined) {
    if (!content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content cannot be empty'
      });
    }
    updates.push(`content = $${valueIndex}`);
    values.push(content.trim());
    valueIndex++;
  }

  if (tags !== undefined) {
    updates.push(`tags = $${valueIndex}`);
    values.push(Array.isArray(tags) ? tags : []);
    valueIndex++;
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid fields to update'
    });
  }

  updates.push(`updated_at = NOW()`);
  values.push(postId);

  const updateQuery = `
    UPDATE community_posts
    SET ${updates.join(', ')}
    WHERE id = $${valueIndex}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, values);

  return res.status(200).json({
    success: true,
    data: result.rows[0],
    message: 'Post updated successfully'
  });
}

async function deletePost(req: VercelRequest, res: VercelResponse, postId: string) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);

  // Get the post to check ownership
  const postResult = await pool.query(
    'SELECT * FROM community_posts WHERE id = $1 AND is_deleted = FALSE',
    [postId]
  );

  if (postResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  const post = postResult.rows[0];

  // Check if user owns the post or is admin/moderator
  if (post.author_id !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own posts'
    });
  }

  // Soft delete the post
  await pool.query(
    'UPDATE community_posts SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1',
    [postId]
  );

  // Log moderation action if deleted by moderator
  if (post.author_id !== user.id) {
    await pool.query(
      'INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason) VALUES ($1, $2, $3, $4, $5)',
      [user.id, 'delete_post', 'post', postId, 'Post deleted by moderator']
    );
  }

  return res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
}