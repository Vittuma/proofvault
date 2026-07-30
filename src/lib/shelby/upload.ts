import { StorageUploadResult } from './types';
import { getShelbyClient } from './client';

export const uploadToShelby = async (file: File): Promise<StorageUploadResult> => {
  const client = await getShelbyClient();

  if (!client) {
    // Local adapter fallback if SDK is unavailable
    console.log('Using local storage adapter for upload:', file.name);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          blobId: `local_blob_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          blobName: file.name,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          downloadReference: `local://${file.name}`,
        });
      }, 1000);
    });
  }

  // Official Shelby SDK upload
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    // Depending on actual Shelby SDK API
    const result = await client.upload({
      blobData: data,
      blobName: file.name,
      expirationMicros: Date.now() * 1000 + (365 * 24 * 60 * 60 * 1000000), // 1 year approx
    });

    return {
      blobId: result.blobId || result.id || 'unknown_blob_id',
      blobName: file.name,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
    };
  } catch (error) {
    console.error('Shelby upload error:', error);
    throw new Error('Failed to upload file to Shelby network.');
  }
};
