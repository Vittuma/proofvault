## Project name
ProofVault

## One-line description
A verifiable file integrity and storage platform, using Shelby for high-speed storage and Aptos for publisher attribution and file-integrity commitments.

## Problem
In a digital world, verifying the authenticity of documents, media, and datasets is difficult. When sharing important files online, it is challenging to prove that the file was not altered after it was published.

## Solution
ProofVault stores files through Shelby and registers their publisher, timestamp, storage reference, and integrity hash on Aptos.

## Why Shelby
ProofVault requires:
- Fast file uploads
- Fast public retrieval
- High read volume
- Persistent datasets
- Support for CSV, JSON, images, text, and PDF
- A path from MVP usage to real production workloads

## Expected initial workload
- 10–20 initial organizations/users
- 20–50 GB initial storage
- CSV, JSON, PNG, JPG, TXT, and PDF
- 5,000–20,000 monthly retrievals
- Public verifiable document timelines
- Future machine-readable datasets for AI agents

## Current MVP
- Fully functioning Aptos Move smart contract deployed to Testnet.
- Browser-based file hashing (SHA-256) via Web Crypto API.
- Integrated official Shelby SDK for decentralized hot storage.
- Searchable on-chain evidence archive.
- Local verification tool comparing downloaded files to on-chain hashes.

## Roadmap
- Encrypted private files
- Team workspaces
- Dataset versioning
- Public API
- AI agent access
- Category-specific public feeds
- Document signing
- Reviewer attestations
