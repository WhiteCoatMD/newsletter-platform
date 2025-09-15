import type { VercelRequest, VercelResponse } from '@vercel/node';
import { improveContent } from '../../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { content, improvementType = 'general' } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to mock response
      const improvedContent = `<h2>Improved Content</h2>
      <p>Your content has been enhanced for better engagement and clarity.</p>
      <p>Original content: ${content.substring(0, 100)}...</p>
      <p><strong>Improvements made:</strong></p>
      <ul>
        <li>Enhanced readability and flow</li>
        <li>Stronger calls to action</li>
        <li>More engaging language</li>
      </ul>
      <p><em>Note: Configure OPENAI_API_KEY environment variable to use real AI improvement.</em></p>`;

      return res.status(200).json({
        success: true,
        data: {
          content: improvedContent,
          wordCount: improvedContent.split(' ').length,
          improvementType: improvementType,
          originalWordCount: content.split(' ').length
        }
      });
    }

    const result = await improveContent(content, improvementType);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Improve content error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}