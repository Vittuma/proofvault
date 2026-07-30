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
