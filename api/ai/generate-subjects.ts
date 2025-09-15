import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateSubjectLines } from '../../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { content, options = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const count = options.count || 5;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to mock response
      const mockSubjects = [
        "🚀 Your Weekly Tech Update is Here",
        "Don't Miss: This Week's Biggest Trends",
        "Breaking: Industry Insights You Need",
        "Weekly Roundup: What's Trending Now",
        "Must-Read: This Week's Key Updates"
      ].slice(0, count);

      return res.status(200).json({
        success: true,
        data: mockSubjects
      });
    }

    const result = await generateSubjectLines(content, count);

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
    console.error('Generate subjects error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}