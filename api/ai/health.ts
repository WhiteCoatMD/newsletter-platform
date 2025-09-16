import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Simulate AI system health check
    const healthData = {
      providerHealth: [
        {
          provider: 'openai',
          available: true,
          successRate: 0.98,
          avgResponseTime: 2.3,
          lastCheck: new Date().toISOString()
        },
        {
          provider: 'anthropic',
          available: true,
          successRate: 0.96,
          avgResponseTime: 1.8,
          lastCheck: new Date().toISOString()
        }
      ],
      taskAnalytics: {
        content_generation: {
          total: 324,
          successful: 318,
          failed: 6,
          avgDuration: 8.2
        },
        image_generation: {
          total: 156,
          successful: 148,
          failed: 8,
          avgDuration: 12.5
        },
        audio_generation: {
          total: 45,
          successful: 43,
          failed: 2,
          avgDuration: 15.8
        },
        seo_generation: {
          total: 89,
          successful: 87,
          failed: 2,
          avgDuration: 6.1
        }
      },
      systemMetrics: {
        uptime: '99.8%',
        totalRequests: 614,
        totalSuccessful: 596,
        errorRate: 2.9,
        avgResponseTime: 8.7
      },
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: healthData,
      message: 'AI system health retrieved successfully'
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve system health'
    });
  }
}