# ProofVault: Verifiable AI Auditor & File Storage

ProofVault gives AI agents verifiable memory by storing every source file, report, and execution manifest on Shelby and committing their integrity hashes on Aptos.

ProofVault is not just an upload demo. It is a fully functional verifiable storage and AI audit platform. By combining Shelby's decentralized storage network with the Aptos blockchain, we provide a robust ecosystem where both raw data and AI-generated insights are permanently anchored and verifiable.

## Use Cases

- **Document Audit**: Automatically review contracts and financial statements with AI, while maintaining a mathematically verifiable trail of the original documents.
- **Research Review**: Summarize extensive datasets and research papers with AI findings that are citation-verified against the exact source text.
- **Release Artifacts**: Store software releases or public datasets and attach AI compliance audits.
- **Compliance Evidence**: Maintain untamperable records of compliance documents along with AI-generated consistency checks.
- **AI Agent Memory**: Provide AI agents with a verifiable, untamperable memory layer.
- **Machine-Readable Archives**: Expose structured JSON reports and execution manifests for automated downstream consumption.

## Why Shelby + Aptos?

- **Shelby** serves as the storage and verifiable memory layer. Original source files, AI structured reports (`audit-report.json`), and execution histories (`agent-run-manifest.json`) are all stored on Shelby.
- **Aptos** provides the immutable registry. Every file on Shelby is anchored on Aptos with its SHA-256 hash, publisher, and timestamp. Agent histories can be fully recovered from the Shelby + Aptos combination without relying on centralized databases.

## AI Citation Verification & Hallucination Prevention

A core feature of ProofVault is its defense against AI hallucinations:
- All AI findings are returned as structured data and validated against a strict JSON schema.
- Every citation is verified against the exact extracted source text. 
- Unsupported citations are stripped out. Any finding that loses all of its citations is also removed.
- This creates a high-trust environment where AI-generated reports are grounded in reality.

## Real Workload

ProofVault exercises a real, intensive workload across the stack:
- Source uploads and Aptos registrations.
- Report uploads and manifest uploads to Shelby.
- Downloads, text extractions, and SHA-256 re-verifications.
- Chain synchronization and cache recovery.
