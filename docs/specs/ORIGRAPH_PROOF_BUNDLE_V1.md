# Origraph Proof Bundle v1

Status: Draft (implementation-targeted)

This document defines the portable proof format required for decentralized verification of Origraph watermarked text.

## 1. Goal

A verifier (browser extension, CLI, backend, or third party) should be able to verify provenance with only:

1. The candidate text.
2. A proof bundle (`origraph-proof-bundle/v1`).
3. Optional chain RPC access.

No trust in Origraph backend is required for cryptographic checks.

## 2. Canonical Bundle Format

Top-level object:

- `bundle_id` string, deterministic id: `opb1_<sha256(canonical_json_without_bundle_id)>`
- `spec` string, exactly `origraph-proof-bundle/v1`
- `hashing` object
- `issuer` object
- `signature` object
- `watermark` object
- `anchors` array (at least one)
- `verification_hints` object

### 2.1 `hashing`

- `algorithm`: `sha256`
- `text_hash`: lowercase 64-char hex, no `0x`
- `input_encoding`: `utf-8`
- `normalization`: `none` (exact bytes of the delivered text)

### 2.2 `issuer`

- `issuer_id`: integer
- `name`: string
- `eth_address`: checksummed address (or lowercase accepted)
- `public_key_hex`: secp256k1 public key hex when available

### 2.3 `signature`

- `scheme`: `eip191_personal_sign`
- `signed_payload`: `sha256:<text_hash>`
- `signature_hex`: 65-byte signature hex, `0x`-prefixed
- `recoverable_address`: boolean (must be true)

Signing rule (MUST):

- Sign the ASCII string equal to `<text_hash>` using Ethereum personal_sign / EIP-191 defunct message.
- This matches current server-side `encode_defunct(text=data_hash_hex)` behavior.

### 2.4 `watermark`

- `detected`: boolean
- `tag_count`: integer
- `payloads`: array of decoded watermark payload objects

### 2.5 `anchors`

Each anchor record includes:

- `type`: `simulated_chain` (current demo) or `evm_log` (target production)
- `network`: string (`origraph-local-demo`, `base-sepolia`, etc.)
- `tx_hash`: string
- `block_num`: integer
- `timestamp`: RFC3339 timestamp
- `data_hash`: lowercase 64-char hex

For `evm_log` target, include additional fields in future extension:

- `chain_id`: integer
- `contract_address`: hex address
- `event_signature`: `Anchored(bytes32,uint256,address)`
- `log_index`: integer

### 2.6 `verification_hints`

- `chain_id`: integer or null
- `contract_address`: string or null
- `event_signature`: string
- `rpc_urls`: string[] (optional bootstrap; verifiers may ignore)

## 3. Deterministic Canonicalization

For `bundle_id` generation:

1. Remove `bundle_id` from object.
2. Serialize JSON with sorted keys and compact separators (`","` and `":"`).
3. UTF-8 encode serialized bytes.
4. SHA-256 digest -> lowercase hex.
5. Prefix with `opb1_`.

## 4. Verification Algorithm (Verifier-Side)

Given `text` and `proof_bundle_v1`:

1. Assert `spec == "origraph-proof-bundle/v1"`.
2. Compute `candidate_hash = sha256(utf8(text))`.
3. Compare with `hashing.text_hash`.
4. Recover signer address from `signature.signature_hex` over EIP-191 message containing `<candidate_hash>`.
5. Compare recovered address with `issuer.eth_address` (case-insensitive).
6. Optional watermark check: run detector and compare expected payload traits.
7. Anchor check:
- For `simulated_chain`, server trust remains required.
- For `evm_log`, query chain by `tx_hash`, validate log/event and `data_hash`.
8. Recompute and validate `bundle_id`.

Result classes:

- `verified_cryptographic`: hash + signature + bundle integrity pass.
- `verified_anchor`: on-chain receipt/log validation pass.
- `verified_full`: both pass.

## 5. API Changes (Additive, Backward-Compatible)

### Existing endpoint response additions

1. `POST /api/registry/anchor`
- Adds optional `proof_bundle_v1` object.

2. `POST /api/registry/verify`
- Adds optional `proof_bundle_v1` when `verified=true`.

### New endpoints

1. `POST /api/registry/proof/text`
- Request: `{ "text": "..." }`
- Response: `{ found, verified, sha256_hash, proof_bundle_v1?, reason? }`

2. `GET /api/registry/proof/tx/{tx_hash}`
- Response: `{ found, tx_hash, proof_bundle_v1 }`

3. `GET /api/registry/proof/spec`
- Returns active proof spec identifier and schema location.

## 6. Extension Changes Required

Current extension behavior is backend-assisted (`/api/registry/verify`).

Required changes for decentralized mode:

1. Keep backend-assisted flow as fallback.
2. Add local verifier module (`verify_local.js`) implementing steps in Section 4.
3. Support importing/providing `proof_bundle_v1`:
- from API response
- from embedded page metadata (future)
- from downloaded JSON file
4. Add RPC verification adapter for `evm_log` anchors.
5. In UI show 3 badges:
- `Hash+Signature Verified`
- `Anchor Verified`
- `Bundle Integrity Verified`

## 7. Migration Milestones

1. Milestone A: Bundle emitted by APIs (done in demo backend).
2. Milestone B: Extension local hash/signature verification.
3. Milestone C: On-chain anchor verification (`evm_log`).
4. Milestone D: Backend becomes optional for verification.

