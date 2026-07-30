import Link from 'next/link';
import { EvidenceRecord } from '@/lib/aptos/types';
import { ShieldCheck, FileText, Calendar, Wallet } from 'lucide-react';

interface EvidenceCardProps {
  evidence: EvidenceRecord;
}

export const EvidenceCard = ({ evidence }: EvidenceCardProps) => {
  const shortAddress = `${evidence.publisher.substring(0, 6)}...${evidence.publisher.substring(evidence.publisher.length - 4)}`;
  const dateStr = new Date(parseInt(evidence.created_at) * 1000).toLocaleDateString();

  return (
    <Link href={`/evidence/${evidence.id}`}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-500/50 transition-colors group cursor-pointer h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-cyan-900/30 text-cyan-400 text-xs font-semibold rounded-md uppercase tracking-wider">
              {evidence.category}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-md">
              {evidence.project_or_topic}
            </span>
          </div>
          <div className="flex items-center gap-1 text-green-400">
            <ShieldCheck size={16} />
            <span className="text-xs font-medium">Verified Hash</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
          {evidence.title}
        </h3>
        
        <p className="text-sm text-slate-400 mb-6 line-clamp-2 flex-1">
          {evidence.description}
        </p>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-400 mt-auto pt-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-slate-500" />
            <span className="truncate">{shortAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-500" />
            <span>Doc: {evidence.document_date || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-slate-500" />
            <span className="uppercase">{evidence.mime_type.split('/')[1] || 'FILE'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-500" />
            <span>Pub: {dateStr}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
