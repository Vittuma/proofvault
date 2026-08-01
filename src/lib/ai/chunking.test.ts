import { describe, it, expect } from 'vitest';
import { extractTextFromBuffer, validateAndPrepareFiles, detectBinary } from './chunking';
import { SourceFile } from './types';
import { AIParsingError } from './errors';

describe('chunking and parsing', () => {
  it('extractTextFromBuffer handles text/plain', async () => {
    const text = 'Hello world';
    const buffer = new TextEncoder().encode(text).buffer;
    const result = await extractTextFromBuffer(buffer, 'text/plain');
    expect(result).toBe(text);
  });

  it('extractTextFromBuffer handles text/csv', async () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const buffer = new TextEncoder().encode(csv).buffer;
    const result = await extractTextFromBuffer(buffer, 'text/csv');
    const parsed = JSON.parse(result);
    expect(parsed[0].name).toBe('Alice');
    expect(parsed[1].age).toBe('25');
  });

  it('extractTextFromBuffer handles application/json', async () => {
    const json = '{"key": "value"}';
    const buffer = new TextEncoder().encode(json).buffer;
    const result = await extractTextFromBuffer(buffer, 'application/json');
    expect(JSON.parse(result).key).toBe('value');
  });

  it('extractTextFromBuffer throws on unsupported type', async () => {
    const buffer = new TextEncoder().encode('dummy').buffer;
    await expect(extractTextFromBuffer(buffer, 'image/png')).rejects.toThrow(AIParsingError);
  });

  it('validateAndPrepareFiles enforces max limits', () => {
    const files: SourceFile[] = [
      {
        evidenceId: '1',
        blobId: 'a',
        fileName: 'test.txt',
        sha256: 'hash',
        mimeType: 'text/plain',
        content: '12345'
      }
    ];

    expect(() => validateAndPrepareFiles(files, 4)).toThrow(AIParsingError);
    expect(() => validateAndPrepareFiles(files, 10)).not.toThrow();
  });

  describe('detectBinary', () => {
    it('detects a purely binary buffer as binary', () => {
      // 10 null bytes
      const buf = new ArrayBuffer(10);
      const view = new Uint8Array(buf);
      for (let i = 0; i < 10; i++) view[i] = 0;
      expect(detectBinary(buf)).toBe(true);
    });

    it('detects normal string buffer as not binary', () => {
      const text = 'Hello world, this is a normal text string.';
      const buf = new TextEncoder().encode(text).buffer;
      expect(detectBinary(buf)).toBe(false);
    });

    it('throws AIParsingError when extracting text from a binary file masquerading as text/plain', async () => {
      const buf = new ArrayBuffer(10);
      const view = new Uint8Array(buf);
      for (let i = 0; i < 10; i++) view[i] = 0; // completely binary nulls

      await expect(extractTextFromBuffer(buf, 'text/plain')).rejects.toThrow('No meaningful text could be extracted from this file (detected binary or heavy corruption).');
    });

    it('throws AIParsingError for empty text extraction', async () => {
      const buf = new TextEncoder().encode('   \n  ').buffer; // just whitespace
      await expect(extractTextFromBuffer(buf, 'text/plain')).rejects.toThrow('No meaningful text could be extracted from this file.');
    });
  });
});
