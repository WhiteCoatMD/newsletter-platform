import OpenAI from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateNewsletterContent(prompt: string, options: any = {}) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert newsletter content creator. Generate engaging, well-structured newsletter content that captivates readers.
          Format your response as HTML with proper headings, paragraphs, and lists.
          Focus on delivering value and actionable insights.
          Keep the tone professional yet approachable.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 1500,
      temperature: options.temperature || 0.7,
    });

    const content = completion.choices[0]?.message?.content || '';
    const wordCount = content.split(' ').length;
    const estimatedReadTime = Math.ceil(wordCount / 200); // 200 words per minute

    return {
      success: true,
      data: {
        title: extractTitle(content) || "Newsletter Content",
        content: content,
        wordCount: wordCount,
        estimatedReadTime: `${estimatedReadTime} minute${estimatedReadTime !== 1 ? 's' : ''}`,
        model: completion.model,
        usage: completion.usage
      }
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate content'
    };
  }
}

export async function generateSubjectLines(content: string, count: number = 5) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert email marketer. Generate compelling subject lines that maximize open rates.
          Create subject lines that are:
          - Attention-grabbing but not clickbait
          - Clear and specific
          - Between 30-50 characters
          - Emotionally engaging
          Return only the subject lines, one per line, numbered.`
        },
        {
          role: "user",
          content: `Generate ${count} compelling subject lines for this newsletter content: ${content.substring(0, 500)}...`
        }
      ],
      max_tokens: 300,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content || '';
    const subjectLines = response
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, count);

    return {
      success: true,
      data: subjectLines
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate subject lines'
    };
  }
}

export async function improveContent(content: string, improvementType: string = 'general') {
  try {
    const improvementPrompts = {
      general: "Improve this content to be more engaging, clear, and compelling while maintaining its core message.",
      clarity: "Rewrite this content to be clearer and more understandable, removing jargon and simplifying complex concepts.",
      engagement: "Make this content more engaging and compelling, adding hooks and elements that capture reader attention.",
      professional: "Polish this content to be more professional and authoritative while maintaining readability.",
      concise: "Make this content more concise and impactful, removing unnecessary words while preserving key information."
    };

    const prompt = improvementPrompts[improvementType as keyof typeof improvementPrompts] || improvementPrompts.general;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert content editor and copywriter. Your task is to improve newsletter content based on specific criteria.
          Maintain the original structure and key points while enhancing readability and impact.
          Return the improved content in HTML format.`
        },
        {
          role: "user",
          content: `${prompt}\n\nOriginal content:\n${content}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.5,
    });

    const improvedContent = completion.choices[0]?.message?.content || content;
    const wordCount = improvedContent.split(' ').length;

    return {
      success: true,
      data: {
        content: improvedContent,
        wordCount: wordCount,
        improvementType: improvementType,
        originalWordCount: content.split(' ').length
      }
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to improve content'
    };
  }
}

// Helper function to extract title from content
function extractTitle(content: string): string | null {
  const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) return h1Match[1].replace(/<[^>]*>/g, '');

  const h2Match = content.match(/<h2[^>]*>(.*?)<\/h2>/i);
  if (h2Match) return h2Match[1].replace(/<[^>]*>/g, '');

  return null;
}