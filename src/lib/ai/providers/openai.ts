import OpenAI from 'openai';
import { AIProviderError } from '../errors';

export const getOpenAIClient = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AIProviderError('AI service is not configured.');
  }

  return new OpenAI({
    apiKey: apiKey,
  });
};
