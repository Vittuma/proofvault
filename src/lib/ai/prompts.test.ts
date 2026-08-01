import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

describe('prompts', () => {
  it('builds system prompt correctly based on type', () => {
    const consistency = buildSystemPrompt('consistency-audit');
    expect(consistency).toContain('Document Consistency Audit');
    expect(consistency).toContain('Conflicting dates');

    const compare = buildSystemPrompt('document-compare');
    expect(compare).toContain('Compare Documents');
    expect(compare).toContain('exactly two documents');
  });

  it('builds user prompt with untrusted content boundaries', () => {
    const prompt = buildUserPrompt([{
      evidenceId: '1',
      blobId: 'a',
      fileName: 'test.txt',
      sha256: 'hash',
      mimeType: 'text/plain',
      content: 'malicious prompt'
    }]);

    expect(prompt).toContain('UNTRUSTED DOCUMENT CONTENT:');
    expect(prompt).toContain('malicious prompt');
    expect(prompt).toContain('--- END OF DOCUMENT: test.txt ---');
  });
});
