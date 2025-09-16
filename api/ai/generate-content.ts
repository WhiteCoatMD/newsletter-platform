import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateNewsletterContent } from '../../lib/openai';
import { openai } from '../../lib/openai';

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
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    // Use real OpenAI API
    const result = await generateNewsletterContent(prompt, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to generate content'
      });
    }

    let heroImage = null;

    // Generate hero image if requested
    if (options.includeImages) {
      try {
        console.log('Generating hero image for content...');

        const imagePrompt = `Create a professional, modern newsletter hero image about: ${prompt}. Clean visual design with abstract elements, geometric shapes, or relevant illustrations. NO TEXT, NO WORDS, NO LETTERS. Focus on colors, shapes, and visual metaphors only. Suitable for email header.`;

        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1792x1024", // Wide format for newsletter header
          style: "vivid",
          quality: "standard"
        });

        if (imageResponse.data[0]?.url) {
          heroImage = {
            url: imageResponse.data[0].url,
            prompt: imagePrompt,
            size: "1792x1024"
          };
          console.log('Hero image generated successfully');
        }
      } catch (imageError) {
        console.error('Image generation failed:', imageError);
        // Continue without image - don't fail the whole request
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...result.data,
        heroImage
      }
    });

  } catch (error) {
    console.error('Generate content error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}