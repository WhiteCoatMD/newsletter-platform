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

function requireModerator(user: any) {
  if (user.role !== 'admin' && user.role !== 'moderator') {
    throw new Error('Moderator privileges required');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;
    const { action } = req.query;

    switch (method) {
      case 'GET':
        if (action === 'reports') {
          return await getReports(req, res);
        } else if (action === 'actions') {
          return await getModerationActions(req, res);
        }
        return await getGeneralModerationData(req, res);
      case 'POST':
        if (action === 'report') {
          return await createReport(req, res);
        } else if (action === 'moderate') {
          return await moderateContent(req, res);
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid action parameter'
        });
      case 'PUT':
        return await updateReport(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Moderation API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function getReports(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  requireModerator(user);

  const { status = 'all', priority = 'all', page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (status !== 'all') {
    whereClause += ` AND mr.status = $${paramIndex}`;
    queryParams.push(status);
    paramIndex++;
  }

  if (priority !== 'all') {
    whereClause += ` AND mr.priority = $${paramIndex}`;
    queryParams.push(priority);
    paramIndex++;
  }

  const query = `
    SELECT
      mr.*,
      reporter.name as reporter_name,
      reporter.avatar_url as reporter_avatar,
      moderator.name as moderator_name,
      CASE
        WHEN mr.target_type = 'post' THEN (
          SELECT jsonb_build_object(
            'title', p.title,
            'author_name', pu.name,
            'content_preview', LEFT(p.content, 200)
          )
          FROM community_posts p
          JOIN users pu ON p.author_id = pu.id
          WHERE p.id = mr.target_id
        )
        WHEN mr.target_type = 'reply' THEN (
          SELECT jsonb_build_object(
            'content_preview', LEFT(r.content, 200),
            'author_name', ru.name,
            'post_title', p.title
          )
          FROM community_replies r
          JOIN users ru ON r.author_id = ru.id
          JOIN community_posts p ON r.post_id = p.id
          WHERE r.id = mr.target_id
        )
        WHEN mr.target_type = 'user' THEN (
          SELECT jsonb_build_object(
            'name', u.name,
            'email', u.email,
            'role', u.role
          )
          FROM users u
          WHERE u.id = mr.target_id
        )
      END as target_info
    FROM moderation_reports mr
    LEFT JOIN users reporter ON mr.reporter_id = reporter.id
    LEFT JOIN users moderator ON mr.moderator_id = moderator.id
    ${whereClause}
    ORDER BY
      CASE mr.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      mr.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(Number(limit), offset);

  const result = await pool.query(query, queryParams);

  // Get total count
  const countQuery = `
    SELECT COUNT(*)
    FROM moderation_reports mr
    ${whereClause}
  `;
  const countParams = queryParams.slice(0, -2);
  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  const reports = result.rows.map(report => ({
    id: report.id,
    type: 'report',
    title: getReportTitle(report),
    description: report.description || report.reason,
    reporter: report.reporter_id ? {
      name: report.reporter_name,
      avatar: report.reporter_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(report.reporter_name)}`
    } : null,
    target: {
      type: report.target_type,
      id: report.target_id,
      ...report.target_info
    },
    reason: report.reason,
    priority: report.priority,
    status: report.status,
    moderator: report.moderator_name,
    moderatorNotes: report.moderator_notes,
    createdAt: report.created_at,
    resolvedAt: report.resolved_at
  }));

  return res.status(200).json({
    success: true,
    data: {
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    }
  });
}

function getReportTitle(report: any) {
  switch (report.target_type) {
    case 'post':
      return 'Reported Post';
    case 'reply':
      return 'Reported Reply';
    case 'user':
      return 'Reported User';
    default:
      return 'Content Report';
  }
}

async function createReport(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  const { targetType, targetId, reason, description, priority = 'medium' } = req.body;

  if (!targetType || !targetId || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Target type, target ID, and reason are required'
    });
  }

  if (!['post', 'reply', 'user'].includes(targetType)) {
    return res.status(400).json({
      success: false,
      message: 'Target type must be "post", "reply", or "user"'
    });
  }

  // Check if target exists
  let targetExists = false;
  if (targetType === 'post') {
    const result = await pool.query(
      'SELECT id FROM community_posts WHERE id = $1',
      [targetId]
    );
    targetExists = result.rows.length > 0;
  } else if (targetType === 'reply') {
    const result = await pool.query(
      'SELECT id FROM community_replies WHERE id = $1',
      [targetId]
    );
    targetExists = result.rows.length > 0;
  } else if (targetType === 'user') {
    const result = await pool.query(
      'SELECT id FROM users WHERE id = $1',
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

  // Check for duplicate reports
  const duplicateResult = await pool.query(
    'SELECT id FROM moderation_reports WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3 AND status IN (\'pending\', \'reviewing\')',
    [user.id, targetType, targetId]
  );

  if (duplicateResult.rows.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'You have already reported this content'
    });
  }

  const query = `
    INSERT INTO moderation_reports (reporter_id, target_type, target_id, reason, description, priority)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const result = await pool.query(query, [
    user.id,
    targetType,
    targetId,
    reason,
    description || null,
    priority
  ]);

  return res.status(201).json({
    success: true,
    data: result.rows[0],
    message: 'Report submitted successfully'
  });
}

async function moderateContent(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  requireModerator(user);

  const { actionType, targetType, targetId, reason, metadata = {} } = req.body;

  if (!actionType || !targetType || !targetId) {
    return res.status(400).json({
      success: false,
      message: 'Action type, target type, and target ID are required'
    });
  }

  // Execute the moderation action
  let actionResult = '';

  switch (actionType) {
    case 'pin':
      if (targetType === 'post') {
        await pool.query('UPDATE community_posts SET is_pinned = TRUE WHERE id = $1', [targetId]);
        actionResult = 'Post pinned successfully';
      }
      break;

    case 'unpin':
      if (targetType === 'post') {
        await pool.query('UPDATE community_posts SET is_pinned = FALSE WHERE id = $1', [targetId]);
        actionResult = 'Post unpinned successfully';
      }
      break;

    case 'lock':
      if (targetType === 'post') {
        await pool.query('UPDATE community_posts SET is_locked = TRUE WHERE id = $1', [targetId]);
        actionResult = 'Post locked successfully';
      }
      break;

    case 'unlock':
      if (targetType === 'post') {
        await pool.query('UPDATE community_posts SET is_locked = FALSE WHERE id = $1', [targetId]);
        actionResult = 'Post unlocked successfully';
      }
      break;

    case 'feature':
      if (targetType === 'post') {
        await pool.query('UPDATE community_posts SET is_featured = TRUE WHERE id = $1', [targetId]);
        actionResult = 'Post featured successfully';
      }
      break;

    case 'unfeature':
      if (targetType === 'post') {
        await pool.query('UPDATE community_posts SET is_featured = FALSE WHERE id = $1', [targetId]);
        actionResult = 'Post unfeatured successfully';
      }
      break;

    case 'delete':
      if (targetType === 'post') {
        await pool.query('UPDATE community_posts SET is_deleted = TRUE WHERE id = $1', [targetId]);
        actionResult = 'Post deleted successfully';
      } else if (targetType === 'reply') {
        await pool.query('UPDATE community_replies SET is_deleted = TRUE WHERE id = $1', [targetId]);
        actionResult = 'Reply deleted successfully';
      }
      break;

    case 'ban_user':
      if (targetType === 'user') {
        const banDuration = metadata.duration || 7; // days
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + banDuration);

        await pool.query(
          'UPDATE users SET is_banned = TRUE, banned_until = $1 WHERE id = $2',
          [banUntil, targetId]
        );
        actionResult = `User banned for ${banDuration} days`;
      }
      break;

    case 'unban_user':
      if (targetType === 'user') {
        await pool.query(
          'UPDATE users SET is_banned = FALSE, banned_until = NULL WHERE id = $1',
          [targetId]
        );
        actionResult = 'User unbanned successfully';
      }
      break;

    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid action type'
      });
  }

  // Log the moderation action
  await pool.query(
    'INSERT INTO moderation_actions (moderator_id, action_type, target_type, target_id, reason, metadata) VALUES ($1, $2, $3, $4, $5, $6)',
    [user.id, actionType, targetType, targetId, reason || null, JSON.stringify(metadata)]
  );

  return res.status(200).json({
    success: true,
    message: actionResult
  });
}

async function updateReport(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  requireModerator(user);

  const { reportId, status, moderatorNotes } = req.body;

  if (!reportId || !status) {
    return res.status(400).json({
      success: false,
      message: 'Report ID and status are required'
    });
  }

  if (!['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }

  const updateFields = ['status = $2', 'moderator_id = $3'];
  const values = [reportId, status, user.id];
  let paramIndex = 4;

  if (moderatorNotes !== undefined) {
    updateFields.push(`moderator_notes = $${paramIndex}`);
    values.push(moderatorNotes);
    paramIndex++;
  }

  if (status === 'resolved' || status === 'dismissed') {
    updateFields.push(`resolved_at = NOW()`);
  }

  const query = `
    UPDATE moderation_reports
    SET ${updateFields.join(', ')}
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: result.rows[0],
    message: 'Report updated successfully'
  });
}

async function getModerationActions(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  requireModerator(user);

  const { page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const query = `
    SELECT
      ma.*,
      u.name as moderator_name
    FROM moderation_actions ma
    JOIN users u ON ma.moderator_id = u.id
    ORDER BY ma.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await pool.query(query, [Number(limit), offset]);

  return res.status(200).json({
    success: true,
    data: result.rows
  });
}

async function getGeneralModerationData(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header required'
    });
  }

  const user = await getUserFromToken(authHeader);
  requireModerator(user);

  // Get various moderation statistics
  const stats = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM moderation_reports WHERE status = $1', ['pending']),
    pool.query('SELECT COUNT(*) as count FROM moderation_reports WHERE status = $1', ['reviewing']),
    pool.query('SELECT COUNT(*) as count FROM moderation_reports WHERE priority = $1 AND status IN ($2, $3)', ['urgent', 'pending', 'reviewing']),
    pool.query('SELECT COUNT(*) as count FROM users WHERE is_banned = TRUE'),
    pool.query('SELECT COUNT(*) as count FROM community_posts WHERE is_deleted = TRUE'),
    pool.query('SELECT COUNT(*) as count FROM community_replies WHERE is_deleted = TRUE')
  ]);

  return res.status(200).json({
    success: true,
    data: {
      pendingReports: parseInt(stats[0].rows[0].count),
      reviewingReports: parseInt(stats[1].rows[0].count),
      urgentReports: parseInt(stats[2].rows[0].count),
      bannedUsers: parseInt(stats[3].rows[0].count),
      deletedPosts: parseInt(stats[4].rows[0].count),
      deletedReplies: parseInt(stats[5].rows[0].count)
    }
  });
}