import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`
    });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Simple hardcoded admin check for now
    if (email === 'mitch@whitecoat-md.com' && password === 'admin123') {
      return res.status(200).json({
        success: true,
        data: {
          token: '68ca06c9182ba9cdc01f135d',
          user: {
            id: '68ca06c9182ba9cdc01f135d',
            email: 'mitch@whitecoat-md.com',
            firstName: 'Mitch',
            lastName: 'Bratton',
            role: 'admin',
            avatarUrl: 'https://ui-avatars.com/api/?name=Mitch+Bratton&background=dc2626&color=fff'
          }
        }
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}