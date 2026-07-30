import Link from "next/link";
import { ArrowRight, ShieldCheck, UploadCloud, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 flex-1">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Store important files on <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            Shelby
          </span>
           {" "}and verify their integrity on Aptos.
        </h1>
        
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload documents, datasets, media, and digital records to decentralized storage. Register their integrity hashes on Aptos so anyone can verify that the original files have not been altered.
        </p>

        <div className="flex justify-center gap-4 pt-8">
          <Link 
            href="/upload"
            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center gap-2"
          >
            Upload Evidence <ArrowRight size={20} />
          </Link>
          <Link 
            href="/evidence"
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all border border-slate-700"
          >
            Browse Archive
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center text-blue-400">
            <UploadCloud size={24} />
          </div>
          <h3 className="text-xl font-semibold">1. Upload to Shelby</h3>
          <p className="text-slate-400">
            Your files are stored on Shelby&apos;s high-speed decentralized storage network, ensuring fast retrieval.
          </p>
        </div>
        
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="w-12 h-12 bg-cyan-900/50 rounded-lg flex items-center justify-center text-cyan-400">
            <Database size={24} />
          </div>
          <h3 className="text-xl font-semibold">2. Register on Aptos</h3>
          <p className="text-slate-400">
            A SHA-256 hash of your file and its metadata is permanently recorded on the Aptos blockchain, linked to your wallet.
          </p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center text-green-400">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-xl font-semibold">3. Verify Integrity</h3>
          <p className="text-slate-400">
            Anyone can download the original file and verify it against the on-chain hash to prove it was never modified.
          </p>
        </div>
      </div>
    </div>
  );
}
