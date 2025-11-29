/**
 * AI Client Setup
 * Supports OpenAI (GPT-4) and Anthropic (Claude) with retry logic
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Types
export type AIProvider = 'anthropic' | 'openai';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIClientConfig {
  provider: AIProvider;
  model: string;
  timeout: number;
  maxRetries: number;
  retryDelays: number[];
}

export interface AICallResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  model: string;
  provider: AIProvider;
}

// Default configuration
const DEFAULT_CONFIG: AIClientConfig = {
  provider: (process.env.AI_PROVIDER as AIProvider) || 'anthropic',
  model: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelays: [1000, 2000, 4000], // Exponential backoff: 1s, 2s, 4s
};

// Initialize clients lazily
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({
      apiKey,
      timeout: DEFAULT_CONFIG.timeout,
    });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey,
      timeout: DEFAULT_CONFIG.timeout,
    });
  }
  return openaiClient;
}

// Sleep utility
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry wrapper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retryDelays: number[],
  onRetry?: (error: Error, attempt: number) => void
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (isNonRetryableError(lastError)) {
        throw lastError;
      }

      // If we have more retries, wait and try again
      if (attempt < retryDelays.length) {
        const delay = retryDelays[attempt];
        onRetry?.(lastError, attempt + 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function isNonRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('invalid_api_key') ||
    message.includes('authentication') ||
    message.includes('unauthorized') ||
    message.includes('invalid request') ||
    message.includes('content policy')
  );
}

// Call Anthropic API
async function callAnthropic(
  messages: AIMessage[],
  config: AIClientConfig
): Promise<AICallResult> {
  const client = getAnthropicClient();
  const startTime = Date.now();

  // Separate system message from conversation
  const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
  const conversationMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const response = await client.messages.create({
    model: config.model,
    max_tokens: 4096,
    system: systemMessage,
    messages: conversationMessages,
  });

  const latencyMs = Date.now() - startTime;
  const textContent = response.content.find((c) => c.type === 'text');

  return {
    content: textContent?.text || '',
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    latencyMs,
    model: config.model,
    provider: 'anthropic',
  };
}

// Call OpenAI API
async function callOpenAI(
  messages: AIMessage[],
  config: AIClientConfig
): Promise<AICallResult> {
  const client = getOpenAIClient();
  const startTime = Date.now();

  const response = await client.chat.completions.create({
    model: config.model,
    max_tokens: 4096,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const latencyMs = Date.now() - startTime;

  return {
    content: response.choices[0]?.message?.content || '',
    usage: {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    latencyMs,
    model: config.model,
    provider: 'openai',
  };
}

// Main AI call function with retry
export async function callAIClient(
  messages: AIMessage[],
  config: Partial<AIClientConfig> = {}
): Promise<AICallResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const callFn = async () => {
    if (finalConfig.provider === 'anthropic') {
      return callAnthropic(messages, finalConfig);
    } else {
      return callOpenAI(messages, finalConfig);
    }
  };

  return withRetry(callFn, finalConfig.retryDelays, (error, attempt) => {
    console.warn(
      `[AI Client] Retry attempt ${attempt} after error: ${error.message}`
    );
  });
}

// Export config for testing/customization
export function getDefaultConfig(): AIClientConfig {
  return { ...DEFAULT_CONFIG };
}
