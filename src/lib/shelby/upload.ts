import { useState, useMemo } from 'react';
import { useUploadBlobs } from '@shelby-protocol/react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ShelbyClient } from '@shelby-protocol/sdk/browser';
import { getShelbyConfig, getStorageMode } from './client';
import { StorageUploadResult } from './types';

export function useShelbyUpload() {
  const wallet = useWallet();
  const [isUploading, setIsUploading] = useState(false);
  const mode = getStorageMode();

  const client = useMemo(() => {
    if (mode === 'local') return null;
    const config = getShelbyConfig();
    return new ShelbyClient({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      network: config.network as any,
      apiKey: config.apiKey,
    });
  }, [mode]);

  // Pass dummy client if local mode, useUploadBlobs requires client instance
  // We won't call mutateAsync if in local mode anyway.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uploadBlobs = useUploadBlobs(client ? { client } : { client: {} as any });

  const upload = async (file: File): Promise<StorageUploadResult> => {
    if (mode === 'local') {
      console.log('Using local storage adapter for upload:', file.name);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            blobId: `local_blob_${file.name}`,
            blobName: file.name,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
            downloadReference: `local://${file.name}`,
          });
        }, 1000);
      });
    }

    if (!client) throw new Error("ShelbyClient not initialized");
    if (!wallet.account) throw new Error("Wallet not connected");
    if (!wallet.signAndSubmitTransaction) throw new Error("Wallet does not support signing");

    setIsUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      // useUploadBlobs handles generating commitments, L1 registration (via wallet adapter signer), and RPC upload
      await uploadBlobs.mutateAsync({
        signer: wallet, // WalletAdapterSigner
        blobs: [{ blobName: file.name, blobData: data }],
        expirationMicros: Math.floor(Date.now() * 1000) + 31536000000000, // +1 year
      });

      return {
        blobId: `${wallet.account.address.toString()}/${file.name}`,
        blobName: file.name,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
      };
    } catch (error) {
      console.error('Shelby upload error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload file to Shelby network.');
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading };
}
