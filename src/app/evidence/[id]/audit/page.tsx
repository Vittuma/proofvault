'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getEvidenceById } from '@/lib/aptos/views';
import { EvidenceRecord } from '@/lib/aptos/types';
import { MODULE_ADDRESS } from '@/lib/aptos/client';
import { Loader2, ArrowLeft, Bot, AlertTriangle, FileText, CheckCircle2, Save } from 'lucide-react';
import Link from 'next/link';
import { useShelbyUpload } from '@/lib/shelby/upload';
import { getStorageMode } from '@/lib/shelby/client';
import { buildRegisterEvidencePayload, extractEvidenceIdFromReceipt } from '@/lib/aptos/transactions';
import { aptosClient } from '@/lib/aptos/client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AuditReport, AnalysisType, AgentRunManifest } from '@/lib/ai/types';
import { saveLocalRun } from '@/lib/ai/local-runs';

export default function AuditPage() {
  const { id } = useParams();
  const { signAndSubmitTransaction, account } = useWallet();
  const { upload } = useShelbyUpload();

  const [evidence, setEvidence] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [analysisType, setAnalysisType] = useState<AnalysisType>('document-summary');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done' | 'saving' | 'saved'>('idle');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [pendingManifest, setPendingManifest] = useState<AgentRunManifest | null>(null);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        if (!id) return;
        const data = await getEvidenceById(MODULE_ADDRESS, parseInt(id as string, 10));
        setEvidence(data);
      } catch (err) {
        console.error(err);
        setError('Evidence not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [id]);

  const handleStartAnalysis = async () => {
    if (!evidence) return;
    if (!agreed) {
      setError('Please agree to the AI processing terms.');
      return;
    }
    
    setStatus('analyzing');
    setError(null);
    setReport(null);

    try {
      // In MVP, we just analyze the current single evidence file.
      // A more complex UI could allow selecting multiple IDs.
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisType,
          files: [{
            evidenceId: evidence.id,
            blobId: evidence.blob_identifier,
            fileName: evidence.title + '.txt', // In real app, we might infer extension
            expectedSha256: evidence.sha256_hash,
            mimeType: 'text/plain' // Simplification for MVP
          }]
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed.');
      }

      setReport(data as AuditReport);
      setStatus('done');
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Analysis failed.');
      setStatus('idle');
    }
  };

  const handleSaveReport = async () => {
    if (!report || !evidence) return;
    setStatus('saving');
    setError(null);

    try {
      const reportFile = new File([JSON.stringify(report, null, 2)], `report-${report.runId}.json`, { type: 'application/json' });
      
      // Upload report to Shelby
      const reportRes = await upload(reportFile);
      const reportBlobId = reportRes.blobId;

      // Predict Manifest Blob ID
      const manifestFileName = `manifest-${report.runId}.json`;
      const mode = getStorageMode();
      const accountAddress = account?.address?.toString() || '';
      
      // Compute the deterministic ID based on Shelby's format or local mock
      const predictedManifestBlobId = mode === 'local' 
        ? `local_blob_${manifestFileName}` 
        : `${accountAddress}/${manifestFileName}`;

      // Hash the report for Aptos registration
      const hashBuffer = await crypto.subtle.digest('SHA-256', await reportFile.arrayBuffer());
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Register on Aptos
      const payload = buildRegisterEvidencePayload(
        MODULE_ADDRESS,
        'AI Report', // category
        evidence.project_or_topic, // projectOrTopic
        `AI Report: ${evidence.title}`, // title
        `Analysis: ${report.analysisType}. Manifest: ${predictedManifestBlobId}`, // description
        new Date().toISOString().split('T')[0], // documentDate
        reportBlobId, // blobIdentifier
        `report-${report.runId}.json`, // originalFileName
        'application/json', // mimeType
        reportFile.size, // fileSize
        sha256Hex, // sha256HashHex
        0 // visibility
      );

      const response = await signAndSubmitTransaction(payload);
      const txResult = await aptosClient.waitForTransaction({ transactionHash: response.hash });
      
      // Extract the real Evidence ID from the transaction receipt
      const reportEvidenceId = extractEvidenceIdFromReceipt(txResult) || '0';
      if (reportEvidenceId === '0') {
        throw new Error('Failed to extract Evidence ID from transaction receipt. Transaction might have failed.');
      }

      // Create manifest with all required fields
      const manifest: AgentRunManifest = {
        runId: report.runId,
        analysisType: report.analysisType,
        createdAt: report.createdAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requestedBy: (txResult as any).sender || 'unknown',
        model: report.model,
        promptVersion: '1.0',
        sourceEvidenceIds: [evidence.id],
        reportEvidenceId: reportEvidenceId,
        aptosTransactionHash: response.hash,
        manifestBlobId: predictedManifestBlobId,
        reportBlobId: reportBlobId,
        sourceFiles: report.sourceFiles,
        reportFiles: {
          json: reportBlobId,
        },
        reportSha256: sha256Hex,
        status: 'completed'
      };

      // Upload manifest to Shelby
      try {
        const manifestFile = new File([JSON.stringify(manifest, null, 2)], manifestFileName, { type: 'application/json' });
        const manifestRes = await upload(manifestFile);
        
        // Verify our prediction was correct
        if (manifestRes.blobId !== predictedManifestBlobId) {
          console.warn(`Manifest Blob ID prediction mismatch. Expected ${predictedManifestBlobId}, got ${manifestRes.blobId}`);
          manifest.manifestBlobId = manifestRes.blobId;
        }

        // Save to local storage cache
        saveLocalRun(manifest);
        setStatus('saved');
      } catch (uploadError) {
        console.error('Failed to upload manifest:', uploadError);
        manifest.status = 'manifest_pending';
        saveLocalRun(manifest);
        setPendingManifest(manifest);
        setError('Aptos transaction succeeded, but manifest upload failed. You can retry the manifest upload below.');
        setStatus('done');
      }

    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Failed to save report.');
      setStatus('done');
    }
  };

  const handleRetryManifest = async () => {
    if (!pendingManifest) return;
    setStatus('saving');
    setError(null);
    try {
      const manifestFileName = `manifest-${pendingManifest.runId}.json`;
      // Convert status back to completed before uploading
      const manifestToUpload = { ...pendingManifest, status: 'completed' as const };
      const manifestFile = new File([JSON.stringify(manifestToUpload, null, 2)], manifestFileName, { type: 'application/json' });
      const manifestRes = await upload(manifestFile);
      
      if (manifestRes.blobId !== pendingManifest.manifestBlobId) {
        console.warn(`Manifest Blob ID prediction mismatch during retry. Expected ${pendingManifest.manifestBlobId}, got ${manifestRes.blobId}`);
        manifestToUpload.manifestBlobId = manifestRes.blobId;
      }
      
      saveLocalRun(manifestToUpload);
      setPendingManifest(null);
      setStatus('saved');
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError('Failed to upload manifest during retry: ' + error.message);
      setStatus('done');
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;
  }

  if (!evidence) {
    return <div className="p-8 text-center text-red-400">Evidence not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/evidence/${id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Evidence
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">ProofVault AI Auditor</h1>
            <p className="text-sm text-slate-400">Run verifiable AI analysis on your documents.</p>
          </div>
        </div>

        {status === 'idle' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Analysis Type</label>
              <select 
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as AnalysisType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="document-summary">Document Summary</option>
                <option value="consistency-audit">Consistency Audit</option>
                <option value="document-compare">Document Compare (Requires 2 files)</option>
              </select>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Selected Document</h3>
              <div className="flex items-center gap-2 text-sm">
                <FileText size={16} className="text-indigo-400" />
                <span className="text-white">{evidence.title}</span>
                <span className="text-slate-500 font-mono">({evidence.blob_identifier.substring(0, 16)}...)</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                id="agree" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="agree" className="text-sm text-slate-400">
                I understand that the selected file contents will be processed by the configured AI provider. AI-generated findings may be incomplete or incorrect. Always review the cited source files.
              </label>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleStartAnalysis}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Bot size={18} />
              Start Analysis
            </button>
          </div>
        )}

        {status === 'analyzing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <div className="text-slate-300">
              <p className="font-medium">Analyzing Document</p>
              <p className="text-sm text-slate-500">Downloading source files, verifying integrity, and running AI model...</p>
            </div>
          </div>
        )}

        {status === 'saving' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <div className="text-slate-300">
              <p className="font-medium">Saving Verified Report</p>
              <p className="text-sm text-slate-500">Uploading to Shelby and registering on ProofVault...</p>
            </div>
          </div>
        )}

        {status === 'saved' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-slate-300">
              <p className="font-medium text-lg">Report Saved Successfully!</p>
              <p className="text-sm text-slate-500">Your AI report is now verifiable on Aptos.</p>
            </div>
            <Link href="/evidence" className="text-indigo-400 hover:underline">
              View all records
            </Link>
          </div>
        )}

        {(status === 'done' || status === 'saving') && report && (
          <div className="space-y-6">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-white mb-2">Executive Summary</h2>
              <p className="text-slate-300 text-sm whitespace-pre-wrap">{report.summary}</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-medium">Findings ({report.findings.length})</h3>
              {report.findings.length === 0 ? (
                <p className="text-slate-500 text-sm">No specific findings matching the criteria.</p>
              ) : (
                report.findings.map(finding => (
                  <div key={finding.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="text-slate-200 font-medium">{finding.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full uppercase font-medium \${
                        finding.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        finding.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                        finding.severity === 'low' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{finding.claim}</p>
                    <p className="text-sm text-slate-500">{finding.explanation}</p>
                    
                    {finding.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Source Citations</span>
                        <ul className="space-y-2">
                          {finding.citations.map((cit, idx) => (
                            <li key={idx} className="text-xs text-slate-400 bg-slate-900 p-2 rounded">
                              <span className="font-mono text-indigo-400 block mb-1">
                                {cit.fileName} {cit.page ? `(Page ${cit.page})` : ''}
                              </span>
                              {cit.excerpt && <span className="italic border-l-2 border-slate-700 pl-2 block">&quot;{cit.excerpt}&quot;</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {report.limitations.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <h3 className="text-orange-400 text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} /> Analysis Limitations
                </h3>
                <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                  {report.limitations.map((limit, idx) => (
                    <li key={idx}>{limit}</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            {pendingManifest ? (
              <button
                onClick={handleRetryManifest}
                disabled={status === 'saving'}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {status === 'saving' ? 'Retrying...' : 'Retry Manifest Upload'}
              </button>
            ) : (
              <button
                onClick={handleSaveReport}
                disabled={status === 'saving'}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Verified Report
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
