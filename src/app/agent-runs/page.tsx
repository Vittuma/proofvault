'use client';

import { useEffect, useState } from 'react';
import { getTotalEvidenceCount, getEvidenceById } from '@/lib/aptos/views';
import { EvidenceRecord } from '@/lib/aptos/types';
import { MODULE_ADDRESS } from '@/lib/aptos/client';
import { Loader2, Bot, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AgentRunsPage() {
  const [runs, setRuns] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const count = await getTotalEvidenceCount(MODULE_ADDRESS);
        const results: EvidenceRecord[] = [];
        
        for (let i = count; i > 0; i--) {
          try {
            const ev = await getEvidenceById(MODULE_ADDRESS, i);
            // In MVP, we identify AI reports by title or category
            if (ev && (ev.title.startsWith('AI Report:') || ev.category.includes('AI Report'))) {
              results.push(ev);
            }
          } catch (e) {
            console.error(`Failed to fetch evidence \${i}`, e);
          }
        }
        setRuns(results);
      } catch (err: unknown) {
        const error = err as Error;
        console.error(error);
        setError('Failed to fetch agent runs.');
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Bot className="text-indigo-500" size={32} />
          Agent Runs
        </h1>
        <p className="text-slate-400 mt-2">
          History of all verified AI audits. Reports are stored on Shelby and anchored on Aptos.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : error ? (
        <div className="text-red-400 p-4 bg-red-500/10 rounded-lg">{error}</div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
          No agent runs found. Go to any evidence document and click &quot;Analyze with AI&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {runs.map(run => {
            const dateStr = new Date(parseInt(run.created_at) * 1000).toLocaleString();
            return (
              <div key={run.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-semibold px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-full uppercase tracking-wider">
                      Completed
                    </span>
                    <span className="text-xs text-slate-500 font-mono">#{run.id}</span>
                  </div>
                  <h3 className="text-white font-medium text-lg mb-2 line-clamp-2">{run.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3 mb-4">{run.description}</p>
                  <div className="text-xs text-slate-500 mb-4">
                    Run Date: {dateStr}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <Link 
                    href={`/evidence/\${run.id}`}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
                  >
                    View Record <ArrowRight size={14} />
                  </Link>
                  
                  {run.blob_identifier.includes('/') && (
                    <a 
                      href={`https://explorer.shelby.xyz/testnet/account/\${run.blob_identifier.split('/')[0]}/blobs?name=\${encodeURIComponent(run.blob_identifier.split('/').slice(1).join('/'))}`}
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
    </div>
  );
}
