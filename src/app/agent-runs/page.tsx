'use client';

import { useEffect, useState } from 'react';
import { getEvidenceById, getTotalEvidenceCount, getAllEvidencePaginated } from '@/lib/aptos/views';
import { MODULE_ADDRESS } from '@/lib/aptos/client';
import { AgentRunManifest } from '@/lib/ai/types';
import { getLocalRuns, saveLocalRun } from '@/lib/ai/local-runs';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { downloadFromShelby } from '@/lib/shelby/download';
import { Loader2, Bot, ArrowRight, ExternalLink, ShieldAlert, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface RunWithStatus extends AgentRunManifest {
  recordAvailable: boolean | null;
}

export default function AgentRunsPage() {
  const [runs, setRuns] = useState<RunWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { account } = useWallet();
  const PAGE_LIMIT = 50;

  const loadLocalCache = async () => {
    const localRuns = getLocalRuns();
    const runsWithStatus: RunWithStatus[] = [];

    for (const run of localRuns) {
      let recordAvailable = null;
      if (run.reportEvidenceId && run.reportEvidenceId !== '0') {
        try {
          const ev = await getEvidenceById(MODULE_ADDRESS, parseInt(run.reportEvidenceId, 10));
          recordAvailable = ev !== null;
        } catch {
          recordAvailable = false;
        }
      } else {
        recordAvailable = false;
      }

      runsWithStatus.push({
        ...run,
        recordAvailable,
      });
    }
    
    runsWithStatus.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRuns(runsWithStatus);
  };

  const syncFromChain = async (append = false) => {
    if (!account?.address) return;
    setSyncing(true);
    
    try {
      let currentTotalCount = totalCount;
      if (!append || currentTotalCount === 0) {
        currentTotalCount = await getTotalEvidenceCount(MODULE_ADDRESS);
        setTotalCount(currentTotalCount);
      }
      
      if (currentTotalCount === 0) {
        setHasMore(false);
        return;
      }

      const currentOffset = append ? offset : 0;
      const startId = currentTotalCount - currentOffset;
      
      if (startId <= 0) {
        setHasMore(false);
        return;
      }

      // MVP: sequentially read batch of records
      const recentEvidences = await getAllEvidencePaginated(MODULE_ADDRESS, startId, PAGE_LIMIT);
      
      // Update hasMore based on how many we read
      setHasMore(startId - recentEvidences.length > 0);
      if (!append) {
        setOffset(PAGE_LIMIT);
      } else {
        setOffset(currentOffset + PAGE_LIMIT);
      }

      const userReports = recentEvidences.filter(ev => 
        ev.publisher === account.address.toString() && 
        (ev.title.startsWith('AI Report:') || ev.category.includes('AI Report'))
      );

      for (const ev of userReports) {
        // Extract manifestBlobId from description
        const match = ev.description.match(/Manifest:\s*([^\s]+)/);
        if (match && match[1]) {
          const manifestBlobId = match[1];
          const localRuns = getLocalRuns();
          const exists = localRuns.find(r => r.manifestBlobId === manifestBlobId);
          
          if (!exists) {
            try {
              let accountAddr = '';
              let blobName = manifestBlobId;
              
              if (manifestBlobId.includes('/')) {
                const parts = manifestBlobId.split('/');
                accountAddr = parts[0];
                blobName = parts.slice(1).join('/');
              } else if (manifestBlobId.startsWith('local_blob_')) {
                blobName = manifestBlobId;
              }
              
              const blobData = await downloadFromShelby(accountAddr, blobName);
              const text = await blobData.text();
              
              try {
                const manifest = JSON.parse(text) as AgentRunManifest;
                if (manifest && manifest.runId && manifest.reportEvidenceId) {
                  saveLocalRun(manifest);
                }
              } catch {
                console.warn(`Failed to parse manifest JSON for ${manifestBlobId}. This might be a mock local blob.`);
              }
            } catch (err) {
              console.error(`Failed to recover manifest ${manifestBlobId}:`, err);
            }
          }
        }
      }
      
      await loadLocalCache();
    } catch (err) {
      console.error('Failed to sync agent runs from chain:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadLocalCache();
      setLoading(false);
      
      if (account?.address) {
        syncFromChain();
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Bot className="text-indigo-500" size={32} />
            Agent Runs
          </h1>
          <p className="text-slate-400 mt-2">
            History of all verified AI audits. Reports are stored on Shelby and anchored on Aptos.
          </p>
        </div>
        <button 
          onClick={() => syncFromChain(false)} 
          disabled={syncing || !account?.address}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
          title={!account?.address ? "Connect wallet to sync history" : "Sync from blockchain"}
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin text-indigo-400' : ''} />
          {syncing ? 'Syncing...' : 'Sync History'}
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
          No agent runs found. Go to any evidence document and click &quot;Analyze with AI&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {runs.map(run => {
            const dateStr = new Date(run.createdAt).toLocaleString();
            return (
              <div key={run.runId} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wider ${
                      run.status === 'completed' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {run.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {run.reportEvidenceId && run.reportEvidenceId !== '0' ? `Evidence #${run.reportEvidenceId}` : 'ID Unverified'}
                    </span>
                  </div>
                  <h3 className="text-white font-medium text-lg mb-2 line-clamp-2">
                    AI Report: {run.analysisType}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                    Model: {run.model} <br/>
                    Source Evidence: #{run.sourceEvidenceIds?.join(', ')}
                  </p>
                  <div className="text-xs text-slate-500 mb-4">
                    Run Date: {dateStr}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  {run.recordAvailable ? (
                    <Link 
                      href={`/evidence/${run.reportEvidenceId}`}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
                    >
                      View Record <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <div className="text-red-400 text-sm font-medium flex items-center gap-1">
                      <ShieldAlert size={14} /> Report record unavailable
                    </div>
                  )}
                  
                  {run.reportBlobId && run.reportBlobId.includes('/') && (
                    <a 
                      href={`https://explorer.shelby.xyz/testnet/account/${run.reportBlobId.split('/')[0]}/blobs?name=${encodeURIComponent(run.reportBlobId.split('/').slice(1).join('/'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-white"
                      title="View on Shelby Explorer"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && runs.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => syncFromChain(true)}
            disabled={syncing}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors disabled:opacity-50 text-sm font-medium border border-slate-700"
          >
            {syncing ? 'Loading...' : 'Load More Records'}
          </button>
        </div>
      )}
      
      <div className="text-center text-xs text-slate-600 mt-8">
        Scanning latest {offset || PAGE_LIMIT} records for AI Reports from your wallet.
      </div>
    </div>
  );
}
