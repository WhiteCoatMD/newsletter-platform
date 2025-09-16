import type { VercelRequest, VercelResponse } from '@vercel/node';
import { openai } from '../../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { prompt, size = '1024x1024', style = 'vivid' } = req.body;

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

    console.log('Generating image with prompt:', prompt);

    // Generate image using DALL-E
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a professional, modern newsletter hero image about: ${prompt}. Clean visual design with abstract elements, geometric shapes, or relevant illustrations. NO TEXT, NO WORDS, NO LETTERS anywhere in the image. Focus on colors, shapes, and visual metaphors only. Suitable for email header.`,
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      style: style as "vivid" | "natural",
      quality: "standard"
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        prompt: prompt,
        size: size,
        style: style,
        model: "dall-e-3"
      }
    });

  } catch (error) {
    console.error('Image generation error:', error);

    let errorMessage = 'Failed to generate image';
    if (error instanceof Error) {
      if (error.message.includes('billing')) {
        errorMessage = 'Image generation requires OpenAI credits. Please check your OpenAI billing.';
      } else if (error.message.includes('safety')) {
        errorMessage = 'Image prompt was filtered for safety. Try a different description.';
      } else {
        errorMessage = error.message;
      }
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
}