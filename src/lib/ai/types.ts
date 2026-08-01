export type AnalysisType = 'consistency-audit' | 'document-summary' | 'document-compare';

export type SeverityLevel = 'info' | 'low' | 'medium' | 'high';

export interface SourceFile {
  evidenceId: string;
  blobId: string;
  fileName: string;
  sha256: string;
  mimeType: string;
  content?: string; // Loaded on server side
}

export interface Citation {
  evidenceId: string;
  fileName: string;
  page: number | null;
  lineStart: number | null;
  lineEnd: number | null;
  excerpt: string | null;
}

export interface AuditFinding {
  id: string;
  severity: SeverityLevel;
  title: string;
  claim: string;
  explanation: string;
  citations: Citation[];
}

export interface AuditReport {
  runId: string;
  analysisType: AnalysisType;
  createdAt: string;
  model: string;
  sourceFiles: Omit<SourceFile, 'content'>[];
  summary: string;
  findings: AuditFinding[];
  limitations: string[];
}

export interface AgentRunManifest {
  runId: string;
  analysisType: AnalysisType;
  createdAt: string;
  requestedBy: string;
  model: string;
  promptVersion: string;
  sourceFiles: Omit<SourceFile, 'content' | 'mimeType'>[];
  reportFiles: {
    json: string;
    markdown: string;
  };
  reportSha256: string;
  status: 'completed' | 'failed';
}
