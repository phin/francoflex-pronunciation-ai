import OpenAI from 'openai';

let openaiClient = null;

export function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

// Default model to use for OpenAI calls
export const DEFAULT_MODEL = 'gpt-4o-mini';
