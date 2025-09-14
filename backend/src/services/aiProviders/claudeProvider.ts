import Anthropic from '@anthropic-ai/sdk';
import {
  BaseAIProvider,
  AIMessage,
  AICompletionOptions,
  AICompletionResponse,
  AIEmbeddingResponse,
  AIImageGenerationOptions,
  AIImageResponse,
  AITranscriptionOptions,
  AITranscriptionResponse
} from './baseProvider';

export class ClaudeProvider extends BaseAIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    super(apiKey);
    this.client = new Anthropic({ apiKey });
  }

  async createCompletion(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): Promise<AICompletionResponse> {
    const {
      temperature = 0.3, // Lower for editing/compliance tasks
      maxTokens = 1000,
      model = 'claude-3-sonnet-20240229',
      systemPrompt
    } = options;

    // Convert messages format
    const systemMessage = systemPrompt || messages.find(m => m.role === 'system')?.content;
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return {
      content: content.text,
      usage: response.usage ? {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      } : undefined
    };
  }

  // Claude doesn't support embeddings directly
  async createEmbedding(text: string, model?: string): Promise<AIEmbeddingResponse> {
    throw new Error('Claude does not support embeddings. Use OpenAI for embeddings.');
  }

  // Claude doesn't support image generation
  async generateImage(options: AIImageGenerationOptions): Promise<AIImageResponse> {
    throw new Error('Claude does not support image generation. Use OpenAI DALL-E for images.');
  }

  // Claude doesn't support audio transcription
  async transcribeAudio(options: AITranscriptionOptions): Promise<AITranscriptionResponse> {
    throw new Error('Claude does not support audio transcription. Use OpenAI Whisper for transcription.');
  }

  // Claude doesn't support text-to-speech
  async textToSpeech(text: string, voice?: string, model?: string): Promise<Buffer> {
    throw new Error('Claude does not support text-to-speech. Use OpenAI TTS for audio generation.');
  }

  // Claude-specific compliance and safety checking
  async checkCompliance(
    content: string,
    vertical: 'health' | 'finance' | 'general' = 'general'
  ): Promise<{
    isCompliant: boolean;
    issues: string[];
    suggestions: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const complianceRules = {
      health: [
        'No medical advice claims',
        'No unsubstantiated health claims',
        'Include appropriate disclaimers',
        'Avoid suggesting diagnosis or treatment'
      ],
      finance: [
        'No investment advice without disclaimers',
        'No guaranteed returns claims',
        'Include risk warnings',
        'Comply with financial regulations'
      ],
      general: [
        'No false or misleading claims',
        'No spam-like language',
        'Include required unsubscribe links',
        'Respect data privacy regulations'
      ]
    };

    const rules = complianceRules[vertical];
    const prompt = `As a compliance expert, review this newsletter content for ${vertical} industry compliance.

Check for:
${rules.map(rule => `- ${rule}`).join('\n')}

Content:
${content}

Respond with a JSON object containing:
- isCompliant: boolean
- issues: array of specific problems found
- suggestions: array of recommendations to fix issues
- riskLevel: "low", "medium", or "high"
- explanation: brief explanation of assessment`;

    const response = await this.createCompletion([
      { role: 'user', content: prompt }
    ], { temperature: 0.1 }); // Very low temperature for consistency

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error(`Failed to parse compliance response: ${error}`);
    }
  }

  // Editing and style consistency
  async editForStyle(
    content: string,
    styleGuide: {
      tone: string;
      voice: string;
      guidelines: string[];
      brandWords: string[];
      avoidWords: string[];
    }
  ): Promise<{
    editedContent: string;
    changes: Array<{
      original: string;
      revised: string;
      reason: string;
    }>;
    styleScore: number;
  }> {
    const prompt = `Edit this newsletter content to match our brand style guide:

STYLE GUIDE:
- Tone: ${styleGuide.tone}
- Voice: ${styleGuide.voice}
- Guidelines: ${styleGuide.guidelines.join(', ')}
- Preferred words: ${styleGuide.brandWords.join(', ')}
- Avoid words: ${styleGuide.avoidWords.join(', ')}

ORIGINAL CONTENT:
${content}

Provide your response as JSON with:
- editedContent: the revised content
- changes: array of specific changes made with explanations
- styleScore: 1-10 rating of how well the edited content matches the style guide`;

    const response = await this.createCompletion([
      { role: 'user', content: prompt }
    ], { temperature: 0.2, maxTokens: 2000 });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error(`Failed to parse style editing response: ${error}`);
    }
  }

  // Long-form content refinement
  async refineLongForm(
    content: string,
    targetLength: number,
    focus: 'clarity' | 'engagement' | 'persuasion' | 'factual' = 'clarity'
  ): Promise<{
    refinedContent: string;
    wordCount: number;
    improvements: string[];
    readabilityScore: number;
  }> {
    const focusInstructions = {
      clarity: 'Improve clarity and readability. Simplify complex sentences, improve structure, and ensure clear communication.',
      engagement: 'Enhance engagement through storytelling, questions, and interactive language while maintaining professionalism.',
      persuasion: 'Strengthen persuasive elements, add compelling arguments, and improve calls-to-action.',
      factual: 'Ensure factual accuracy, improve logical flow, and strengthen evidence-based arguments.'
    };

    const prompt = `Refine this long-form newsletter content focusing on ${focus}.

TARGET: ${targetLength} words (current: ~${content.split(' ').length} words)
FOCUS: ${focusInstructions[focus]}

CONTENT:
${content}

Provide JSON response with:
- refinedContent: the improved content
- wordCount: exact word count of refined content
- improvements: list of specific improvements made
- readabilityScore: 1-10 rating of readability`;

    const response = await this.createCompletion([
      { role: 'user', content: prompt }
    ], { temperature: 0.3, maxTokens: 3000 });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error(`Failed to parse refinement response: ${error}`);
    }
  }

  // Brand voice transformation
  async transformToBrandVoice(
    content: string,
    brandConstitution: string
  ): Promise<{
    transformedContent: string;
    brandAlignment: number;
    changes: string[];
  }> {
    const prompt = `Transform this content to perfectly match our brand voice and constitution:

BRAND CONSTITUTION:
${brandConstitution}

CONTENT TO TRANSFORM:
${content}

Make this content authentically represent our brand while maintaining its core message and value.

Respond with JSON:
- transformedContent: content rewritten in brand voice
- brandAlignment: 1-10 score of how well it matches brand
- changes: list of key transformations made`;

    const response = await this.createCompletion([
      { role: 'user', content: prompt }
    ], { temperature: 0.4, maxTokens: 2500 });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error(`Failed to parse brand transformation response: ${error}`);
    }
  }

  // Fact-checking and accuracy verification
  async verifyFactualAccuracy(
    content: string,
    domain: string = 'general'
  ): Promise<{
    accuracy: 'high' | 'medium' | 'low';
    flaggedClaims: Array<{
      claim: string;
      issue: string;
      severity: 'low' | 'medium' | 'high';
      suggestion: string;
    }>;
    overallAssessment: string;
  }> {
    const prompt = `As a fact-checking expert in ${domain}, analyze this newsletter content for factual accuracy:

${content}

Identify any claims that may be inaccurate, exaggerated, or need verification. Focus on:
- Statistical claims
- Scientific statements
- Historical facts
- Current events references
- Product/service claims

Respond with JSON:
- accuracy: overall accuracy rating
- flaggedClaims: array of questionable claims with detailed analysis
- overallAssessment: summary of findings`;

    const response = await this.createCompletion([
      { role: 'user', content: prompt }
    ], { temperature: 0.1, maxTokens: 1500 });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error(`Failed to parse fact-checking response: ${error}`);
    }
  }
}