import { aptosClient, MODULE_ADDRESS, MODULE_NAME } from './client';
import { EvidenceRecord } from './types';

export const getTotalEvidenceCount = async (registryAddress: string): Promise<number> => {
  try {
    const payload = {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::total_evidence_count` as const,
      typeArguments: [],
      functionArguments: [registryAddress],
    };
    const [count] = await aptosClient.view({ payload });
    return parseInt(count as string, 10);
  } catch (error) {
    console.error('Failed to fetch total evidence count:', error);
    return 0;
  }
};

export const getEvidenceById = async (registryAddress: string, id: number): Promise<EvidenceRecord | null> => {
  try {
    const payload = {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_evidence_by_id` as const,
      typeArguments: [],
      functionArguments: [registryAddress, id],
    };
    const [record] = await aptosClient.view({ payload });
    
    // Parse the record returned from Move.
    // The exact structure depends on how the TS SDK formats Move structs.
    // Generally it's returned as a JSON object.
    const data = record as Record<string, string | number>;
    
    // Convert the hex hash back if necessary.
    let hashHex = '';
    if (data.sha256_hash) {
      // The hash might be returned as a hex string with a '0x' prefix.
      hashHex = (data.sha256_hash as string).replace('0x', '');
    }

    return {
      id: String(data.id),
      publisher: String(data.publisher),
      category: String(data.category),
      project_or_topic: String(data.project_or_topic),
      title: String(data.title),
      description: String(data.description),
      document_date: String(data.document_date),
      blob_identifier: String(data.blob_identifier),
      original_file_name: String(data.original_file_name),
      mime_type: String(data.mime_type),
      file_size: String(data.file_size),
      sha256_hash: hashHex,
      created_at: String(data.created_at),
      visibility: parseInt(String(data.visibility || '0'), 10),
    };
  } catch (error) {
    console.error(`Failed to fetch evidence ${id}:`, error);
    return null;
  }
};

export const getAllEvidence = async (registryAddress: string): Promise<EvidenceRecord[]> => {
  const count = await getTotalEvidenceCount(registryAddress);
  const records: EvidenceRecord[] = [];
  
  // For MVP, fetch sequentially or batch them
  // Assuming 1-based indexing as defined in the contract
  for (let i = 1; i <= count; i++) {
    const record = await getEvidenceById(registryAddress, i);
    if (record) records.push(record);
  }
  
  // Return in descending order (newest first)
  return records.reverse();
};

export const getAllEvidencePaginated = async (registryAddress: string, startId: number, limit: number): Promise<EvidenceRecord[]> => {
  const records: EvidenceRecord[] = [];
  for (let i = startId; i > 0 && records.length < limit; i--) {
    const record = await getEvidenceById(registryAddress, i);
    if (record) records.push(record);
  }
  return records;
};
