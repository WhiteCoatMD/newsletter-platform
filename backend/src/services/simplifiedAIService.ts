import { OpenAIProvider, ClaudeProvider } from './aiProviders';

interface AITaskOptions {
  tone?: string;
  length?: string;
  targetAudience?: string;
  vertical?: 'health' | 'finance' | 'general';
  focus?: 'engagement' | 'clarity' | 'persuasion';
}

class SimplifiedAIService {
  private openai?: OpenAIProvider;
  private claude?: ClaudeProvider;
  private brandConstitution: string;

  constructor() {
    this.brandConstitution = process.env.BRAND_CONSTITUTION || `
      We are a professional, helpful, and engaging newsletter platform.
      Our tone is friendly but authoritative, approachable but expert.
      We focus on providing value, actionable insights, and building genuine relationships with our readers.
      We avoid hype, exaggerated claims, and overly promotional language.
      Our content should be clear, well-structured, and immediately valuable.
    `;
  }

  private initializeProviders() {
    if (!this.openai && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
    }

    if (!this.claude && process.env.ANTHROPIC_API_KEY) {
      this.claude = new ClaudeProvider(process.env.ANTHROPIC_API_KEY);
    }
  }

  // OpenAI - Primary for content generation, images, audio
  async generateContent(prompt: string, options: AITaskOptions = {}) {
    try {
      this.initializeProviders();
      if (!this.openai) {
        throw new Error('OpenAI API key is not configured');
      }
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

      if (!this.openai) {
        throw new Error('OpenAI service not initialized');
      }
      const result = await this.openai!.generateStructuredContent(fullPrompt, schema);

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
      if (!this.openai) {
        throw new Error('OpenAI service not initialized');
      }
      const subjectLines = await this.openai!.generateSubjectLineVariants(content, count);

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
      const image = await this.openai!.generateImage({
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
      const audioBuffer = await this.openai!.textToSpeech(content, voice);

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
      const transcription = await this.openai!.transcribeAudio({
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
        const response = await this.openai!.createCompletion([
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
        const response = await this.openai!.createCompletion([
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
        const response = await this.openai!.createCompletion([
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

  // Additional methods needed by the API
  async generateOutline(topic: string, options: any = {}) {
    try {
      const { sections = 5, audience = 'general', format = 'educational' } = options;

      const prompt = `Create a detailed outline for a ${format} newsletter about "${topic}" targeting ${audience} audience.

Generate ${sections} main sections with:
- Section title
- 2-3 key points for each section
- Suggested content type (text, image, quote, etc.)`;

      const schema = {
        type: 'object',
        properties: {
          title: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                points: { type: 'array', items: { type: 'string' } },
                contentType: { type: 'string' }
              }
            }
          }
        }
      };

      const result = await this.openai!.generateStructuredContent(prompt, schema);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Outline generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Outline generation failed'
      };
    }
  }

  async generateSectionContent(sectionTitle: string, points: string[], contentType: string = 'text') {
    try {
      const prompt = `Write engaging newsletter content for the section "${sectionTitle}".

Key points to cover:
${points.map(point => `- ${point}`).join('\n')}

Content type: ${contentType}
Make it engaging and well-formatted with HTML tags.`;

      const response = await this.openai!.createCompletion([
        { role: 'user', content: prompt }
      ], { temperature: 0.7, maxTokens: 600 });

      return {
        success: true,
        data: {
          content: response.content,
          sectionTitle,
          contentType
        }
      };
    } catch (error) {
      console.error('Section content generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Section content generation failed'
      };
    }
  }

  async analyzeContent(content: string) {
    try {
      const prompt = `Analyze the following newsletter content and provide:
1. Overall sentiment (positive/neutral/negative)
2. Reading difficulty level (easy/medium/hard)
3. Estimated engagement score (1-10)
4. 3 specific improvement suggestions
5. Target audience assessment

Content: ${content}`;

      const schema = {
        type: 'object',
        properties: {
          sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          engagementScore: { type: 'number', minimum: 1, maximum: 10 },
          suggestions: { type: 'array', items: { type: 'string' } },
          targetAudience: { type: 'string' }
        }
      };

      const result = await this.openai!.generateStructuredContent(prompt, schema);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Content analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Content analysis failed'
      };
    }
  }

  async generatePersonalizedContent(content: string, subscriberProfiles: any[]) {
    try {
      const prompt = `Personalize this newsletter content for different subscriber segments:

Base content: ${content}

Subscriber profiles:
${JSON.stringify(subscriberProfiles, null, 2)}

Create personalized versions that speak to each segment's interests and needs.`;

      const schema = {
        type: 'object',
        properties: {
          personalizedVersions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                segmentId: { type: 'string' },
                personalizedContent: { type: 'string' },
                personalizedSubject: { type: 'string' },
                reasoning: { type: 'string' }
              }
            }
          }
        }
      };

      const result = await this.openai!.generateStructuredContent(prompt, schema);

      return {
        success: true,
        data: result.personalizedVersions
      };
    } catch (error) {
      console.error('Personalization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Personalization failed'
      };
    }
  }

  async transcribeToNewsletter(audioBuffer: Buffer, format: string, options: any = {}) {
    try {
      // First transcribe the audio
      const transcription = await this.transcribeAudio(audioBuffer, format);

      if (!transcription.success || !transcription.data) {
        return transcription;
      }

      // Then structure it as newsletter content
      const content = transcription.data.text;
      const structurePrompt = `Convert this transcribed audio into a well-structured newsletter:

Transcription: ${content}

Create a professional newsletter with proper sections, headlines, and formatting.`;

      const response = await this.openai!.createCompletion([
        { role: 'user', content: structurePrompt }
      ], { temperature: 0.6, maxTokens: 1500 });

      return {
        success: true,
        data: {
          newsletterContent: response.content,
          originalTranscription: content,
          duration: transcription.data.duration || 0,
          wordCount: content.split(' ').length
        }
      };
    } catch (error) {
      console.error('Transcription to newsletter error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transcription to newsletter failed'
      };
    }
  }

  async generateSEOPackage(content: string, keywords: string[] = [], options: any = {}) {
    try {
      const prompt = `Generate SEO and social media package for this newsletter content:

Content: ${content}
Target keywords: ${keywords.join(', ')}

Create:
1. SEO-optimized title variations
2. Meta description
3. Social media captions for different platforms
4. Hashtag suggestions
5. OG/Twitter card optimizations`;

      const schema = {
        type: 'object',
        properties: {
          seoTitles: { type: 'array', items: { type: 'string' } },
          metaDescription: { type: 'string' },
          socialCaptions: {
            type: 'object',
            properties: {
              twitter: { type: 'string' },
              linkedin: { type: 'string' },
              facebook: { type: 'string' },
              instagram: { type: 'string' }
            }
          },
          hashtags: { type: 'array', items: { type: 'string' } },
          ogTags: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              image: { type: 'string' }
            }
          }
        }
      };

      const result = await this.openai!.generateStructuredContent(prompt, schema);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('SEO package generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SEO package generation failed'
      };
    }
  }

  private estimateAudioDuration(text: string): number {
    const words = text.split(' ').length;
    return Math.ceil(words / 150 * 60); // ~150 words per minute
  }
}

export default SimplifiedAIService;