import { MODULE_ADDRESS, MODULE_NAME } from './client';
import { InputTransactionData } from '@aptos-labs/wallet-adapter-react';

export const buildRegisterEvidencePayload = (
  registryAddress: string,
  category: string,
  projectOrTopic: string,
  title: string,
  description: string,
  documentDate: string,
  blobIdentifier: string,
  originalFileName: string,
  mimeType: string,
  fileSize: number,
  sha256HashHex: string,
  visibility: number
): InputTransactionData => {
  // Convert hex hash to byte array
  const sha256Bytes = Array.from(Buffer.from(sha256HashHex, 'hex'));

  return {
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::register_evidence`,
      typeArguments: [],
      functionArguments: [
        registryAddress,
        category,
        projectOrTopic,
        title,
        description,
        documentDate,
        blobIdentifier,
        originalFileName,
        mimeType,
        fileSize,
        sha256Bytes,
        visibility,
      ],
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractEvidenceIdFromReceipt = (receipt: any): string | null => {
  if (!receipt || !receipt.events) return null;
  
  for (const event of receipt.events) {
    if (event.type === `${MODULE_ADDRESS}::${MODULE_NAME}::EvidenceRegisteredEvent`) {
      if (event.data && event.data.id) {
        return String(event.data.id);
      }
    }
  }
  return null;
};

