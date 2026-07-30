// Shelby Client Initialization

import { ShelbyConfig } from './types';

export const getShelbyConfig = (): ShelbyConfig => {
  return {
    network: process.env.NEXT_PUBLIC_SHELBY_NETWORK || 'testnet',
    apiKey: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
  };
};

export const getShelbyClient = async () => {
  const config = getShelbyConfig();
  
  // Conditionally load the Shelby SDK if it exists, otherwise use a mock adapter.
  try {
    // Trick webpack/turbopack to not fail the build if node module is missing
    const pkg = '@shelby-protocol/sdk' + '/node';
    const { ShelbyNodeClient } = await import(/* webpackIgnore: true */ pkg);
    return new ShelbyNodeClient({
      network: config.network,
      apiKey: config.apiKey || 'mock_api_key',
    });
  } catch (err) {
    console.warn('Shelby SDK not available or failed to load. Using mock local adapter.');
    return null;
  }
};
