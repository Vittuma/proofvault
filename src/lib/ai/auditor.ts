import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { getAIClient } from './client';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import { verifyCitations } from './verification';
import { AnalysisType, SourceFile, AuditReport } from './types';
import { AIProviderError } from './errors';
const RawOutputSchema = z.object({
  summary: z.string(),
  findings: z.array(z.object({
    id: z.string(),
    severity: z.enum(['info', 'low', 'medium', 'high']),
    title: z.string(),
    claim: z.string(),
    explanation: z.string(),
    citations: z.array(z.object({
      evidenceId: z.string(),
      fileName: z.string(),
      page: z.number().nullable(),
      lineStart: z.number().nullable(),
      lineEnd: z.number().nullable(),
      excerpt: z.string().nullable(),
    })),
  })),
  limitations: z.array(z.string()),
});

export const runAIAudit = async (
  runId: string,
  analysisType: AnalysisType,
  sourceFiles: SourceFile[]
): Promise<AuditReport> => {
  const client = getAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const systemMessage = buildSystemPrompt(analysisType);
  const userMessage = buildUserPrompt(sourceFiles);

  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      response_format: zodResponseFormat(RawOutputSchema, 'audit_report'),
      temperature: 0.2, // Low temp for analytical consistency
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AIProviderError('AI returned an empty or invalid response.');
    }

    const parsedResult = JSON.parse(content);

    // Map RawOutput into full AuditReport
    const finalReport: AuditReport = {
      runId,
      analysisType,
      createdAt: new Date().toISOString(),
      model,
      sourceFiles: sourceFiles.map(f => ({
        evidenceId: f.evidenceId,
        blobId: f.blobId,
        fileName: f.fileName,
        sha256: f.sha256,
        mimeType: f.mimeType
      })),
      summary: parsedResult.summary,
      findings: parsedResult.findings,
      limitations: parsedResult.limitations,
    };

    return verifyCitations(finalReport, sourceFiles);

  } catch (err: unknown) {
    const error = err as Error;
    console.error('runAIAudit Error:', error);
    throw new AIProviderError(error.message || 'An unknown error occurred during AI processing.');
  }
};
