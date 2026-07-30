'use client';

import { useState } from 'react';
import { calculateFileHash } from '@/lib/hashing/sha256';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface VerificationComponentProps {
  expectedHash: string;
}

export const VerificationComponent = ({ expectedHash }: VerificationComponentProps) => {
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsVerifying(true);
    setError(null);
    setCalculatedHash(null);

    try {
      const hash = await calculateFileHash(selectedFile);
      setCalculatedHash(hash);
    } catch (err) {
      setError('Failed to calculate file hash.');
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const isMatch = calculatedHash === expectedHash;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <h3 className="text-xl font-semibold text-white">Local File Verification</h3>
      <p className="text-sm text-slate-400">
        Select a local file to verify its integrity against the on-chain SHA-256 hash. 
        Your file will not be uploaded anywhere; verification happens entirely in your browser.
      </p>

      <div className="space-y-4">
        <input 
          type="file" 
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-300
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-cyan-900/50 file:text-cyan-400
            hover:file:bg-cyan-900/70 cursor-pointer"
        />

        {isVerifying && (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">Calculating hash...</span>
          </div>
        )}

        {calculatedHash && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Expected Hash (On-chain):</span>
                <span className="font-mono text-slate-300 truncate w-1/2 text-right">{expectedHash}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Calculated Hash (Local):</span>
                <span className="font-mono text-slate-300 truncate w-1/2 text-right">{calculatedHash}</span>
              </div>
            </div>

            <div className={`p-4 rounded-md flex items-center gap-3 ${isMatch ? 'bg-green-900/20 text-green-400 border border-green-900/50' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
              {isMatch ? <CheckCircle size={24} /> : <XCircle size={24} />}
              <div>
                <p className="font-semibold">{isMatch ? 'Verified' : 'Invalid or modified file'}</p>
                <p className="text-sm opacity-80">
                  {isMatch 
                    ? 'The local file matches the evidence published on-chain.' 
                    : 'The local file does not match the original evidence.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
