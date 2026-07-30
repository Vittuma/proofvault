export interface StorageUploadResult {
  blobId: string;
  blobName?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  downloadReference?: string;
}

export interface ShelbyConfig {
  network: string;
  apiKey?: string;
}
