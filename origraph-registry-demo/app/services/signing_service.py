"""Company key management and signature verification service."""

from __future__ import annotations

from registry.auth import create_company, hash_text, verify_signature


class SigningService:
    def __init__(self, admin_secret: str) -> None:
        self.admin_secret = admin_secret

    def create_company(self, name: str, admin_secret: str) -> dict:
        if admin_secret != self.admin_secret:
            raise PermissionError("Invalid admin secret")
        creds = create_company(name)
        return {
            "issuer_id": creds.issuer_id,
            "name": creds.name,
            "eth_address": creds.eth_address,
            "private_key": creds.private_key_hex,
            "warning": "Store this private key securely. It will NOT be shown again.",
        }

    def hash_text(self, text: str) -> str:
        return hash_text(text)

    def verify_signature(self, data_hash: str, signature_hex: str, issuer_id: int):
        return verify_signature(data_hash, signature_hex, issuer_id)
