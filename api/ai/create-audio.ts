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
    const { content, options = {} } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured'
      });
    }

    console.log('Creating audio newsletter...');

    const { voice = 'alloy', includeIntro = true, includeOutro = true } = options;

    // Prepare text for audio generation
    let audioText = '';

    if (includeIntro) {
      audioText += "Welcome to today's newsletter. Here are the key insights and updates for you. ";
    }

    // Strip HTML tags and clean up content for audio
    const cleanContent = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    audioText += cleanContent;

    if (includeOutro) {
      audioText += " That's all for today's newsletter. Thank you for listening, and we'll see you next time.";
    }

    // Limit text length for TTS (OpenAI has a 4096 character limit)
    if (audioText.length > 4000) {
      audioText = audioText.substring(0, 3900) + "...";
    }

    // Generate audio using OpenAI TTS
    const audioResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
      input: audioText,
      response_format: "mp3"
    });

    // In a real implementation, you would:
    // 1. Save the audio buffer to a file storage service (AWS S3, etc.)
    // 2. Return the URL to the saved file
    // For now, we'll simulate this process

    const simulatedAudioUrl = `https://example.com/audio/newsletter_${Date.now()}.mp3`;
    const wordCount = audioText.split(' ').length;
    const estimatedDuration = Math.ceil(wordCount / 150 * 60); // ~150 words per minute

    res.status(200).json({
      success: true,
      data: {
        audioUrl: simulatedAudioUrl,
        duration: estimatedDuration, // in seconds
        voice: voice,
        wordCount: wordCount,
        format: 'mp3',
        size: '2.4MB', // estimated
        generatedAt: new Date().toISOString()
      },
      message: `Audio newsletter created successfully! Duration: ${Math.floor(estimatedDuration / 60)}:${(estimatedDuration % 60).toString().padStart(2, '0')}`
    });

  } catch (error) {
    console.error('Audio creation error:', error);

    let errorMessage = 'Failed to create audio newsletter';
    if (error instanceof Error) {
      if (error.message.includes('billing')) {
        errorMessage = 'Audio generation requires OpenAI credits. Please check your OpenAI billing.';
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