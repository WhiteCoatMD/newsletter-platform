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
        return await createInteraction(req, res);
      case 'DELETE':
        return await deleteInteraction(req, res);
      case 'GET':
        return await getUserInteractions(req, res);
      default:
        res.setHeader('Allow', ['POST', 'DELETE', 'GET']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Community interactions API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function createInteraction(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  const { targetType, targetId, interactionType } = req.body;

  if (!targetType || !targetId || !interactionType) {
    return res.status(400).json({
      success: false,
      message: 'Target type, target ID, and interaction type are required'
    });
  }

  if (!['post', 'reply'].includes(targetType)) {
    return res.status(400).json({
      success: false,
      message: 'Target type must be "post" or "reply"'
    });
  }

  if (!['like', 'dislike', 'bookmark'].includes(interactionType)) {
    return res.status(400).json({
      success: false,
      message: 'Interaction type must be "like", "dislike", or "bookmark"'
    });
  }

  // Check if target exists
  let targetExists = false;
  if (targetType === 'post') {
    const result = await pool.query(
      'SELECT id FROM community_posts WHERE id = $1 AND is_deleted = FALSE',
      [targetId]
    );
    targetExists = result.rows.length > 0;
  } else if (targetType === 'reply') {
    const result = await pool.query(
      'SELECT id FROM community_replies WHERE id = $1 AND is_deleted = FALSE',
      [targetId]
    );
    targetExists = result.rows.length > 0;
  }

  if (!targetExists) {
    return res.status(404).json({
      success: false,
      message: `${targetType} not found`
    });
  }

  // For like/dislike, remove opposite interaction first
  if (interactionType === 'like' || interactionType === 'dislike') {
    const oppositeType = interactionType === 'like' ? 'dislike' : 'like';
    await pool.query(
      'DELETE FROM community_interactions WHERE user_id = $1 AND target_type = $2 AND target_id = $3 AND interaction_type = $4',
      [user.id, targetType, targetId, oppositeType]
    );
  }

  // Insert or update the interaction
  const query = `
    INSERT INTO community_interactions (user_id, target_type, target_id, interaction_type)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, target_type, target_id, interaction_type) DO NOTHING
    RETURNING *
  `;

  const result = await pool.query(query, [user.id, targetType, targetId, interactionType]);

  const isNewInteraction = result.rows.length > 0;

  // Get updated counts
  let counts = {};
  if (targetType === 'post') {
    const countResult = await pool.query(
      'SELECT likes_count, dislikes_count, views_count FROM community_posts WHERE id = $1',
      [targetId]
    );
    counts = countResult.rows[0];
  } else if (targetType === 'reply') {
    const countResult = await pool.query(
      'SELECT likes_count, dislikes_count FROM community_replies WHERE id = $1',
      [targetId]
    );
    counts = countResult.rows[0];
  }

  return res.status(200).json({
    success: true,
    data: {
      interactionType,
      isNewInteraction,
      counts
    },
    message: isNewInteraction
      ? `${interactionType} added successfully`
      : `You have already ${interactionType}d this ${targetType}`
  });
}

async function deleteInteraction(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  const { targetType, targetId, interactionType } = req.body;

  if (!targetType || !targetId || !interactionType) {
    return res.status(400).json({
      success: false,
      message: 'Target type, target ID, and interaction type are required'
    });
  }

  const result = await pool.query(
    'DELETE FROM community_interactions WHERE user_id = $1 AND target_type = $2 AND target_id = $3 AND interaction_type = $4 RETURNING *',
    [user.id, targetType, targetId, interactionType]
  );

  const wasRemoved = result.rows.length > 0;

  // Get updated counts
  let counts = {};
  if (targetType === 'post') {
    const countResult = await pool.query(
      'SELECT likes_count, dislikes_count, views_count FROM community_posts WHERE id = $1',
      [targetId]
    );
    counts = countResult.rows[0];
  } else if (targetType === 'reply') {
    const countResult = await pool.query(
      'SELECT likes_count, dislikes_count FROM community_replies WHERE id = $1',
      [targetId]
    );
    counts = countResult.rows[0];
  }

  return res.status(200).json({
    success: true,
    data: {
      interactionType,
      wasRemoved,
      counts
    },
    message: wasRemoved
      ? `${interactionType} removed successfully`
      : `No ${interactionType} found to remove`
  });
}

async function getUserInteractions(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  const { targetType, targetIds } = req.query;

  if (!targetType || !targetIds) {
    return res.status(400).json({
      success: false,
      message: 'Target type and target IDs are required'
    });
  }

  const ids = Array.isArray(targetIds) ? targetIds : [targetIds];

  const query = `
    SELECT target_id, interaction_type
    FROM community_interactions
    WHERE user_id = $1 AND target_type = $2 AND target_id = ANY($3)
  `;

  const result = await pool.query(query, [user.id, targetType, ids]);

  // Group interactions by target ID
  const interactions = {};
  result.rows.forEach(row => {
    if (!interactions[row.target_id]) {
      interactions[row.target_id] = [];
    }
    interactions[row.target_id].push(row.interaction_type);
  });

  return res.status(200).json({
    success: true,
    data: interactions
  });
}