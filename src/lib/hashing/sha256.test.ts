import { describe, it, expect } from 'vitest';
import { calculateFileHash } from './sha256';

// Minimal mock for File and crypto.subtle.digest since we're testing in Node/Vitest
class MockFile {
  name: string;
  size: number;
  type: string;
  content: string;

  constructor(content: string, name: string, options: Record<string, string> = {}) {
    this.content = content;
    this.name = name;
    this.size = content.length;
    this.type = options.type || '';
  }

  async arrayBuffer() {
    return new TextEncoder().encode(this.content).buffer;
  }
}

global.File = MockFile as unknown as typeof File;

describe('Hashing Module', () => {
  it('calculates the correct SHA-256 hash for a given file content', async () => {
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    
    // In a real browser environment, crypto.subtle is available.
    // Since we run this in vitest (Node), we use Node's crypto to mock subtle if missing,
    // or just rely on a polyfill.
    if (!global.crypto) {
      const cryptoMod = await import('crypto');
      global.crypto = {
        subtle: {
          digest: async (algo: string, data: BufferSource) => {
            const hash = cryptoMod.createHash('sha256');
            hash.update(Buffer.from(data as ArrayBuffer));
            return new Uint8Array(hash.digest()).buffer;
          }
        }
      } as unknown as Crypto;
    }

    const hashHex = await calculateFileHash(file);
    // SHA256 of 'hello world'
    expect(hashHex).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('formats hash properly (lowercase, 64 chars)', async () => {
    const file = new File(['test format'], 'format.txt', { type: 'text/plain' });
    const hashHex = await calculateFileHash(file);
    expect(hashHex).toMatch(/^[a-f0-9]{64}$/);
  });
});
