import OpenAI from 'openai';
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

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    super(apiKey);
    this.client = new OpenAI({ apiKey });
  }

  async createCompletion(
    messages: AIMessage[],
    options: AICompletionOptions = {}
  ): Promise<AICompletionResponse> {
    const {
      temperature = 0.7,
      maxTokens = 1000,
      model = 'gpt-4',
      functions,
      functionCall
    } = options;

    const params: any = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    if (functions) {
      params.functions = functions;
      if (functionCall) {
        params.function_call = typeof functionCall === 'string' ? functionCall : functionCall;
      }
    }

    const completion = await this.client.chat.completions.create(params);

    const choice = completion.choices[0];
    const message = choice.message;

    return {
      content: message.content || '',
      usage: completion.usage ? {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      } : undefined,
      functionCall: message.function_call ? {
        name: message.function_call.name,
        arguments: message.function_call.arguments
      } : undefined
    };
  }

  async createEmbedding(
    text: string,
    model: string = 'text-embedding-3-small'
  ): Promise<AIEmbeddingResponse> {
    const response = await this.client.embeddings.create({
      model,
      input: text
    });

    return {
      embedding: response.data?.[0]?.embedding || [],
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  }

  async generateImage(
    options: AIImageGenerationOptions
  ): Promise<AIImageResponse> {
    const {
      prompt,
      size = '1024x1024',
      quality = 'standard',
      style = 'vivid',
      model = 'dall-e-3'
    } = options;

    const response = await this.client.images.generate({
      model,
      prompt,
      size,
      quality,
      style,
      n: 1
    });

    const image = response.data?.[0];
    if (!image) {
      throw new Error('No image generated');
    }
    return {
      url: image.url!,
      revisedPrompt: image.revised_prompt
    };
  }

  async transcribeAudio(
    options: AITranscriptionOptions
  ): Promise<AITranscriptionResponse> {
    const {
      audioBuffer,
      format,
      model = 'whisper-1',
      language
    } = options;

    // Create a File-like object from buffer
    const file = new File([audioBuffer], `audio.${format}`, { type: `audio/${format}` });

    const transcription = await this.client.audio.transcriptions.create({
      file,
      model,
      language,
      response_format: 'verbose_json'
    } as any);

    return {
      text: transcription.text,
      language: (transcription as any).language,
      duration: (transcription as any).duration
    };
  }

  async textToSpeech(
    text: string,
    voice: string = 'alloy',
    model: string = 'tts-1'
  ): Promise<Buffer> {
    const response = await this.client.audio.speech.create({
      model,
      voice: voice as any,
      input: text,
      response_format: 'mp3'
    });

    return Buffer.from(await response.arrayBuffer());
  }

  // OpenAI-specific function calling for structured content generation
  async generateStructuredContent(prompt: string, schema: any): Promise<any> {
    const functions = [{
      name: 'generate_content',
      description: 'Generate structured newsletter content',
      parameters: schema
    }];

    const response = await this.createCompletion([
      { role: 'user', content: prompt }
    ], {
      functions,
      functionCall: { name: 'generate_content' },
      temperature: 0.7
    });

    if (response.functionCall) {
      return JSON.parse(response.functionCall.arguments);
    }

    throw new Error('No structured content generated');
  }

  // Generate multiple subject line variants
  async generateSubjectLineVariants(
    content: string,
    count: number = 5,
    styles: string[] = ['direct', 'curiosity', 'benefit', 'urgency', 'personalized']
  ): Promise<string[]> {
    const schema = {
      type: 'object',
      properties: {
        subject_lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              style: { type: 'string', enum: styles },
              reasoning: { type: 'string' }
            }
          }
        }
      }
    };

    const prompt = `Based on this newsletter content, generate ${count} different subject lines using various styles (${styles.join(', ')}):

Content: ${content.substring(0, 500)}...

Make each subject line compelling and optimized for different psychological triggers.`;

    const result = await this.generateStructuredContent(prompt, schema);
    return result.subject_lines.map((sl: any) => sl.text);
  }

  // Generate UTM parameters and tracking links
  async generateUTMParameters(
    content: string,
    campaign: string,
    newsletter: string
  ): Promise<any> {
    const schema = {
      type: 'object',
      properties: {
        utm_source: { type: 'string' },
        utm_medium: { type: 'string' },
        utm_campaign: { type: 'string' },
        utm_content: { type: 'string' },
        utm_term: { type: 'string' },
        suggested_links: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              anchor_text: { type: 'string' },
              url: { type: 'string' },
              utm_content: { type: 'string' }
            }
          }
        }
      }
    };

    const prompt = `Generate UTM parameters and suggested tracking links for this newsletter campaign:

Campaign: ${campaign}
Newsletter: ${newsletter}
Content preview: ${content.substring(0, 300)}...

Create meaningful UTM parameters and suggest 3-5 strategically placed links with appropriate anchor text.`;

    return await this.generateStructuredContent(prompt, schema);
  }
}