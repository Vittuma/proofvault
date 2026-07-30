# Technical Notes

## Environment Stack
- **Node.js**: v24.16.0
- **pnpm**: v11.18.0
- **Next.js**: 16.2.12
- **React**: 19.2.4

## SDKs
- **Aptos SDK (`@aptos-labs/ts-sdk`)**: 7.2.0
- **Aptos Wallet Adapter (`@aptos-labs/wallet-adapter-react`)**: 8.3.3
- **Shelby SDK (`@shelby-protocol/sdk`)**: 0.3.1

## Aptos Move
- **Move Framework**: `aptos-framework` / `aptos-stdlib` mainnet branch
- **Transaction APIs**: Build payload dynamically using `signAndSubmitTransaction`
- **View APIs**: Use `aptosClient.view()` to retrieve struct contents directly

## Shelby
- **Network Identifiers**: `testnet`
- **APIs Used**: `ShelbyNodeClient.upload` and `ShelbyNodeClient.download`
- **Known SDK Limitations**: 
  - If `@shelby-protocol/sdk/node` or `@shelby-protocol/sdk/browser` behaves differently from our assumptions, the codebase implements a generic fallback adapter (`upload.ts`, `download.ts`) that mimics the promise delays and returns normalized objects.
  - The API key approach relies on `NEXT_PUBLIC_SHELBY_API_KEY`, which is only for testing in this MVP. For production, the backend API should mint single-use tokens or proxy the uploads if the SDK does not support browser-safe scopes natively.

## Divergence from specification
- A local adapter is included and executes smoothly if `process.env.NEXT_PUBLIC_STORAGE_ADAPTER_MODE` is not configured or Shelby SDK fails to import securely on the browser. The frontend gracefully falls back to a simulated delay matching the interface (`StorageUploadResult`).

## Manual Steps Required
1. Configure Petra wallet or another Aptos-compatible wallet extension.
2. Publish the Move smart contract to Aptos Testnet:
   ```bash
   cd contracts/proof_vault
   aptos move publish --named-addresses proof_vault=<YOUR_PUBLISHER_ADDRESS>
   ```
3. Initialize the registry:
   ```bash
   aptos move run --function-id <YOUR_PUBLISHER_ADDRESS>::registry::initialize
   ```
4. Copy the address into `.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS`.
