'use client';

import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { uploadToShelby } from '@/lib/shelby/upload';
import { calculateFileHash } from '@/lib/hashing/sha256';
import { buildRegisterEvidencePayload } from '@/lib/aptos/transactions';
import { MODULE_ADDRESS, aptosClient, isValidContractAddress } from '@/lib/aptos/client';
import { Loader2, UploadCloud, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    projectOrTopic: '',
    title: '',
    documentDate: '',
    category: 'Document',
    description: '',
    visibility: 0, // 0 public, 1 private
  });

  const [status, setStatus] = useState<'idle' | 'hashing' | 'uploading' | 'registering' | 'success' | 'error'>('idle');
  const [hash, setHash] = useState<string | null>(null);
  const [blobId, setBlobId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categories = [
    'Document', 'Dataset', 'Research', 
    'Legal Record', 'Media', 'Software Artifact', 
    'Certificate', 'Archive', 'Other'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      // Max size validation (25MB)
      if (selected.size > 26214400) {
        setErrorMessage('File size exceeds the 25MB limit.');
        return;
      }
      setFile(selected);
      setErrorMessage(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'visibility' ? parseInt(value, 10) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !connected || !account) {
      setErrorMessage('Please connect wallet and select a file.');
      return;
    }

    if (!isValidContractAddress(MODULE_ADDRESS)) {
      setErrorMessage('Contract chưa được deploy hoặc địa chỉ chưa được cấu hình đúng trong .env.local');
      return;
    }

    try {
      setErrorMessage(null);
      
      // Step 1: Hash
      setStatus('hashing');
      const fileHash = await calculateFileHash(file);
      setHash(fileHash);

      // Step 2: Upload to Shelby
      setStatus('uploading');
      let currentBlobId = blobId; // Recover from previous failed on-chain attempt
      
      if (!currentBlobId) {
        const uploadResult = await uploadToShelby(file);
        currentBlobId = uploadResult.blobId;
        setBlobId(currentBlobId);
      }

      // Step 3: Register on Aptos
      setStatus('registering');
      const payload = buildRegisterEvidencePayload(
        MODULE_ADDRESS,
        formData.category,
        formData.projectOrTopic,
        formData.title,
        formData.description,
        formData.documentDate,
        currentBlobId,
        file.name,
        file.type || 'application/octet-stream',
        file.size,
        fileHash,
        formData.visibility
      );

      const response = await signAndSubmitTransaction(payload);
      
      // Wait for confirmation
      await aptosClient.waitForTransaction({ transactionHash: response.hash });
      
      setTxHash(response.hash);
      setStatus('success');
      
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during the process.');
      setStatus('error');
    }
  };

  const handleRetryRegistration = async () => {
    // Allows user to skip upload if it already succeeded but TX failed
    setStatus('idle');
    await handleSubmit(new Event('submit') as unknown as React.FormEvent);
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <ShieldAlert size={48} className="text-cyan-500 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Wallet Connection Required</h2>
        <p className="text-slate-400 mb-8 text-center max-w-md">
          Please connect your Aptos wallet to upload and register evidence on ProofVault.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400 border border-green-500/30">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-4">Evidence Registered Successfully</h2>
        <p className="text-slate-400 mb-8">
          Your file has been uploaded to Shelby and the cryptographic proof has been recorded on Aptos.
        </p>
        
        <div className="bg-slate-900 rounded-lg p-4 text-left space-y-3 mb-8 border border-slate-800">
          <div>
            <span className="text-slate-500 text-sm block">Aptos Transaction Hash</span>
            <span className="text-cyan-400 font-mono text-sm break-all">{txHash}</span>
          </div>
          <div>
            <span className="text-slate-500 text-sm block">Shelby Blob ID</span>
            <span className="text-slate-300 font-mono text-sm break-all">{blobId}</span>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link href="/evidence" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors">
            View Archive
          </Link>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-700">
            Upload Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 w-full">
      <h1 className="text-3xl font-bold mb-2">Upload Evidence</h1>
      <p className="text-slate-400 mb-8">Store data on Shelby and verify it permanently on Aptos.</p>
      
      {!isValidContractAddress(MODULE_ADDRESS) && (
        <div className="mb-8 p-4 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 flex items-start gap-3">
          <ShieldAlert className="shrink-0 mt-0.5 text-red-400" size={20} />
          <div>
            <h3 className="font-semibold text-red-400">Cảnh báo: Contract chưa được cấu hình</h3>
            <p className="text-sm mt-1">
              Contract chưa được deploy hoặc địa chỉ chưa được cấu hình. Vui lòng deploy contract và cập nhật <code className="bg-black/30 px-1 py-0.5 rounded">NEXT_PUBLIC_CONTRACT_ADDRESS</code> trong file <code className="bg-black/30 px-1 py-0.5 rounded">.env.local</code>. (Hiện tại đang là {MODULE_ADDRESS})
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6 bg-slate-900 p-6 rounded-xl border border-slate-800">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Project / Topic *</label>
            <input 
              type="text" 
              name="projectOrTopic"
              required 
              maxLength={50}
              placeholder="e.g. Project Apollo, Quantum Computing"
              value={formData.projectOrTopic}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
            <input 
              type="text" 
              name="title"
              required 
              maxLength={100}
              placeholder="Descriptive title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Document Date</label>
            <input 
              type="date" 
              name="documentDate"
              value={formData.documentDate}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <select 
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-cyan-500"
            >
              {categories.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Visibility</label>
            <select 
              name="visibility"
              value={formData.visibility}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value={0}>Public</option>
              <option value={1} disabled>Private (Coming soon)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea 
              name="description"
              rows={4}
              maxLength={1000}
              placeholder="Context or summary of the evidence..."
              value={formData.description}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center border-dashed text-center min-h-[200px]">
            <UploadCloud size={48} className="text-cyan-500 mb-4" />
            <input 
              type="file" 
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors border border-slate-700 mb-2 inline-block">
                Choose File
              </span>
            </label>
            {file ? (
              <div className="mt-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{file.name}</p>
                <p>{(file.size / 1024).toFixed(2)} KB • {file.type || 'Unknown type'}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-2">Max file size: 25MB. CSV, JSON, PNG, TXT, PDF.</p>
            )}
          </div>

          {status !== 'idle' && status !== 'error' && (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
              <h3 className="font-semibold">Processing...</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className={status === 'hashing' ? 'text-cyan-400 font-medium' : 'text-slate-400'}>1. Calculating hash</span>
                  {status !== 'hashing' && <CheckCircle2 size={16} className="text-green-500" />}
                  {status === 'hashing' && <Loader2 size={16} className="animate-spin text-cyan-500" />}
                </div>
                {hash && <div className="pl-4 text-xs font-mono text-slate-500 truncate">{hash}</div>}
                
                <div className="flex items-center justify-between">
                  <span className={status === 'uploading' ? 'text-cyan-400 font-medium' : 'text-slate-400'}>
                    2. {process.env.NEXT_PUBLIC_SHELBY_API_KEY ? 'Uploading to Shelby' : 'Saving to Local Development Storage'}
                  </span>
                  {status === 'registering' && <CheckCircle2 size={16} className="text-green-500" />}
                  {status === 'uploading' && <Loader2 size={16} className="animate-spin text-cyan-500" />}
                </div>
                {blobId && <div className="pl-4 text-xs font-mono text-slate-500 truncate">{blobId}</div>}
                
                <div className="flex items-center justify-between">
                  <span className={status === 'registering' ? 'text-cyan-400 font-medium' : 'text-slate-400'}>3. Registering on Aptos</span>
                  {/* status === 'success' is never reached here due to early return */}
                  {status === 'registering' && <Loader2 size={16} className="animate-spin text-cyan-500" />}
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
              <p className="font-semibold mb-1">Error</p>
              <p>{errorMessage}</p>
              {blobId && (
                <button 
                  type="button"
                  onClick={handleRetryRegistration}
                  className="mt-3 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 rounded text-xs transition-colors border border-red-800/50"
                >
                  Retry On-Chain Registration
                </button>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={status !== 'idle' && status !== 'error' || !file || !isValidContractAddress(MODULE_ADDRESS)}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors shadow-lg"
          >
            Submit Evidence
          </button>
        </div>
      </form>
    </div>
  );
}
