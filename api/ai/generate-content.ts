import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateNewsletterContent } from '../../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { prompt, options = {} } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to mock response if no API key
      const mockContent = {
        title: "AI-Generated Newsletter Content",
        content: `<h2>Weekly Tech Insights</h2>
        <p>Based on your prompt: "${prompt}"</p>
        <p>Here's some engaging newsletter content that would captivate your audience:</p>
        <ul>
          <li>Key industry trends and developments</li>
          <li>Actionable insights for your readers</li>
          <li>Expert opinions and analysis</li>
        </ul>
        <p>This content is optimized for engagement and designed to drive meaningful interactions with your subscribers.</p>
        <p><em>Note: Configure OPENAI_API_KEY environment variable to use real AI generation.</em></p>`,
        wordCount: 85,
        estimatedReadTime: "2 minutes"
      };

      return res.status(200).json({
        success: true,
        data: mockContent
      });
    }

    // Use real OpenAI API
    const result = await generateNewsletterContent(prompt, options);

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
    console.error('Generate content error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}