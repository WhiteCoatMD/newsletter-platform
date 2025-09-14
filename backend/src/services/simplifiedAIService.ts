import { OpenAIProvider, ClaudeProvider } from './aiProviders';

interface AITaskOptions {
  tone?: string;
  length?: string;
  targetAudience?: string;
  vertical?: 'health' | 'finance' | 'general';
  focus?: 'engagement' | 'clarity' | 'persuasion';
}

class SimplifiedAIService {
  private openai: OpenAIProvider;
  private claude?: ClaudeProvider;
  private brandConstitution: string;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAIProvider(process.env.OPENAI_API_KEY);

    if (process.env.ANTHROPIC_API_KEY) {
      this.claude = new ClaudeProvider(process.env.ANTHROPIC_API_KEY);
    }

    this.brandConstitution = process.env.BRAND_CONSTITUTION || `
      We are a professional, helpful, and engaging newsletter platform.
      Our tone is friendly but authoritative, approachable but expert.
      We focus on providing value, actionable insights, and building genuine relationships with our readers.
      We avoid hype, exaggerated claims, and overly promotional language.
      Our content should be clear, well-structured, and immediately valuable.
    `;
  }

  // OpenAI - Primary for content generation, images, audio
  async generateContent(prompt: string, options: AITaskOptions = {}) {
    try {
      const { tone = 'professional', length = 'medium', targetAudience = 'general' } = options;

      // Use structured generation for better results
      const schema = {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Compelling newsletter title' },
          content: { type: 'string', description: 'Main newsletter content in HTML' },
          excerpt: { type: 'string', description: 'Brief excerpt or preview' },
          readingTime: { type: 'number', description: 'Estimated reading time in minutes' },
          ctas: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                placement: { type: 'string' }
              }
            }
          }
        }
      };

      const fullPrompt = `${this.brandConstitution}

Generate a ${tone} newsletter that is ${length} in length for ${targetAudience} audience.

Topic: ${prompt}

Create engaging, well-structured content with clear value proposition.`;

      const result = await this.openai.generateStructuredContent(fullPrompt, schema);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Content generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content generation failed'
      };
    }
  }

  async generateSubjectLines(content: string, count: number = 5) {
    try {
      const subjectLines = await this.openai.generateSubjectLineVariants(content, count);

      return {
        success: true,
        data: subjectLines
      };
    } catch (error) {
      console.error('Subject line generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Subject line generation failed'
      };
    }
  }

  async generateImage(prompt: string) {
    try {
      const image = await this.openai.generateImage({
        prompt: `Professional newsletter hero image: ${prompt}`,
        size: '1792x1024',
        quality: 'hd',
        style: 'natural'
      });

      return {
        success: true,
        data: image
      };
    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed'
      };
    }
  }

  async createAudioNewsletter(content: string, voice: string = 'alloy') {
    try {
      const audioBuffer = await this.openai.textToSpeech(content, voice);

      // In production, save to file storage and return URL
      const audioUrl = `/api/audio/${Date.now()}.mp3`;

      return {
        success: true,
        data: {
          audioUrl,
          audioBuffer,
          duration: this.estimateAudioDuration(content),
          voice,
          wordCount: content.split(' ').length
        }
      };
    } catch (error) {
      console.error('Audio generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Audio generation failed'
      };
    }
  }

  async transcribeAudio(audioBuffer: Buffer, format: string) {
    try {
      const transcription = await this.openai.transcribeAudio({
        audioBuffer,
        format,
        model: 'whisper-1'
      });

      return {
        success: true,
        data: transcription
      };
    } catch (error) {
      console.error('Transcription error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed'
      };
    }
  }

  // Claude - Secondary for editing, compliance, refinement
  async improveContent(content: string, options: AITaskOptions = {}) {
    try {
      if (!this.claude) {
        // Fallback to OpenAI if Claude not available
        const response = await this.openai.createCompletion([
          { role: 'system', content: `${this.brandConstitution}\n\nImprove this newsletter content for better ${options.focus || 'engagement'}.` },
          { role: 'user', content: content }
        ], { temperature: 0.4, maxTokens: 2000 });

        return {
          success: true,
          data: {
            improvedContent: response.content,
            improvements: ['Content improved for better engagement']
          }
        };
      }

      const { focus = 'engagement' } = options;

      const result = await this.claude.refineLongForm(content, content.split(' ').length, focus);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Content improvement error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content improvement failed'
      };
    }
  }

  async checkCompliance(content: string, vertical: 'health' | 'finance' | 'general' = 'general') {
    try {
      if (!this.claude) {
        // Basic compliance check with OpenAI
        const response = await this.openai.createCompletion([
          { role: 'user', content: `Review this ${vertical} newsletter content for compliance issues and provide suggestions: ${content}` }
        ], { temperature: 0.1, maxTokens: 500 });

        return {
          success: true,
          data: {
            isCompliant: !response.content.toLowerCase().includes('issue'),
            issues: [],
            suggestions: [response.content],
            riskLevel: 'medium' as const
          }
        };
      }

      const result = await this.claude.checkCompliance(content, vertical);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Compliance check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Compliance check failed'
      };
    }
  }

  async transformToBrandVoice(content: string) {
    try {
      if (!this.claude) {
        // Fallback to OpenAI
        const response = await this.openai.createCompletion([
          { role: 'system', content: this.brandConstitution },
          { role: 'user', content: `Transform this content to match our brand voice: ${content}` }
        ], { temperature: 0.4, maxTokens: 1500 });

        return {
          success: true,
          data: {
            transformedContent: response.content,
            brandAlignment: 8,
            changes: ['Content aligned with brand voice']
          }
        };
      }

      const result = await this.claude.transformToBrandVoice(content, this.brandConstitution);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Brand voice transformation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Brand voice transformation failed'
      };
    }
  }

  // Combined workflows
  async generateAndImprove(prompt: string, options: AITaskOptions = {}) {
    try {
      // Step 1: Generate initial content with OpenAI
      const contentResult = await this.generateContent(prompt, options);
      if (!contentResult.success) {
        return contentResult;
      }

      let finalContent = contentResult.data.content;

      // Step 2: Check compliance if Claude is available
      if (this.claude && options.vertical) {
        const complianceResult = await this.checkCompliance(finalContent, options.vertical);
        if (complianceResult.success && complianceResult.data && !complianceResult.data.isCompliant) {
          // If compliance issues, suggest improvements
          contentResult.data.complianceIssues = complianceResult.data.issues;
        }
      }

      // Step 3: Apply brand voice transformation if Claude is available
      if (this.claude) {
        const brandResult = await this.transformToBrandVoice(finalContent);
        if (brandResult.success && brandResult.data) {
          finalContent = brandResult.data.transformedContent;
        }
      }

      return {
        success: true,
        data: {
          ...contentResult.data,
          content: finalContent,
          workflow: 'generated_and_improved'
        }
      };
    } catch (error) {
      console.error('Generate and improve error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generate and improve failed'
      };
    }
  }

  // System health
  getSystemHealth() {
    return {
      openai: {
        available: !!this.openai,
        features: ['content_generation', 'images', 'audio', 'transcription', 'embeddings']
      },
      claude: {
        available: !!this.claude,
        features: ['editing', 'compliance', 'brand_voice', 'long_form_refinement']
      },
      status: 'healthy'
    };
  }

  private estimateAudioDuration(text: string): number {
    const words = text.split(' ').length;
    return Math.ceil(words / 150 * 60); // ~150 words per minute
  }
}

export default SimplifiedAIService;