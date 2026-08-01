import { NextRequest, NextResponse } from 'next/server';
import { getServerShelbyClient } from '@/lib/shelby/serverClient';
import { calculateFileHash } from '@/lib/hashing/sha256';
import { extractTextFromBuffer, validateAndPrepareFiles } from '@/lib/ai/chunking';
import { runAIAudit } from '@/lib/ai/auditor';
import { AnalysisType, SourceFile } from '@/lib/ai/types';
import { IntegrityError, ValidationError, AIProviderError, AIParsingError } from '@/lib/ai/errors';

export const maxDuration = 300; // Allow up to 5 minutes on Vercel/Railway if supported

interface AuditRequestPayload {
  analysisType: AnalysisType;
  files: {
    evidenceId: string;
    blobId: string;
    fileName: string;
    expectedSha256: string;
    mimeType: string;
  }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: AuditRequestPayload = await req.json();

    if (!body.analysisType || !body.files || !Array.isArray(body.files)) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const maxFiles = parseInt(process.env.AI_MAX_FILES || '5', 10);
    if (body.files.length > maxFiles) {
      return NextResponse.json({ error: `Cannot analyze more than ${maxFiles} files.` }, { status: 400 });
    }

    if (body.analysisType === 'document-compare' && body.files.length !== 2) {
      return NextResponse.json({ error: 'Document comparison requires exactly 2 files.' }, { status: 400 });
    }

    const maxFileBytes = parseInt(process.env.AI_MAX_FILE_BYTES || '10485760', 10);
    const shelbyClient = await getServerShelbyClient();

    const loadedFiles: SourceFile[] = [];

    // 1. Download and verify each file
    for (const fileReq of body.files) {
      const parts = fileReq.blobId.split('/');
      if (parts.length < 2) {
        throw new ValidationError(`Invalid blobId format for ${fileReq.fileName}`);
      }
      const account = parts[0];
      const name = parts.slice(1).join('/');

      let buffer: ArrayBuffer;

      if (!shelbyClient) {
        // Fallback for local mock
        const mockContent = 'This is a mock local document. It states that the total amount is 1500 USD and the due date is 2026-10-15.';
        buffer = new TextEncoder().encode(mockContent).buffer;
      } else {
        const downloadStream = await shelbyClient.download({ account, blobName: name });
        const response = new Response(downloadStream.readable);
        buffer = await response.arrayBuffer();
      }

      if (buffer.byteLength > maxFileBytes) {
        throw new ValidationError(`File ${fileReq.fileName} exceeds the ${maxFileBytes} bytes limit.`);
      }

      // Verify Hash
      const fileBlob = new Blob([buffer]);
      const actualHash = await calculateFileHash(fileBlob as File);
      if (actualHash !== fileReq.expectedSha256 && shelbyClient !== null) { // Skip strict check in local mock
        throw new IntegrityError(`Hash mismatch for ${fileReq.fileName}. Expected ${fileReq.expectedSha256}, got ${actualHash}.`);
      }

      // Extract Text
      const textContent = await extractTextFromBuffer(buffer, fileReq.mimeType);

      loadedFiles.push({
        evidenceId: fileReq.evidenceId,
        blobId: fileReq.blobId,
        fileName: fileReq.fileName,
        sha256: actualHash,
        mimeType: fileReq.mimeType,
        content: textContent,
      });
    }

    // 2. Validate token/char limits
    const maxTotalChars = parseInt(process.env.AI_MAX_TOTAL_CHARACTERS || '200000', 10);
    const preparedFiles = validateAndPrepareFiles(loadedFiles, maxTotalChars);

    // 3. Run AI Audit
    const runId = crypto.randomUUID();
    const report = await runAIAudit(runId, body.analysisType, preparedFiles);

    return NextResponse.json(report, { status: 200 });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Audit API Error:', error);

    if (error instanceof ValidationError || error instanceof IntegrityError || error instanceof AIParsingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (error instanceof AIProviderError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json({ error: 'An unexpected internal error occurred.' }, { status: 500 });
  }
}
