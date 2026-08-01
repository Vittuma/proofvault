import { getOpenAIClient } from './providers/openai';

export const getAIClient = () => {
  const provider = process.env.AI_PROVIDER || 'openai';
  
  if (provider === 'openai') {
    return getOpenAIClient();
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
};
