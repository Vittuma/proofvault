'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PropsWithChildren } from 'react';

// Using Petra Wallet as default for this MVP
// Depending on how @aptos-labs/wallet-adapter-react works in the installed version,
// we might need to supply plugins or simply let it detect EIP-6963 compatible wallets.

export const WalletProvider = ({ children }: PropsWithChildren) => {
  return (
    <AptosWalletAdapterProvider autoConnect={true}>
      {children}
    </AptosWalletAdapterProvider>
  );
};
