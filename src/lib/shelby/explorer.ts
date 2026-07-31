export const buildShelbyExplorerUrl = (accountAddress: string, blobName: string, network: string = 'testnet'): string => {
  const baseUrl = 'https://explorer.shelby.xyz';
  
  if (network === 'testnet') {
    return `${baseUrl}/testnet/account/${accountAddress}/blobs?name=${encodeURIComponent(blobName)}`;
  }

  // Assuming mainnet or others might have different paths
  return `${baseUrl}/account/${accountAddress}/blobs?name=${encodeURIComponent(blobName)}`;
};

export const buildShelbyDownloadUrl = (accountAddress: string, blobName: string, network: string = 'testnet'): string => {
  // Typical RPC download endpoint pattern: /v1/blobs/{account}/{blobName}
  // Let's assume the official testnet RPC url is https://testnet.shelby.io
  const rpcUrl = network === 'testnet' ? 'https://testnet.shelby.io' : 'https://mainnet.shelby.io';
  return `${rpcUrl}/v1/blobs/${accountAddress}/${encodeURIComponent(blobName)}`;
};
