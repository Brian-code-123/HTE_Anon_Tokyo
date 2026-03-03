# Real-World Production Integration Guide

This document outlines the architectural path to transition the **Origraph Provenance Registry** from its localized, development-friendly SQLite baseline into a robust, high-volume production LLM generation pipeline.

---

## 1. Architecture: Demo vs. Production

### Current Architecture (Demo)
- **Database:** SQLite (local `provenance.db`) managing companies, watermarked responses, and a simulated hash-chain (`chain_blocks` table).
- **LLM Pipeline:** Synchronous, blocking calls to external LLM providers (MiniMax, AWS Bedrock).
- **Watermarking:** Applied post-generation to the entire bulk text payload.
- **Key Management:** Ephemeral ECDSA keys generated on the backend and sent to the frontend UI *once* for demonstrative local signing.
- **Ledger:** Simulated SQLite backend imitating an immutable ordered ledger.

### Target Architecture (Production)
- **Database:** PostgreSQL for high-concurrency relational data storage (`responses`, `companies`).
- **LLM Pipeline:** Asynchronous proxy server with streaming chunk manipulation (e.g., streaming FastAPI/vLLM integration).
- **Key Management:** Cloud HSM / AWS KMS or Bring-Your-Own-Wallet (MetaMask/WalletConnect) for signing, ensuring private keys never touch the web backend or localStorage.
- **Ledger:** EVM-compatible Blockchain, specifically **QDay Network** (or any L2/L3) using `web3.py`.
- **Caching/Queue:** Redis + Celery (or Kafka) to batch anchor transactions and reduce gas costs/on-chain congestion.

---

## 2. Transitioning the Database (SQLite -> PostgreSQL)

The current `registry/db.py` relies solely on `sqlite3`. To handle multiple concurrent LLM proxy requests, a real connection pool is necessary.

**Recommended Steps:**
1. Introduce an ORM like **SQLAlchemy** or use **asyncpg**.
2. Migrate the `responses` and `companies` tables to Postgres.
3. Drop the `chain_blocks` table completely; the blockchain handles that state. You only need to store the `tx_hash` of the on-chain anchor attempt mapped to the `response_id`.

```python
# Conceptual SQLAlchemy Model
class ResponseRecord(Base):
    __tablename__ = 'responses'
    id = Column(Integer, primary_key=True)
    sha256_hash = Column(String(64), index=True)
    issuer_id = Column(Integer, ForeignKey('companies.issuer_id'))
    watermarked_text = Column(Text)
    on_chain_tx_hash = Column(String(66), nullable=True) # Replaces local chain_blocks link
```

---

## 3. Blockchain Integration (Replacing the Simulated Hash-Chain)

The `SimulatedChain` class in `registry/chain.py` mocks distributed ledger technology. In production, Origraph's proofs must be anchored to a public or permissioned EVM network (like QDay or a Scaffold-ETH managed rollup).

### Smart Contract Target
You will need a registry contract deployed on-chain, e.g., `ProvenanceRegistry.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProvenanceRegistry {
    event Anchored(bytes32 indexed dataHash, uint256 indexed issuerId, address signer);

    function anchor(bytes32 dataHash, uint256 issuerId, bytes memory signature) public {
        // ecrecover logic to verify signature matches the registered issuer
        emit Anchored(dataHash, issuerId, msg.sender);
    }
}
```

### Python/FastAPI Web3 Hook
Rewrite `origraph-registry-demo/registry/chain.py` to use `web3.py`. For high throughput, do not submit a transaction for every single generation. Instead, use a **Merkle Tree roll-up** or queue system:

```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider(QDAY_RPC_URL))
contract = w3.eth.contract(address=REGISTRY_CONTRACT_ADDRESS, abi=ABI)

def anchor_to_qday(data_hash_hex: str, issuer_id: int, signature_hex: str):
    """Submits the payload signature directly to the EVM network."""
    account = w3.eth.account.from_key(HOT_WALLET_PRIVATE_KEY)
    
    # Build transaction submitting the user's data hash and signature
    tx = contract.functions.anchor(
        Web3.toBytes(hexstr=data_hash_hex), 
        issuer_id, 
        Web3.toBytes(hexstr=signature_hex)
    ).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': w3.eth.gas_price
    })
    
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return tx_hash.hex()
```

---

## 4. Securing Key Management

In the demo, `registry/auth.py` creates a private key and sends it to the frontend via `/api/registry/companies/demo`. **This is fundamentally insecure for production.**

### Option A: Server-Side HSM (Enterprise API)
If Origraph acts as an API proxy (like Helicone or Langfuse):
1. The backend holds a KMS (Key Management Service) key for the specific Company API token.
2. The user requests a generation.
3. The server generates, watermarks, and uses AWS KMS to sign the `SHA-256` payload without ever exposing the private key to application memory.

### Option B: Client-Side Web3 Wallet (DApp)
If Origraph operates as a consumer web interface:
1. Users connect via MetaMask (`window.ethereum`).
2. The UI requests generation from the backend, receiving the raw watermark payload back.
3. The user's MetaMask prompts them to sign the `EIP-712` message of the payload.
4. The frontend submits the hash and the signature to the blockchain directly, bypassing the backend API entirely for the anchoring phase.

---

## 5. High-Volume LLM Streaming Pipeline

For production, users expect low latency and streaming (`text/event-stream`). The `invisible-text-watermark` library must be adapted to work over streaming chunks rather than waiting for the entire document to finalize.

**Streaming Hook implementation:**
1. Yield raw text chunks back to the client immediately (for fast TTFB).
2. Buffer the chunks in a background thread or cache (Redis).
3. Once the stream completes, apply the zero-width invisible text watermark payload strictly to the termination chunk or specific boundaries.
4. Issue an asynchronous job (via Celery or FastAPI `BackgroundTasks`) to anchor the completed response to the EVM chain without blocking the user's web request.

```python
from fastapi import BackgroundTasks

@app.post("/v1/chat/completions")
async def proxy_generation(request: Request, bg_tasks: BackgroundTasks):
    
    # ... Stream response to user from OpenAI / Bedrock ...
    full_text = await stream_and_collect(request)
    
    # Add watermark to the final aggregate
    watermarked_text, payload_hash = apply_watermark(full_text)
    
    # Queue for on-chain anchoring AFTER returning the response
    bg_tasks.add_task(anchor_to_qday_async, payload_hash, company_id)
    
    return {"text": watermarked_text, "status": "anchoring_queued"}
```

---

## 6. Verification Pipeline at Scale

If a document (like a PDF or web snippet) is suspected of being AI-generated:
1. The Origraph browser extension parses the hidden zero-width watermark ID.
2. The client queries the Postgres database for the payload contents corresponding to that ID.
3. The DB returns the original `tx_hash` from the QDay blockchain.
4. The client independently queries the QDay RPC node directly to verify that `tx_hash` exists, and that the signature matches the registered company's `eth_address`—creating a trustless, cryptographically verifiable loop.

---

## Summary of Milestones to Production
1. **[Infrastructure]** Replace SQLite with PostgreSQL/asyncpg.
2. **[Blockchain]** Replace `chain.py` with `web3.py`; write a Solidity contract.
3. **[Security]** Remove private key generation from API; implement KMS or Web3 Provider signing.
4. **[Performance]** Transition synchronous generations to Server-Sent Events (SSE) with background anchoring tasks.
5. **[Economics]** Implement batched Merkle-tree anchoring to reduce L1/L2 gas fees drastically.