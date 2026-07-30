export default function About() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">About ProofVault</h1>
        <p className="text-xl text-slate-400">
          A verifiable file integrity and storage platform.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-cyan-400">The Problem</h2>
        <p className="text-slate-300 leading-relaxed">
          In a digital world, verifying the authenticity of documents, media, and datasets is difficult. When sharing important files online, it is challenging to prove that the file was not altered, tampered with, or secretly replaced after it was published. Traditional storage systems do not natively provide irrefutable proofs of integrity.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-cyan-400">The Solution</h2>
        <p className="text-slate-300 leading-relaxed">
          ProofVault stores files using Shelby for high-speed, decentralized storage, and registers their publisher, timestamp, storage reference, and integrity hash (SHA-256) on the Aptos blockchain. This creates an irrefutable timeline and cryptographic proof of existence for any file.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="space-y-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-2xl font-semibold text-cyan-400">Why Shelby?</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            <li>Fast file uploads and public retrieval</li>
            <li>Optimized for &quot;hot&quot; storage and high read volume</li>
            <li>Persistent datasets for AI research agents</li>
            <li>Direct support for modern Web3 workloads</li>
          </ul>
        </section>

        <section className="space-y-4 bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-2xl font-semibold text-cyan-400">Why Aptos?</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2">
            <li>Sub-second finality for evidence registration</li>
            <li>Low transaction fees</li>
            <li>Secure Move smart contracts</li>
            <li>Native integration with Shelby micropayments</li>
          </ul>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-cyan-400">How File Verification Works</h2>
        <p className="text-slate-300 leading-relaxed">
          When you upload a file, your browser calculates a SHA-256 hash of its contents locally. This hash is sent to the Aptos smart contract and permanently recorded. When someone downloads your file, they can use our Verification tool to select the downloaded file, recalculate its hash in their browser, and compare it against the on-chain record to ensure 100% integrity.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-cyan-400">Roadmap</h2>
        <ul className="list-disc list-inside text-slate-300 space-y-2">
          <li>Encrypted private files (Coming soon)</li>
          <li>Team workspaces</li>
          <li>Dataset versioning</li>
          <li>Public API for enterprise integrations</li>
          <li>Category-specific public feeds</li>
        </ul>
      </section>
    </div>
  );
}
