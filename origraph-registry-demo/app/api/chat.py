"""Chat + watermark endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.models import ChatRequest, StripRequest, TextRequest

router = APIRouter()


@router.get("/api/models")
async def list_models(request: Request):
    return request.app.state.chat_service.list_models()


@router.post("/api/chat")
async def chat(request: Request, req: ChatRequest):
    watermark_service = request.app.state.watermark_service
    chat_service = request.app.state.chat_service
    wm = watermark_service.build(req.wm_params.model_dump()) if req.watermark else None
    return await chat_service.chat(req, wm)


@router.post("/api/detect")
async def detect(request: Request, req: TextRequest):
    return request.app.state.watermark_service.detect(req.text, req.wm_params.model_dump())


@router.post("/api/strip")
async def strip(request: Request, req: StripRequest):
    return request.app.state.watermark_service.strip(req.text)


@router.post("/api/apply")
async def apply_watermark(request: Request, req: TextRequest):
    return request.app.state.watermark_service.apply(req.text, req.wm_params.model_dump())
