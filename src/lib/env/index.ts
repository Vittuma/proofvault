export const env = {
  NEXT_PUBLIC_APTOS_NETWORK: process.env.NEXT_PUBLIC_APTOS_NETWORK || 'testnet',
  NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  NEXT_PUBLIC_SHELBY_NETWORK: process.env.NEXT_PUBLIC_SHELBY_NETWORK || 'testnet',
  NEXT_PUBLIC_SHELBY_API_KEY: process.env.NEXT_PUBLIC_SHELBY_API_KEY,
  NEXT_PUBLIC_MAX_UPLOAD_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE || '26214400', 10), // 25MB Default
  NEXT_PUBLIC_STORAGE_ADAPTER_MODE: process.env.NEXT_PUBLIC_STORAGE_ADAPTER_MODE || 'shelby', // 'shelby' or 'local'
};

export const validateEnv = () => {
  const missing = [];
  if (env.NEXT_PUBLIC_STORAGE_ADAPTER_MODE === 'shelby' && !env.NEXT_PUBLIC_SHELBY_API_KEY) {
    missing.push('NEXT_PUBLIC_SHELBY_API_KEY');
  }
  if (!env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
    // missing.push('NEXT_PUBLIC_CONTRACT_ADDRESS'); // Optional during initial build before deployment
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
