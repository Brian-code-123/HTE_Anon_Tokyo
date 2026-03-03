"""Registry, chain, and demo operational endpoints."""

from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException, Request

from app.models import AnchorRequest, CreateCompanyRequest, ProofByTextRequest, VerifyRequest
from app.services.chat_service import FIXTURE_TEXT

router = APIRouter()


@router.get("/api/health")
async def api_health(request: Request):
    settings = request.app.state.settings
    chain = request.app.state.anchoring_service.chain_status()
    return {
        "status": "ok",
        "demo_mode": settings.demo_mode,
        "minimax_api_key_configured": bool(settings.minimax_api_key),
        "minimax_required": not settings.is_fixture_mode,
        "chain": chain,
    }


@router.get("/api/demo/scenario")
async def api_demo_scenario(request: Request):
    watermark_service = request.app.state.watermark_service
    signing_service = request.app.state.signing_service

    wm_params = {
        "issuer_id": 777,
        "model_id": 42,
        "model_version_id": 1,
        "key_id": 1,
        "repeat_interval_tokens": 160,
    }
    raw_text = FIXTURE_TEXT
    watermarked_text = watermark_service.apply(raw_text, wm_params)["text"]
    sha256_hash = signing_service.hash_text(watermarked_text)

    return {
        "name": "deterministic-fixture",
        "description": "Known-good deterministic scenario for live demos.",
        "raw_text": raw_text,
        "watermarked_text": watermarked_text,
        "wm_params": wm_params,
        "sha256_hash": sha256_hash,
        "expected_first_block": 1,
        "tamper_example": watermarked_text.replace("deterministic", "modified", 1),
    }


@router.post("/api/demo/reset")
async def api_demo_reset(request: Request):
    allow_reset = os.getenv("ALLOW_DEMO_RESET", "1").strip().lower() in {"1", "true", "yes"}
    if not allow_reset:
        raise HTTPException(status_code=403, detail="Demo reset is disabled")
    return request.app.state.anchoring_service.reset_state()


@router.post("/api/registry/companies")
async def api_create_company(request: Request, req: CreateCompanyRequest):
    try:
        return request.app.state.signing_service.create_company(req.name, req.admin_secret)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.get("/api/registry/companies")
async def api_list_companies(request: Request):
    return request.app.state.registry_repo.list_companies()


@router.post("/api/registry/anchor")
async def api_anchor(request: Request, req: AnchorRequest):
    try:
        return request.app.state.anchoring_service.anchor_response(
            text=req.text,
            raw_text=req.raw_text,
            signature_hex=req.signature_hex,
            issuer_id=req.issuer_id,
            metadata=req.metadata,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@router.post("/api/registry/verify")
async def api_verify(request: Request, req: VerifyRequest):
    return request.app.state.anchoring_service.verify_text(req.text)


@router.post("/api/registry/proof/text")
async def api_proof_by_text(request: Request, req: ProofByTextRequest):
    return request.app.state.anchoring_service.proof_by_text(req.text)


@router.get("/api/registry/proof/tx/{tx_hash}")
async def api_proof_by_tx_hash(request: Request, tx_hash: str):
    proof = request.app.state.anchoring_service.proof_by_tx_hash(tx_hash)
    if not proof.get("found"):
        raise HTTPException(status_code=404, detail=proof.get("reason", "Proof not found"))
    return proof


@router.get("/api/registry/proof/spec")
async def api_proof_spec():
    return {
        "spec": "origraph-proof-bundle/v1",
        "schema_path": "/docs/specs/origraph-proof-bundle-v1.schema.json",
        "description": "Decentralized verification bundle format for extension and third-party verifiers.",
    }


@router.get("/api/registry/chain/status")
async def api_chain_status(request: Request):
    return request.app.state.anchoring_service.chain_status()


@router.get("/api/registry/chain/blocks")
async def api_chain_blocks(request: Request, limit: int = 50, offset: int = 0):
    return request.app.state.registry_repo.list_chain_blocks(limit=limit, offset=offset)


@router.get("/api/registry/chain/block/{block_num}")
async def api_chain_block(request: Request, block_num: int):
    block = request.app.state.registry_repo.get_chain_block(block_num)
    if block is None:
        raise HTTPException(status_code=404, detail="Block not found")
    return block


@router.get("/api/registry/responses")
async def api_list_responses(request: Request, limit: int = 50, offset: int = 0):
    return request.app.state.registry_repo.list_responses(limit=limit, offset=offset)


@router.get("/api/registry/demo/latest-response")
async def api_demo_latest_response(request: Request):
    latest = request.app.state.registry_repo.latest_response()
    if latest is None:
        raise HTTPException(status_code=404, detail="No anchored responses found yet")
    return latest
