import { getShelbyClient } from './client';

export const downloadFromShelby = async (accountAddress: string, blobName: string): Promise<Blob> => {
  const client = await getShelbyClient();

  if (!client) {
    // Mock local download
    console.log('Using local storage adapter for download:', blobName);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(new Blob(['Mock file content from local adapter.'], { type: 'text/plain' }));
      }, 500);
    });
  }

  try {
    const result = await client.download({ account: accountAddress, blobName });
    // result.readable is a ReadableStream
    const response = new Response(result.readable);
    return await response.blob();
  } catch (error) {
    console.error('Shelby download error:', error);
    throw new Error('Failed to download file from Shelby network.');
  }
};
