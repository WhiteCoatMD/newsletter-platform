import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { method } = req;

    switch (method) {
      case 'GET':
        return await getCategories(req, res);
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({
          success: false,
          message: `Method ${method} not allowed`
        });
    }
  } catch (error) {
    console.error('Community categories API error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

async function getCategories(req: VercelRequest, res: VercelResponse) {
  const { include_stats = 'false' } = req.query;

  let query = `
    SELECT *
    FROM community_categories
    WHERE is_active = TRUE
    ORDER BY display_order ASC, name ASC
  `;

  if (include_stats === 'true') {
    query = `
      SELECT
        c.*,
        COUNT(p.id) as post_count,
        MAX(p.last_activity_at) as last_activity
      FROM community_categories c
      LEFT JOIN community_posts p ON c.name = p.category AND p.is_deleted = FALSE
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.name ASC
    `;
  }

  const result = await pool.query(query);

  const categories = result.rows.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    color: category.color,
    icon: category.icon,
    postCount: include_stats === 'true' ? parseInt(category.post_count || 0) : undefined,
    lastActivity: include_stats === 'true' ? category.last_activity : undefined,
    displayOrder: category.display_order
  }));

  return res.status(200).json({
    success: true,
    data: categories
  });
}