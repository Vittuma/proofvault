// Shelby Client Initialization

import { ShelbyConfig } from './types';

export const getShelbyConfig = (): ShelbyConfig => {
  const rawKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY;
  const apiKey = (!rawKey || rawKey === 'your_api_key_here') ? undefined : rawKey;

  return {
    network: process.env.NEXT_PUBLIC_SHELBY_NETWORK || 'testnet',
    apiKey,
  };
};

export const getStorageMode = (): 'local' | 'shelby' => {
  return (process.env.NEXT_PUBLIC_STORAGE_ADAPTER_MODE as 'local' | 'shelby') || 'shelby';
};

export const getShelbyClient = async () => {
  if (getStorageMode() === 'local') {
    return null;
  }

  const config = getShelbyConfig();
  
  try {
    const { ShelbyClient } = await import('@shelby-protocol/sdk/browser');
    
    // If apiKey is undefined, it automatically runs in anonymous mode
    return new ShelbyClient({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      network: config.network as any,
      apiKey: config.apiKey,
    });
  } catch (err) {
    console.error('Failed to initialize ShelbyClient:', err);
    throw new Error('Could not initialize Shelby storage client.');
  }
};
