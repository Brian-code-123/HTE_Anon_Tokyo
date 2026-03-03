"""Watermark helpers used by API handlers."""

from __future__ import annotations

from invisible_text_watermark import DetectResult, Watermarker


class WatermarkService:
    def build(self, params: dict) -> Watermarker:
        return Watermarker(
            issuer_id=params.get("issuer_id", 1),
            model_id=params.get("model_id", 0),
            model_version_id=params.get("model_version_id", 0),
            key_id=params.get("key_id", 1),
            repeat_interval_tokens=params.get("repeat_interval_tokens", 160),
        )

    def apply(self, text: str, params: dict) -> dict:
        wm = self.build(params)
        watermarked = wm.apply(text)
        return {"text": watermarked, "raw_text": text}

    def detect(self, text: str, params: dict) -> dict:
        wm = self.build(params)
        result: DetectResult = wm.detect(text)
        return {
            "watermarked": result.watermarked,
            "tag_count": result.tag_count,
            "valid_count": result.valid_count,
            "invalid_count": result.invalid_count,
            "payloads": result.payloads,
        }

    def strip(self, text: str) -> dict:
        cleaned = Watermarker.strip(text)
        return {"text": cleaned}
