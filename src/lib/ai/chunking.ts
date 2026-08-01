import { SourceFile } from './types';
import { AIParsingError } from './errors';
import Papa from 'papaparse';

export const detectBinary = (buffer: ArrayBuffer): boolean => {
  const bytes = new Uint8Array(buffer);
  const scanLength = Math.min(bytes.length, 1024); // scan first 1KB
  
  if (scanLength === 0) return true; // empty file is considered meaningless

  let nulls = 0;
  let controlChars = 0;
  let printable = 0;

  for (let i = 0; i < scanLength; i++) {
    const byte = bytes[i];
    if (byte === 0) nulls++;
    else if ((byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) || byte === 127) controlChars++;
    else printable++;
  }

  if (nulls > 0) return true;
  if (printable > 0 && controlChars / printable > 0.3) return true;
  
  return false;
};
export const extractTextFromBuffer = async (buffer: ArrayBuffer, mimeType: string): Promise<string> => {
  if (mimeType === 'application/pdf') {
    try {
      // dynamic import for server-side
      const pdfModule = await import('pdf-parse');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = (pdfModule as any).default || pdfModule;
      const data = await pdf(Buffer.from(buffer));
      return data.text;
    } catch (err) {
      console.error('PDF parsing error', err);
      throw new AIParsingError('Failed to parse PDF document.');
    }
  }

  if (mimeType === 'text/csv') {
    try {
      const text = new TextDecoder().decode(buffer);
      const parsed = Papa.parse(text, { header: true });
      return JSON.stringify(parsed.data, null, 2);
    } catch {
      throw new AIParsingError('Failed to parse CSV document.');
    }
  }

  if (mimeType === 'application/json') {
    try {
      const text = new TextDecoder().decode(buffer);
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      throw new AIParsingError('Failed to parse JSON document.');
    }
  }

  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    if (detectBinary(buffer)) {
      throw new AIParsingError('No meaningful text could be extracted from this file (detected binary or heavy corruption).');
    }

    try {
      // Decode strictly as UTF-8, replacing invalid chars
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      
      // Check for excessive replacement characters (\uFFFD)
      const replacementCount = (text.match(/\uFFFD/g) || []).length;
      if (text.length > 0 && replacementCount / text.length > 0.05) {
         throw new AIParsingError('File encoding is heavily corrupted or not UTF-8 text.');
      }

      if (text.trim().length === 0) {
        throw new AIParsingError('No meaningful text could be extracted from this file.');
      }

      return text;
    } catch (err: unknown) {
      if (err instanceof AIParsingError) throw err;
      throw new AIParsingError('Failed to decode text document.');
    }
  }

  throw new AIParsingError(`This file requires OCR or vision analysis, which is not supported in the current MVP. (Unsupported MIME type: ${mimeType})`);
};

export const validateAndPrepareFiles = (files: SourceFile[], maxTotalChars: number): SourceFile[] => {
  let totalChars = 0;
  
  for (const file of files) {
    if (!file.content) continue;
    totalChars += file.content.length;
  }

  if (totalChars > maxTotalChars) {
    throw new AIParsingError(`Total text length exceeds the configured maximum of ${maxTotalChars} characters.`);
  }

  return files;
};
