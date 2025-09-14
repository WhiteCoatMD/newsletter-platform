const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

class AIService {
  // Generate newsletter content based on topic
  async generateNewsletterContent(prompt, options = {}) {
    try {
      const {
        tone = 'professional',
        length = 'medium',
        includeIntro = true,
        includeConclusion = true,
        targetAudience = 'general'
      } = options;

      const systemPrompt = `You are an expert newsletter writer. Create engaging, well-structured newsletter content that is ${tone} in tone and ${length} in length. Target audience: ${targetAudience}.

Format the response as a structured newsletter with:
- A compelling headline
- ${includeIntro ? 'An engaging introduction' : ''}
- Well-organized main content with clear sections
- ${includeConclusion ? 'A strong conclusion with call-to-action' : ''}

Use HTML formatting for better presentation.`;

      const completion = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: length === 'short' ? 800 : length === 'long' ? 2000 : 1200,
        temperature: 0.7,
      });

      const content = completion.data.choices[0].message.content;

      // Extract headline and content
      const lines = content.split('\n');
      const headline = lines.find(line => line.includes('<h1>') || line.startsWith('# ')) || 'Generated Newsletter';
      const bodyContent = content.replace(headline, '').trim();

      return {
        success: true,
        data: {
          headline: headline.replace(/<[^>]*>/g, '').replace('# ', ''),
          content: bodyContent,
          wordCount: bodyContent.split(' ').length,
          readingTime: Math.ceil(bodyContent.split(' ').length / 200)
        }
      };

    } catch (error) {
      console.error('AI content generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate subject lines for A/B testing
  async generateSubjectLines(content, count = 5) {
    try {
      const prompt = `Based on the following newsletter content, generate ${count} compelling subject lines that would make people want to open the email. Make them diverse in style (some direct, some curiosity-driven, some benefit-focused).

Content preview: ${content.substring(0, 500)}...

Return only the subject lines, one per line, without numbering.`;

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.8,
      });

      const subjectLines = completion.data.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .slice(0, count);

      return {
        success: true,
        data: subjectLines
      };

    } catch (error) {
      console.error('AI subject line generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Improve existing content
  async improveContent(content, improvementType = 'general') {
    try {
      let systemPrompt = '';

      switch (improvementType) {
        case 'engagement':
          systemPrompt = 'Improve this newsletter content to make it more engaging. Add storytelling elements, questions, and interactive language while maintaining the core message.';
          break;
        case 'clarity':
          systemPrompt = 'Improve this newsletter content for clarity and readability. Simplify complex sentences, improve structure, and make the message clearer.';
          break;
        case 'persuasion':
          systemPrompt = 'Improve this newsletter content to be more persuasive. Add compelling arguments, social proof elements, and stronger calls-to-action.';
          break;
        default:
          systemPrompt = 'Improve this newsletter content overall. Enhance readability, engagement, and effectiveness while maintaining the original tone and message.';
      }

      const completion = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content }
        ],
        max_tokens: 1500,
        temperature: 0.6,
      });

      return {
        success: true,
        data: {
          improvedContent: completion.data.choices[0].message.content,
          improvementType
        }
      };

    } catch (error) {
      console.error('AI content improvement error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate newsletter outline from topic
  async generateOutline(topic, options = {}) {
    try {
      const { sections = 5, audience = 'general', format = 'educational' } = options;

      const prompt = `Create a detailed outline for a ${format} newsletter about "${topic}" targeting ${audience} audience.

Generate ${sections} main sections with:
- Section title
- 2-3 key points for each section
- Suggested content type (text, image, quote, etc.)

Format as JSON with this structure:
{
  "title": "Newsletter Title",
  "sections": [
    {
      "title": "Section Title",
      "points": ["point 1", "point 2"],
      "contentType": "text"
    }
  ]
}`;

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      });

      const outline = JSON.parse(completion.data.choices[0].message.content);

      return {
        success: true,
        data: outline
      };

    } catch (error) {
      console.error('AI outline generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate content for specific section
  async generateSectionContent(sectionTitle, points, contentType = 'text') {
    try {
      const prompt = `Write engaging newsletter content for the section "${sectionTitle}".

Key points to cover:
${points.map(point => `- ${point}`).join('\n')}

Content type: ${contentType}
Make it engaging and well-formatted with HTML tags.`;

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      });

      return {
        success: true,
        data: {
          content: completion.data.choices[0].message.content,
          sectionTitle,
          contentType
        }
      };

    } catch (error) {
      console.error('AI section content generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Analyze content sentiment and suggestions
  async analyzeContent(content) {
    try {
      const prompt = `Analyze the following newsletter content and provide:
1. Overall sentiment (positive/neutral/negative)
2. Reading difficulty level (easy/medium/hard)
3. Estimated engagement score (1-10)
4. 3 specific improvement suggestions
5. Target audience assessment

Content: ${content}

Format as JSON with this structure:
{
  "sentiment": "positive",
  "difficulty": "medium",
  "engagementScore": 7,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "targetAudience": "professionals"
}`;

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.3,
      });

      const analysis = JSON.parse(completion.data.choices[0].message.content);

      return {
        success: true,
        data: analysis
      };

    } catch (error) {
      console.error('AI content analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AIService();