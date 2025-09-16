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

    switch (method) {
      case 'POST':
        return await createReply(req, res);
      case 'PUT':
        return await updateReply(req, res);
      case 'DELETE':
        return await deleteReply(req, res);
      default:
        res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Community replies API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function createReply(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  const { postId, parentReplyId, content } = req.body;

  if (!postId || !content?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Post ID and content are required'
    });
  }

  // Check if user is banned
  if (user.is_banned && (!user.banned_until || new Date(user.banned_until) > new Date())) {
    return res.status(403).json({
      success: false,
      message: 'You are currently banned from posting'
    });
  }

  // Check if post exists and is not locked
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

  if (post.is_locked && user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      message: 'This post is locked and no longer accepting replies'
    });
  }

  // If replying to another reply, check if it exists
  let depth = 0;
  if (parentReplyId) {
    const parentResult = await pool.query(
      'SELECT depth FROM community_replies WHERE id = $1 AND post_id = $2 AND is_deleted = FALSE',
      [parentReplyId, postId]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parent reply not found'
      });
    }

    depth = parentResult.rows[0].depth + 1;

    // Limit nesting depth
    if (depth > 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum reply depth exceeded'
      });
    }
  }

  // Create the reply
  const insertQuery = `
    INSERT INTO community_replies (post_id, parent_reply_id, author_id, content, depth)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const result = await pool.query(insertQuery, [
    postId,
    parentReplyId || null,
    user.id,
    content.trim(),
    depth
  ]);

  const reply = result.rows[0];

  // Get the complete reply data with author info
  const replyQuery = `
    SELECT
      r.*,
      u.name as author_name,
      u.avatar_url as author_avatar,
      u.role as author_role
    FROM community_replies r
    JOIN users u ON r.author_id = u.id
    WHERE r.id = $1
  `;

  const replyResult = await pool.query(replyQuery, [reply.id]);
  const fullReply = replyResult.rows[0];

  const responseReply = {
    id: fullReply.id,
    content: fullReply.content,
    author: {
      id: fullReply.author_id,
      name: fullReply.author_name,
      avatar: fullReply.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullReply.author_name)}`,
      role: fullReply.author_role
    },
    createdAt: fullReply.created_at,
    editedAt: fullReply.edited_at,
    likes: fullReply.likes_count,
    dislikes: fullReply.dislikes_count,
    isEdited: fullReply.is_edited,
    depth: fullReply.depth,
    parentReplyId: fullReply.parent_reply_id
  };

  return res.status(201).json({
    success: true,
    data: responseReply,
    message: 'Reply created successfully'
  });
}

async function updateReply(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  const { replyId, content } = req.body;

  if (!replyId || !content?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Reply ID and content are required'
    });
  }

  // Get the reply to check ownership
  const replyResult = await pool.query(
    'SELECT r.*, p.is_locked FROM community_replies r JOIN community_posts p ON r.post_id = p.id WHERE r.id = $1 AND r.is_deleted = FALSE',
    [replyId]
  );

  if (replyResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Reply not found'
    });
  }

  const reply = replyResult.rows[0];

  // Check if user owns the reply or is admin/moderator
  if (reply.author_id !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      message: 'You can only edit your own replies'
    });
  }

  // Check if post is locked
  if (reply.is_locked && user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      message: 'This post is locked and replies cannot be edited'
    });
  }

  // Update the reply
  const updateQuery = `
    UPDATE community_replies
    SET content = $1, is_edited = TRUE, edited_at = NOW()
    WHERE id = $2
    RETURNING *
  `;

  const result = await pool.query(updateQuery, [content.trim(), replyId]);

  return res.status(200).json({
    success: true,
    data: result.rows[0],
    message: 'Reply updated successfully'
  });
}

async function deleteReply(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  const { replyId } = req.body;

  if (!replyId) {
    return res.status(400).json({
      success: false,
      message: 'Reply ID is required'
    });
  }

  // Get the reply to check ownership
  const replyResult = await pool.query(
    'SELECT * FROM community_replies WHERE id = $1 AND is_deleted = FALSE',
    [replyId]
  );

  if (replyResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Reply not found'
    });
  }

  const reply = replyResult.rows[0];

  // Check if user owns the reply or is admin/moderator
  if (reply.author_id !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own replies'
    });
  }

  // Soft delete the reply
  await pool.query(
    'UPDATE community_replies SET is_deleted = TRUE WHERE id = $1',
    [replyId]
  );

  // Log moderation action if deleted by moderator
  if (reply.author_id !== user.id) {
    await pool.query(
      'INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason) VALUES ($1, $2, $3, $4, $5)',
      [user.id, 'delete_reply', 'reply', replyId, 'Reply deleted by moderator']
    );
  }

  return res.status(200).json({
    success: true,
    message: 'Reply deleted successfully'
  });
}