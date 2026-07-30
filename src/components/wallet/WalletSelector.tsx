'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState } from 'react';

export const WalletSelector = () => {
  const { connected, account, connect, disconnect, wallets } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  // Filter out wallets that are not installed (optional, based on preference)
  // For MVP we just use the first available wallet (e.g. Petra)
  
  if (connected && account) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-cyan-400">
          {account.address.toString().substring(0, 6)}...{account.address.toString().substring(account.address.toString().length - 4)}
        </span>
        <button 
          onClick={() => disconnect()}
          className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-md transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
      >
        Connect Wallet
      </button>

      {isOpen && wallets && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-md shadow-xl overflow-hidden z-50">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => {
                connect(wallet.name);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 text-white text-sm transition-colors flex items-center justify-between"
            >
              {wallet.name}
              {wallet.readyState === 'Installed' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
