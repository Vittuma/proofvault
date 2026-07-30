'use client';

import { useEffect, useState } from 'react';
import { getAllEvidence } from '@/lib/aptos/views';
import { EvidenceRecord } from '@/lib/aptos/types';
import { EvidenceCard } from '@/components/evidence/EvidenceCard';
import { Loader2, Search } from 'lucide-react';
import { MODULE_ADDRESS } from '@/lib/aptos/client';

export default function EvidenceArchive() {
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const data = await getAllEvidence(MODULE_ADDRESS);
        setRecords(data);
      } catch (err) {
        console.error('Failed to fetch evidence archive', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, []);

  const filteredRecords = records.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.project_or_topic.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase()) ||
    r.publisher.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Evidence Archive</h1>
          <p className="text-slate-400">Browse verified files, datasets, and digital records.</p>
        </div>
        
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by topic, title, category, or publisher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-cyan-500" size={32} />
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((evidence) => (
            <EvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
          <h3 className="text-lg font-medium text-slate-300 mb-2">No evidence found</h3>
          <p className="text-sm text-slate-500">
            {search ? 'Try adjusting your search terms.' : 'Be the first to upload verified documents.'}
          </p>
        </div>
      )}
    </div>
  );
}
