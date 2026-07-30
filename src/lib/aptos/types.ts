export interface EvidenceRecord {
  id: string;
  publisher: string;
  category: string;
  project_or_topic: string;
  title: string;
  description: string;
  document_date: string;
  blob_identifier: string;
  original_file_name: string;
  mime_type: string;
  file_size: string;
  sha256_hash: string;
  created_at: string;
  visibility: number;
}
