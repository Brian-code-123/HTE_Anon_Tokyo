"""Pydantic request models for API endpoints."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class WmParams(BaseModel):
    issuer_id: int = 1
    model_id: int = 0
    model_version_id: int = 0
    key_id: int = 1
    repeat_interval_tokens: int = 160


class ChatRequest(BaseModel):
    model: str = "MiniMax-M2.1"
    provider: str = "minimax"
    messages: list[dict[str, Any]] = Field(default_factory=list)
    system: str = "You are a helpful assistant."
    watermark: bool = True
    wm_params: WmParams = Field(default_factory=WmParams)
    stream: bool = False
    max_tokens: int = 2048
    temperature: float = 0.7


class TextRequest(BaseModel):
    text: str = ""
    wm_params: WmParams = Field(default_factory=WmParams)


class StripRequest(BaseModel):
    text: str = ""


class CreateCompanyRequest(BaseModel):
    name: str
    admin_secret: str = ""


class AnchorRequest(BaseModel):
    text: str
    raw_text: str = ""
    signature_hex: str
    issuer_id: int
    metadata: dict[str, Any] = Field(default_factory=dict)


class VerifyRequest(BaseModel):
    text: str


class ProofByTextRequest(BaseModel):
    text: str
