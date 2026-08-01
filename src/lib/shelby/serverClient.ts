import { getShelbyConfig, getStorageMode } from './client';

export const getServerShelbyClient = async () => {
  if (getStorageMode() === 'local') {
    return null;
  }

  const config = getShelbyConfig();
  
  try {
    const { ShelbyClient } = await import('@shelby-protocol/sdk/node');
    
    return new ShelbyClient({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      network: config.network as any,
      apiKey: config.apiKey,
    });
  } catch (err) {
    console.error('Failed to initialize Server ShelbyClient:', err);
    throw new Error('Could not initialize Server Shelby storage client.');
  }
};
