"""Anchoring and provenance verification service."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from invisible_text_watermark import Watermarker
from registry.chain import SimulatedChain
from registry.db import DB_PATH

from app.repositories.sqlite_registry import SQLiteRegistryRepository
from app.services.signing_service import SigningService


class AnchoringService:
    def __init__(
        self,
        repository: SQLiteRegistryRepository,
        signing_service: SigningService,
        db_path: Path | str = DB_PATH,
    ) -> None:
        self.repository = repository
        self.signing_service = signing_service
        self.db_path = Path(db_path)
        self.chain = SimulatedChain(self.db_path)

    @staticmethod
    def _normalize_signature_hex(signature_hex: str) -> str:
        clean = signature_hex.strip().lower()
        return clean if clean.startswith("0x") else f"0x{clean}"

    @staticmethod
    def _bundle_id(payload: dict[str, Any]) -> str:
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return f"opb1_{digest}"

    def _build_proof_bundle(
        self,
        *,
        data_hash: str,
        issuer_id: int,
        company: dict | None,
        signature_hex: str,
        tx_hash: str,
        block_num: int,
        timestamp: str,
        watermark: dict[str, Any],
    ) -> dict[str, Any]:
        bundle_wo_id = {
            "spec": "origraph-proof-bundle/v1",
            "hashing": {
                "algorithm": "sha256",
                "text_hash": data_hash,
                "input_encoding": "utf-8",
                "normalization": "none",
            },
            "issuer": {
                "issuer_id": issuer_id,
                "name": company["name"] if company else "unknown",
                "eth_address": company["eth_address"] if company else None,
                "public_key_hex": company["public_key_hex"] if company else None,
            },
            "signature": {
                "scheme": "eip191_personal_sign",
                "signed_payload": f"sha256:{data_hash}",
                "signature_hex": self._normalize_signature_hex(signature_hex),
                "recoverable_address": True,
            },
            "watermark": watermark,
            "anchors": [
                {
                    "type": "simulated_chain",
                    "network": "origraph-local-demo",
                    "tx_hash": tx_hash,
                    "block_num": block_num,
                    "timestamp": timestamp,
                    "data_hash": data_hash,
                }
            ],
            "verification_hints": {
                "chain_id": None,
                "contract_address": None,
                "event_signature": "Anchored(bytes32,uint256,address)",
                "rpc_urls": [],
            },
        }
        return {
            "bundle_id": self._bundle_id(bundle_wo_id),
            **bundle_wo_id,
        }

    def anchor_response(
        self,
        text: str,
        raw_text: str,
        signature_hex: str,
        issuer_id: int,
        metadata: dict,
    ) -> dict:
        data_hash = self.signing_service.hash_text(text)
        signer = self.signing_service.verify_signature(data_hash, signature_hex, issuer_id)
        if signer is None:
            raise PermissionError(
                "Invalid signature or unauthorized issuer_id. Only authorized companies with valid private keys can anchor."
            )

        self.repository.save_response(
            sha256_hash=data_hash,
            issuer_id=signer.issuer_id,
            signature_hex=signature_hex,
            raw_text=raw_text or text,
            watermarked_text=text,
            metadata=metadata,
        )

        receipt = self.chain.anchor(
            data_hash=data_hash,
            issuer_id=signer.issuer_id,
            signature_hex=signature_hex,
            metadata=metadata,
        )
        detect_result = Watermarker().detect(text)
        watermark = {
            "detected": detect_result.watermarked,
            "tag_count": detect_result.tag_count,
            "payloads": detect_result.payloads,
        }
        proof_bundle_v1 = self._build_proof_bundle(
            data_hash=data_hash,
            issuer_id=signer.issuer_id,
            company=self.repository.get_company(signer.issuer_id),
            signature_hex=signature_hex,
            tx_hash=receipt.tx_hash,
            block_num=receipt.block_num,
            timestamp=receipt.timestamp,
            watermark=watermark,
        )

        return {
            "verified_signer": signer.name,
            "eth_address": signer.eth_address,
            "sha256_hash": data_hash,
            "chain_receipt": receipt.to_dict(),
            "proof_bundle_v1": proof_bundle_v1,
        }

    def verify_text(self, text: str) -> dict:
        data_hash = self.signing_service.hash_text(text)
        record = self.chain.lookup(data_hash)

        wm = Watermarker()
        detect_result = wm.detect(text)

        if record is None:
            return {
                "verified": False,
                "sha256_hash": data_hash,
                "reason": "Hash not found on chain. Text may be tampered or never registered.",
                "watermark": {
                    "detected": detect_result.watermarked,
                    "tag_count": detect_result.tag_count,
                    "payloads": detect_result.payloads,
                },
            }

        company = self.repository.get_company(record.issuer_id)
        watermark = {
            "detected": detect_result.watermarked,
            "tag_count": detect_result.tag_count,
            "payloads": detect_result.payloads,
        }
        proof_bundle_v1 = self._build_proof_bundle(
            data_hash=data_hash,
            issuer_id=record.issuer_id,
            company=company,
            signature_hex=record.signature_hex,
            tx_hash=record.tx_hash,
            block_num=record.block_num,
            timestamp=record.timestamp,
            watermark=watermark,
        )
        return {
            "verified": True,
            "sha256_hash": data_hash,
            "issuer_id": record.issuer_id,
            "company": company["name"] if company else "unknown",
            "eth_address": company["eth_address"] if company else None,
            "block_num": record.block_num,
            "tx_hash": record.tx_hash,
            "timestamp": record.timestamp,
            "watermark": {
                "detected": detect_result.watermarked,
                "tag_count": detect_result.tag_count,
                "payloads": detect_result.payloads,
            },
            "proof_bundle_v1": proof_bundle_v1,
        }

    def proof_by_text(self, text: str) -> dict:
        verify = self.verify_text(text)
        if not verify.get("verified"):
            return {
                "found": False,
                "verified": False,
                "sha256_hash": verify["sha256_hash"],
                "reason": verify.get("reason", "No proof found"),
            }
        return {
            "found": True,
            "verified": True,
            "sha256_hash": verify["sha256_hash"],
            "proof_bundle_v1": verify["proof_bundle_v1"],
        }

    def proof_by_tx_hash(self, tx_hash: str) -> dict:
        block = self.repository.get_chain_block_by_tx_hash(tx_hash)
        if block is None:
            return {"found": False, "tx_hash": tx_hash, "reason": "Transaction hash not found"}

        company = self.repository.get_company(block["issuer_id"])
        response = self.repository.get_response_by_hash(block["data_hash"])

        watermark = {"detected": False, "tag_count": 0, "payloads": []}
        if response and response.get("watermarked_text"):
            detect = Watermarker().detect(response["watermarked_text"])
            watermark = {
                "detected": detect.watermarked,
                "tag_count": detect.tag_count,
                "payloads": detect.payloads,
            }

        proof_bundle_v1 = self._build_proof_bundle(
            data_hash=block["data_hash"],
            issuer_id=block["issuer_id"],
            company=company,
            signature_hex=block["signature_hex"],
            tx_hash=block["tx_hash"],
            block_num=block["block_num"],
            timestamp=block["timestamp"],
            watermark=watermark,
        )
        return {
            "found": True,
            "tx_hash": tx_hash,
            "proof_bundle_v1": proof_bundle_v1,
        }

    def chain_status(self) -> dict:
        valid, message = self.chain.validate_chain()
        return {
            "length": self.chain.chain_length(),
            "valid": valid,
            "message": message,
        }

    def reset_state(self) -> dict:
        for suffix in ("", "-wal", "-shm"):
            path = Path(f"{self.db_path}{suffix}")
            if path.exists():
                path.unlink()

        self.repository.init()
        self.chain = SimulatedChain(self.db_path)
        return {
            "ok": True,
            "db_path": str(self.db_path),
            "chain_length": self.chain.chain_length(),
        }
