# Technical Notes

## Version Dependencies

- **Shelby SDK**: `0.3.0` (simulated local or testnet mode)
- **Aptos SDK**: `@aptos-labs/ts-sdk` latest
- **Aptos Wallet Adapter**: `@aptos-labs/wallet-adapter-react` latest
- **OpenAI SDK**: `openai` latest
- **Next.js**: `16.2.x` (App Router)
- **Node**: `>= 20.x`
- **pnpm**: `>= 9.x`

## Exact Upload & Download APIs

- **Upload**: `upload(file: File)` in `src/lib/shelby/upload.ts`. Handles multipart boundaries internally or local fallback.
- **Download**: `downloadFromShelby(accountAddress: string, blobName: string)` in `src/lib/shelby/download.ts`. Handles fetching from `explorer.shelby.xyz/api/v1/blobs/download` or local simulation.

## Wallet Signing Flow

- Every transaction, whether for blob storage logic or Aptos registration, requires explicit wallet signature.
- The `ProofVault` Aptos smart contract registers metadata: `title`, `description`, `projectOrTopic`, `originalFileName`, `mimeType`, `blobIdentifier`, `fileSize`, `sha256HashHex`.
- No private keys or seed phrases are ever handled by the application.

## Event Extraction & Pagination

- Aptos provides a way to read `getAllEvidencePaginated`.
- The current implementation reads backwards from the latest ID in batches of 50 since the contract does not yet maintain a dedicated per-publisher index.
- Future upgrades to the Move contract should add an event stream or a `Table<address, vector<u64>>` for `publisher -> evidence_ids`.

## Citation Verification Logic

- The AI returns structured citations containing `fileName` and `excerpt`.
- The server loops through each citation, normalizing whitespace and punctuation.
- It verifies if the `excerpt` exists in the exact source text extracted from the document.
- Paraphrased or hallucinated citations are strictly removed before returning to the frontend.

## Binary & Corrupt File Detection

- To save AI costs and prevent processing errors, the server checks the MIME type and the raw text for null bytes, control character ratios, and UTF-8 replacement characters (`\uFFFD`).
- If a file is deemed binary or corrupt, the AI call is bypassed and an error is presented.

## Failure Recovery

- Agent runs are built resiliently. If the Aptos `register_evidence` transaction completes but the Shelby upload for the JSON manifest fails, the state is cached locally as `manifest_pending`.
- Users can click "Retry Manifest Upload" to re-attempt the network request without signing another Aptos transaction or paying double gas fees.

## Known Limitations

- **Shelby Explorer**: The Shelby explorer is in Beta. Links might occasionally fail to render or blobs might take time to propagate.
- **Railway Environment**: Railway builds frontend static assets at build time. Changing `NEXT_PUBLIC_` variables requires a full redeploy to regenerate the build.
- **Document Parsing**: Image OCR and complex PDF layouts are currently not supported natively.
