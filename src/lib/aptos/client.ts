import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const getNetwork = (): Network => {
  const envNetwork = process.env.NEXT_PUBLIC_APTOS_NETWORK?.toLowerCase();
  switch (envNetwork) {
    case 'mainnet':
      return Network.MAINNET;
    case 'devnet':
      return Network.DEVNET;
    case 'local':
      return Network.LOCAL;
    case 'testnet':
    default:
      return Network.TESTNET;
  }
};

const config = new AptosConfig({ network: getNetwork() });
export const aptosClient = new Aptos(config);

export const MODULE_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x123'; // Replace with deployed address later
export const MODULE_NAME = 'registry';

export const isValidContractAddress = (address: string): boolean => {
  if (!address || address === '0x123') return false;
  return /^0x[a-fA-F0-9]{1,64}$/.test(address);
};

export const checkWalletBalances = async (accountAddress: string) => {
  try {
    const aptBalance = await aptosClient.getAccountCoinAmount({
      accountAddress,
      coinType: '0x1::aptos_coin::AptosCoin',
    });

    // Import dynamically or we can just fetch all coins data
    let shelbyUsdBalance = 0;
    try {
      const { SHELBYUSD_FA_METADATA_ADDRESS } = await import('@shelby-protocol/sdk/browser');
      const coins = await aptosClient.getAccountCoinsData({ accountAddress });
      const shelbyCoin = coins.find(c => c.asset_type === SHELBYUSD_FA_METADATA_ADDRESS);
      if (shelbyCoin) {
        shelbyUsdBalance = shelbyCoin.amount;
      }
    } catch (e) {
      console.warn('Could not fetch ShelbyUSD balance', e);
    }

    return {
      apt: aptBalance,
      shelbyUsd: shelbyUsdBalance
    };
  } catch (error) {
    console.error('Error checking wallet balances:', error);
    return { apt: 0, shelbyUsd: 0 };
  }
};
