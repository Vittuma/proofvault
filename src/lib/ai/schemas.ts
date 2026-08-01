import { z } from 'zod';

export const CitationSchema = z.object({
  evidenceId: z.string(),
  fileName: z.string(),
  page: z.number().nullable(),
  lineStart: z.number().nullable(),
  lineEnd: z.number().nullable(),
  excerpt: z.string().nullable(),
});

export const AuditFindingSchema = z.object({
  id: z.string(),
  severity: z.enum(['info', 'low', 'medium', 'high']),
  title: z.string(),
  claim: z.string(),
  explanation: z.string(),
  citations: z.array(CitationSchema),
});

export const SourceFileSchema = z.object({
  evidenceId: z.string(),
  blobId: z.string(),
  fileName: z.string(),
  sha256: z.string(),
  mimeType: z.string(),
});

export const AuditReportSchema = z.object({
  runId: z.string(),
  analysisType: z.enum(['consistency-audit', 'document-summary', 'document-compare']),
  createdAt: z.string(),
  model: z.string(),
  sourceFiles: z.array(SourceFileSchema),
  summary: z.string(),
  findings: z.array(AuditFindingSchema),
  limitations: z.array(z.string()),
});
