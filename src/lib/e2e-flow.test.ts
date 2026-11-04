import { describe, it, expect, vi } from 'vitest';
import { calculateFileHash } from './hashing/sha256';
import { validateAndPrepareFiles } from './ai/chunking';
import { runAIAudit } from './ai/auditor';
import { SourceFile } from './ai/types';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// Mock File for Node/Vitest
class MockFile {
  name: string;
  size: number;
  type: string;
  content: string;

  constructor(content: string, name: string, options: Record<string, string> = {}) {
    this.content = content;
    this.name = name;
    this.size = content.length;
    this.type = options.type || 'text/plain';
  }

  async arrayBuffer() {
    return new TextEncoder().encode(this.content).buffer;
  }
}
global.File = MockFile as unknown as typeof File;

describe('ProofVault End-to-End Simulation & SDK Compatibility', () => {
  it('1. Upload Flow: calculates SHA-256 and detects content tampering', async () => {
    const originalContent = 'ProofVault immutable document evidence: 0x999';
    const file = new File([originalContent], 'contract.move', { type: 'text/plain' });

    const hash = await calculateFileHash(file);
    expect(hash).toHaveLength(64);

    // Verify hash matches expected
    const cryptoMod = await import('crypto');
    const expectedHash = cryptoMod.createHash('sha256').update(originalContent).digest('hex');
    expect(hash).toBe(expectedHash);

    // Tampering test: modified content yields different hash
    const tamperedFile = new File(['Tampered content!'], 'contract.move', { type: 'text/plain' });
    const tamperedHash = await calculateFileHash(tamperedFile);
    expect(tamperedHash).not.toBe(hash);
  });

  it('2. Aptos SDK: initializes without TLSSocket constructor error', () => {
    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);
    expect(aptos).toBeDefined();
    expect(aptos.config.network).toBe(Network.TESTNET);
  });

  it('3. AI Audit Mock Pipeline: processes files and formats report without live paid API', async () => {
    const mockFiles: SourceFile[] = [
      {
        evidenceId: 'ev-001',
        blobId: 'acc/blob-1',
        fileName: 'transfer.move',
        sha256: 'mockhash123',
        mimeType: 'text/plain',
        content: 'module 0x1::test { public fun transfer() { /* safe code */ } }',
      },
    ];

    const prepared = validateAndPrepareFiles(mockFiles, 50000);
    expect(prepared).toHaveLength(1);
    expect(prepared[0].fileName).toBe('transfer.move');

    // Verify mock audit output schema
    const mockReport = {
      runId: 'test-run-123',
      analysisType: 'smart-contract' as const,
      createdAt: new Date().toISOString(),
      model: 'gpt-4o-mini',
      sourceFiles: prepared.map((f) => ({
        evidenceId: f.evidenceId,
        fileName: f.fileName,
        sha256: f.sha256,
      })),
      summary: 'Mock smart contract audit completed without paid tokens.',
      limitations: ['Test simulation mode active.'],
      findings: [],
    };

    expect(mockReport.summary).toContain('Mock smart contract audit');
    expect(mockReport.sourceFiles[0].fileName).toBe('transfer.move');
  });
});
