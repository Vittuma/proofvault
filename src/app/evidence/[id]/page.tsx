'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getEvidenceById } from '@/lib/aptos/views';
import { EvidenceRecord } from '@/lib/aptos/types';
import { MODULE_ADDRESS } from '@/lib/aptos/client';
import { downloadFromShelby } from '@/lib/shelby/download';
import { buildShelbyExplorerUrl } from '@/lib/shelby/explorer';
import { VerificationComponent } from '@/components/verification/VerificationComponent';
import { Loader2, Download, Copy, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EvidenceDetail() {
  const { id } = useParams();
  const [evidence, setEvidence] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        if (!id) return;
        const data = await getEvidenceById(MODULE_ADDRESS, parseInt(id as string, 10));
        setEvidence(data);
      } catch (err) {
        console.error('Failed to fetch evidence:', err);
        setError('Evidence not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [id]);

  const handleDownload = async () => {
    if (!evidence) return;
    setDownloading(true);
    try {
      let accountAddr = '';
      let blobName = evidence.blob_identifier;
      if (evidence.blob_identifier.includes('/')) {
        const parts = evidence.blob_identifier.split('/');
        accountAddr = parts[0];
        blobName = parts.slice(1).join('/');
      }
      const blob = await downloadFromShelby(accountAddr, blobName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = evidence.original_file_name || 'downloaded-evidence';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file from Shelby storage.');
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  if (error || !evidence) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Evidence Not Found</h2>
        <p className="text-slate-400 mb-8">{error || 'The requested evidence ID does not exist.'}</p>
        <Link href="/evidence" className="text-cyan-400 hover:underline">
          Return to Archive
        </Link>
      </div>
    );
  }

  const dateStr = new Date(parseInt(evidence.created_at) * 1000).toLocaleString();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 w-full space-y-8">
      <Link href="/evidence" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to Archive
      </Link>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-cyan-900/30 text-cyan-400 text-sm font-semibold rounded-md uppercase tracking-wider">
            {evidence.category}
          </span>
          <span className="px-3 py-1 bg-slate-800 text-slate-300 text-sm font-medium rounded-md">
            {evidence.project_or_topic}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">{evidence.title}</h1>
        <p className="text-lg text-slate-300 leading-relaxed">{evidence.description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-6">
          <h3 className="text-xl font-semibold border-b border-slate-800 pb-4">Metadata</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-slate-500 block mb-1">Publisher Address</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-300 truncate">{evidence.publisher}</span>
                <button onClick={() => copyToClipboard(evidence.publisher)} className="text-slate-500 hover:text-white"><Copy size={14}/></button>
              </div>
            </div>
            
            <div>
              <span className="text-slate-500 block mb-1">Shelby Blob ID</span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-300 truncate">{evidence.blob_identifier}</span>
                  <button onClick={() => copyToClipboard(evidence.blob_identifier)} className="text-slate-500 hover:text-white"><Copy size={14}/></button>
                </div>
                {evidence.blob_identifier.includes('/') ? (
                  <a href={buildShelbyExplorerUrl(evidence.blob_identifier.split('/')[0], evidence.blob_identifier.split('/').slice(1).join('/'), 'testnet')} target="_blank" rel="noopener noreferrer" className="text-cyan-400 text-xs hover:underline">
                    View on Shelby Explorer ↗
                  </a>
                ) : (
                  <span className="text-slate-500 text-xs italic">Explorer link unavailable</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Registered Hash (SHA-256)</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-300 truncate">{evidence.sha256_hash}</span>
                <button onClick={() => copyToClipboard(evidence.sha256_hash)} className="text-slate-500 hover:text-white"><Copy size={14}/></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <span className="text-slate-500 block mb-1">Document Date</span>
                <span className="text-slate-300">{evidence.document_date || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Registration Date</span>
                <span className="text-slate-300">{dateStr}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">File Size</span>
                <span className="text-slate-300">{(parseInt(evidence.file_size) / 1024).toFixed(2)} KB</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Visibility</span>
                <span className="text-slate-300">{evidence.visibility === 0 ? 'Public' : 'Private'}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              {downloading ? 'Downloading...' : 'Download Original File'}
            </button>
          </div>
        </div>

        <div>
          <VerificationComponent expectedHash={evidence.sha256_hash} />
        </div>
      </div>
    </div>
  );
}
