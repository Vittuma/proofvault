import { getShelbyClient } from './client';

export const downloadFromShelby = async (blobId: string): Promise<Blob> => {
  const client = await getShelbyClient();

  if (!client) {
    // Mock local download
    console.log('Using local storage adapter for download:', blobId);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(new Blob(['Mock file content from local adapter.'], { type: 'text/plain' }));
      }, 500);
    });
  }

  try {
    const result = await client.download({ blobId });
    // Assuming result.blobData is a Uint8Array
    return new Blob([result.blobData || result.data]);
  } catch (error) {
    console.error('Shelby download error:', error);
    throw new Error('Failed to download file from Shelby network.');
  }
};
