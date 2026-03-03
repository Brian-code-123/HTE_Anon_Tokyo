"""Repository adapter for registry SQLite access."""

from __future__ import annotations

import json
from pathlib import Path

from registry.db import (
    DB_PATH,
    get_company_by_issuer,
    get_db,
    get_response_by_hash,
    init_db,
    insert_response,
    list_companies,
)


class SQLiteRegistryRepository:
    def __init__(self, db_path: Path | str = DB_PATH) -> None:
        self.db_path = Path(db_path)
        init_db(self.db_path)

    def init(self) -> None:
        init_db(self.db_path)

    def list_companies(self) -> list[dict]:
        with get_db(self.db_path) as conn:
            companies = list_companies(conn)
        return [
            {
                "issuer_id": c["issuer_id"],
                "name": c["name"],
                "eth_address": c["eth_address"],
                "active": bool(c["active"]),
                "created_at": c["created_at"],
            }
            for c in companies
        ]

    def save_response(
        self,
        sha256_hash: str,
        issuer_id: int,
        signature_hex: str,
        raw_text: str,
        watermarked_text: str,
        metadata: dict,
    ) -> int:
        with get_db(self.db_path) as conn:
            return insert_response(
                conn,
                sha256_hash=sha256_hash,
                issuer_id=issuer_id,
                signature_hex=signature_hex,
                raw_text=raw_text,
                watermarked_text=watermarked_text,
                metadata_json=json.dumps(metadata),
            )

    def get_company(self, issuer_id: int) -> dict | None:
        with get_db(self.db_path) as conn:
            row = get_company_by_issuer(conn, issuer_id)
        return dict(row) if row else None

    def list_chain_blocks(self, limit: int, offset: int) -> dict:
        with get_db(self.db_path) as conn:
            blocks = conn.execute(
                "SELECT * FROM chain_blocks ORDER BY block_num DESC LIMIT ? OFFSET ?",
                (limit, offset),
            ).fetchall()
            total = conn.execute("SELECT COUNT(*) AS c FROM chain_blocks").fetchone()["c"]
        return {
            "blocks": [dict(b) for b in blocks],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def get_chain_block(self, block_num: int) -> dict | None:
        with get_db(self.db_path) as conn:
            block = conn.execute(
                "SELECT * FROM chain_blocks WHERE block_num = ?",
                (block_num,),
            ).fetchone()
        return dict(block) if block else None

    def get_chain_block_by_tx_hash(self, tx_hash: str) -> dict | None:
        with get_db(self.db_path) as conn:
            block = conn.execute(
                "SELECT * FROM chain_blocks WHERE tx_hash = ?",
                (tx_hash,),
            ).fetchone()
        return dict(block) if block else None

    def list_responses(self, limit: int, offset: int) -> dict:
        with get_db(self.db_path) as conn:
            rows = conn.execute(
                "SELECT id, sha256_hash, issuer_id, created_at, metadata_json "
                "FROM responses ORDER BY id DESC LIMIT ? OFFSET ?",
                (limit, offset),
            ).fetchall()
            total = conn.execute("SELECT COUNT(*) AS c FROM responses").fetchone()["c"]
        return {"responses": [dict(r) for r in rows], "total": total}

    def latest_response(self) -> dict | None:
        with get_db(self.db_path) as conn:
            row = conn.execute(
                "SELECT r.id, r.sha256_hash, r.issuer_id, r.raw_text, r.watermarked_text, "
                "r.created_at, c.name AS company_name "
                "FROM responses r "
                "LEFT JOIN companies c ON c.issuer_id = r.issuer_id "
                "ORDER BY r.id DESC LIMIT 1"
            ).fetchone()
        return dict(row) if row else None

    def get_response_by_hash(self, sha256_hash: str) -> dict | None:
        with get_db(self.db_path) as conn:
            row = get_response_by_hash(conn, sha256_hash)
        return dict(row) if row else None
