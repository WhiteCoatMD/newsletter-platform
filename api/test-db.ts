import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test basic database connection
    const result = await pool.query('SELECT NOW() as current_time');

    // Test if users table exists
    const usersTest = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'users'");

    // Test if community tables exist
    const communityTest = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'community_posts'");

    return res.status(200).json({
      success: true,
      database_time: result.rows[0].current_time,
      users_table_exists: usersTest.rows.length > 0,
      community_posts_table_exists: communityTest.rows.length > 0,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
}