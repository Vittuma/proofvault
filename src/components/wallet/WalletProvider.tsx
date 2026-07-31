'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Using Petra Wallet as default for this MVP
// Depending on how @aptos-labs/wallet-adapter-react works in the installed version,
// we might need to supply plugins or simply let it detect EIP-6963 compatible wallets.

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <AptosWalletAdapterProvider autoConnect={true}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AptosWalletAdapterProvider>
  );
};
