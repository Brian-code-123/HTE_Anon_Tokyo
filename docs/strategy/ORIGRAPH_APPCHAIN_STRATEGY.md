# Origraph AppChain Strategy: Layer 2 Infrastructure for Verifiable AI

This document outlines the strategic and technical roadmap for launching the **Origraph AppChain**, transitioning the project from a localized database wrapper into foundational, decentralized Web3 infrastructure for AI provenance.

## 1. Executive Summary: Why an AppChain?

A global provenance ledger for AI generation requires massive transaction throughput. Generalized networks (Ethereum Mainnet) or even general-purpose L2s (Arbitrum, Base) cannot economically support the volume of AI outputs generated daily. 

By launching an **Application-Specific Rollup (AppChain)**, Origraph achieves:
- **Hyper-Scalability:** Dedicated blockspace exclusively for AI provenance hashing and signature verification.
- **Micro-Cent Gas Fees:** Utilizing alternative Data Availability (DA) layers drops transaction costs to fractions of a cent, making per-generation anchoring economically viable.
- **Gas Abstraction:** Enterprises and LLM providers should not need to hold ETH to anchor data. Native Account Abstraction (ERC-4337) allows them to pay for throughput via fiat API subscriptions or a native token.
- **Custom Cryptography:** Ability to implement custom EVM precompiles tailored for AI watermarking schemes, zero-knowledge proofs, or specific hashing algorithms natively at the node level.

---

## 2. Technical Stack & Architecture

To avoid bootstrapping the economic security of a brand new Layer 1 from scratch, the Origraph AppChain will be built as an **EVM-Compatible Layer 2/Layer 3 Rollup**.

### The Modular Stack
1. **Execution Layer (Rollup Framework):** **OP Stack** (Optimism) or **Arbitrum Orbit**. Both allow rapid deployment of highly customizable, EVM-equivalent chains.
2. **Data Availability (DA) Layer:** **Celestia** or **EigenDA**. AI metadata (who generated what, timestamp, model ID, prompt hash) is data-heavy. Offloading this from Ethereum to Celestia reduces operational costs by up to 99%.
3. **Settlement Layer:** **Ethereum Mainnet**. State roots and fraud proofs will settle on Ethereum, inheriting its trillions in crypto-economic security.
4. **Rollup-as-a-Service (RaaS):** Deploying via infrastructure providers like **Caldera**, **Conduit**, or **Gelato** allows you to launch the production sequencer network without maintaining complex base-layer devops.

---

## 3. Tokenomics & The $ORI Economy

An AppChain provides the canvas for a native token to align incentives across the network ecosystem.

### Utility of the Native Token ($ORI)
- **Gas / Bandwidth:** Enterprises and AI proxy providers must burn or spend $ORI to write volume to the chain.
- **Staking & Security:** AI providers stake $ORI to operate trusted "Issuer" nodes. If they are caught signing fraudulent deepfakes or spamming the chain, their stake is mathematically slashed via smart contract.
- **DePIN Verification Economics (Verify-to-Earn):** The Origraph Browser Extension transforms everyday users into lightweight verification nodes. When a user's browser automatically detects, verifies, and reports an anchored AI watermark from the web, they earn micro-rewards in $ORI.
- **Governance:** Parameter adjustments, such as updating accepted LLM models, integrating new watermark algorithms, or changing slashing conditions, are governed by token holders.

---

## 4. Smart Contract Core Ecosystem

The transition from the current SQLite `db.py` to an AppChain requires migrating logic into Solidity smart contracts on the roll-up:

1. **`Registry.sol`**: The core ledger. Accepts a `(bytes32 dataHash, uint256 issuerId, bytes signature)` and emits verifiable logs.
2. **`IdentityProvider.sol`**: Manages the public keys (`eth_address`) of authorized LLM companies (OpenAI, MiniMax, Anthropic). Handles the staking/slashing mechanics.
3. **`Paymaster.sol`**: ERC-4337 Paymaster that abstracts gas fees, allowing AI models to anchor signatures without actively managing crypto wallets or holding native gas tokens.

---

## 5. Execution Roadmap

### Phase 1: Testnet Validation (Current)
- Stop using SQLite for `chain_blocks`.
- Deploy `Registry.sol` to **Base Sepolia** or **OP Sepolia** (public testnets).
- Update the FastAPI backend (`web3.py`) to sign and broadcast EVM transactions to the testnet.

### Phase 2: Local OP Stack Devnet
- Spin up a local OP Stack sequencer (replaces the local SQLite mock chain entirely).
- Prove that the Origraph backend can rapidly sequence 10,000+ localized chain hashes per minute with zero gas constraints using a custom rollup.

### Phase 3: RaaS Public Testnet
- Partner with Caldera or Conduit to click-to-deploy the **Origraph Testnet**.
- Integrate a Celestia DA layer.
- Open the test API for public builders and hackathons. Provide an RPC endpoint: `https://testnet-rpc.origraph.network`.
- Launch the browser extension configured to read from the testnet RPC.

### Phase 4: Mainnet Launch & TGE
- Complete smart contract audits.
- Token Generation Event (TGE) for $ORI.
- Launch the production AppChain.
- Onboard first enterprise AI proxy partners to run localized sequencer endpoints directly within their generation pipelines.