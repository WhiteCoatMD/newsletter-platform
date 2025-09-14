export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
  functions?: any[];
  functionCall?: string | { name: string };
}

export interface AICompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface AIEmbeddingResponse {
  embedding: number[];
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
}

export interface AIImageGenerationOptions {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  model?: string;
}

export interface AIImageResponse {
  url: string;
  revisedPrompt?: string;
}

export interface AITranscriptionOptions {
  audioBuffer: Buffer;
  format: string;
  model?: string;
  language?: string;
}

export interface AITranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
}

export abstract class BaseAIProvider {
  protected apiKey: string;
  protected baseURL?: string;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  abstract createCompletion(
    messages: AIMessage[],
    options?: AICompletionOptions
  ): Promise<AICompletionResponse>;

  abstract createEmbedding(
    text: string,
    model?: string
  ): Promise<AIEmbeddingResponse>;

  abstract generateImage(
    options: AIImageGenerationOptions
  ): Promise<AIImageResponse>;

  abstract transcribeAudio(
    options: AITranscriptionOptions
  ): Promise<AITranscriptionResponse>;

  abstract textToSpeech(
    text: string,
    voice?: string,
    model?: string
  ): Promise<Buffer>;

  // Utility method for structured outputs
  async createStructuredCompletion<T>(
    messages: AIMessage[],
    schema: any,
    options?: AICompletionOptions
  ): Promise<T> {
    const systemPrompt = `${options?.systemPrompt || ''}\n\nRespond with valid JSON matching this schema: ${JSON.stringify(schema)}`;

    const response = await this.createCompletion(
      [{ role: 'system', content: systemPrompt }, ...messages.filter(m => m.role !== 'system')],
      { ...options, temperature: options?.temperature || 0.3 }
    );

    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error(`Failed to parse structured response: ${error}`);
    }
  }
}