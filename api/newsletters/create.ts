import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { title, content, status = 'draft', scheduledAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Create newsletter object (in a real app, this would save to database)
    const newsletter = {
      id: `newsletter_${Date.now()}`,
      title,
      content,
      status, // 'draft', 'scheduled', 'sent'
      scheduledAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'User', // Would get from auth
      statistics: {
        emailsSent: 0,
        opensCount: 0,
        clicksCount: 0,
        unsubscribes: 0
      }
    };

    // Simulate saving to database
    console.log('Created newsletter:', newsletter);

    res.status(201).json({
      success: true,
      data: newsletter,
      message: `Newsletter ${status === 'draft' ? 'saved as draft' : status === 'scheduled' ? 'scheduled' : 'created'} successfully`
    });

  } catch (error) {
    console.error('Create newsletter error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create newsletter'
    });
  }
}