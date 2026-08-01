import { describe, it, expect } from 'vitest';
import { verifyCitations } from './verification';
import { AuditReport, SourceFile } from './types';

describe('verifyCitations', () => {
  const dummySourceFiles: SourceFile[] = [
    {
      evidenceId: '1',
      blobId: 'blob1',
      fileName: 'test.txt',
      sha256: 'abc',
      mimeType: 'text/plain',
      content: 'This is a valid sentence in the document. \n\n Another fact: user owes $500.',
    },
  ];

  const baseReport: AuditReport = {
    runId: 'run1',
    analysisType: 'document-summary',
    createdAt: '2026-08-01T00:00:00Z',
    model: 'gpt-4o',
    sourceFiles: [],
    summary: 'Test summary',
    limitations: [],
    findings: [],
  };

  it('keeps citations that exist verbatim (ignoring whitespace)', () => {
    const report: AuditReport = {
      ...baseReport,
      findings: [
        {
          id: 'f1',
          severity: 'info',
          title: 'Fact 1',
          claim: 'User owes money',
          explanation: 'As stated in the text',
          citations: [
            {
              evidenceId: '1',
              fileName: 'test.txt',
              page: null,
              lineStart: null,
              lineEnd: null,
              excerpt: 'Another fact: user owes $500',
            }
          ]
        }
      ]
    };

    const verified = verifyCitations(report, dummySourceFiles);
    expect(verified.findings.length).toBe(1);
    expect(verified.findings[0].citations.length).toBe(1);
  });

  it('removes citations that are hallucinated', () => {
    const report: AuditReport = {
      ...baseReport,
      findings: [
        {
          id: 'f1',
          severity: 'high',
          title: 'Fake Fact',
          claim: 'AI made this up',
          explanation: 'It hallucinated',
          citations: [
            {
              evidenceId: '1',
              fileName: 'test.txt',
              page: null,
              lineStart: null,
              lineEnd: null,
              excerpt: 'The document appears to be corrupted',
            }
          ]
        }
      ]
    };

    const verified = verifyCitations(report, dummySourceFiles);
    // Since it had only 1 citation which was removed, the entire finding is dropped
    expect(verified.findings.length).toBe(0);
  });

  it('keeps findings if at least one citation is valid', () => {
    const report: AuditReport = {
      ...baseReport,
      findings: [
        {
          id: 'f1',
          severity: 'info',
          title: 'Mixed Fact',
          claim: 'Valid and invalid',
          explanation: 'Some valid, some not',
          citations: [
            {
              evidenceId: '1',
              fileName: 'test.txt',
              page: null,
              lineStart: null,
              lineEnd: null,
              excerpt: 'Another fact: user owes $500.',
            },
            {
              evidenceId: '1',
              fileName: 'test.txt',
              page: null,
              lineStart: null,
              lineEnd: null,
              excerpt: 'Hallucinated text here',
            }
          ]
        }
      ]
    };

    const verified = verifyCitations(report, dummySourceFiles);
    expect(verified.findings.length).toBe(1);
    expect(verified.findings[0].citations.length).toBe(1);
    expect(verified.findings[0].citations[0].excerpt).toBe('Another fact: user owes $500.');
  });
});
