"""Chat generation service with live and deterministic fixture modes."""

from __future__ import annotations

from typing import Any

from app.config import Settings


MINIMAX_MODELS = [
    {"id": "MiniMax-M2.5", "name": "MiniMax M2.5", "provider": "minimax"},
    {"id": "MiniMax-M2.5-highspeed", "name": "MiniMax M2.5 Highspeed", "provider": "minimax"},
    {"id": "MiniMax-M2.1", "name": "MiniMax M2.1", "provider": "minimax"},
    {"id": "MiniMax-M2.1-highspeed", "name": "MiniMax M2.1 Highspeed", "provider": "minimax"},
    {"id": "MiniMax-M2", "name": "MiniMax M2", "provider": "minimax"},
]

BEDROCK_MODELS = [
    {"id": "anthropic.claude-sonnet-4-6", "name": "Claude Sonnet 4.6", "provider": "bedrock"},
    {"id": "anthropic.claude-opus-4-6-v1", "name": "Claude Opus 4.6", "provider": "bedrock"},
    {"id": "anthropic.claude-sonnet-4-5-20250929-v1:0", "name": "Claude Sonnet 4.5", "provider": "bedrock"},
    {"id": "anthropic.claude-opus-4-5-20251101-v1:0", "name": "Claude Opus 4.5", "provider": "bedrock"},
    {"id": "anthropic.claude-haiku-4-5-20251001-v1:0", "name": "Claude Haiku 4.5", "provider": "bedrock"},
    {"id": "anthropic.claude-3-5-sonnet-20241022-v2:0", "name": "Claude 3.5 Sonnet v2", "provider": "bedrock"},
    {"id": "deepseek.v3.2", "name": "DeepSeek V3.2", "provider": "bedrock"},
    {"id": "deepseek.r1-v1:0", "name": "DeepSeek R1", "provider": "bedrock"},
    {"id": "minimax.minimax-m2.1", "name": "MiniMax M2.1 (Bedrock)", "provider": "bedrock"},
    {"id": "minimax.minimax-m2", "name": "MiniMax M2 (Bedrock)", "provider": "bedrock"},
    {"id": "amazon.nova-pro-v1:0", "name": "Nova Pro", "provider": "bedrock"},
    {"id": "amazon.nova-lite-v1:0", "name": "Nova Lite", "provider": "bedrock"},
    {"id": "amazon.nova-micro-v1:0", "name": "Nova Micro", "provider": "bedrock"},
]

FIXTURE_TEXT = (
    "Origraph fixture response: this output is deterministic for demo reliability. "
    "It can be watermarked, signed, anchored, and verified without calling external model APIs."
)


class ChatService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def list_models(self) -> dict:
        return {"minimax": MINIMAX_MODELS, "bedrock": BEDROCK_MODELS}

    async def chat(self, req, wm) -> dict:
        if self.settings.is_fixture_mode:
            return self._chat_fixture(req, wm)

        if req.provider == "bedrock":
            return await self._chat_bedrock(req, wm)
        return await self._chat_minimax(req, wm)

    def _chat_fixture(self, req, wm) -> dict:
        prompt = self._extract_prompt(req.messages)
        raw_text = (
            f"{FIXTURE_TEXT}\n\n"
            f"Requested model: {req.model} ({req.provider}).\n"
            f"Prompt digest: {prompt[:180]}"
        )
        text = wm.apply(raw_text) if wm else raw_text
        return {
            "thinking": "fixture-mode",
            "text": text,
            "raw_text": raw_text,
            "watermarked": wm is not None,
            "model": req.model,
            "provider": req.provider,
            "usage": {
                "input_tokens": max(1, len(prompt.split())),
                "output_tokens": max(1, len(raw_text.split())),
            },
        }

    async def _chat_minimax(self, req, wm) -> dict:
        import anthropic

        client = anthropic.Anthropic(
            api_key=self.settings.minimax_api_key,
            base_url=self.settings.minimax_base_url,
        )

        try:
            resp = client.messages.create(
                model=req.model,
                max_tokens=req.max_tokens,
                system=req.system,
                messages=req.messages,
                temperature=req.temperature,
            )
        except anthropic.APIError as exc:
            return {"error": str(exc)}

        thinking = ""
        text = ""
        for block in resp.content:
            if block.type == "thinking":
                thinking += block.thinking
            elif block.type == "text":
                text += block.text

        raw_text = text
        if wm and text:
            text = wm.apply(text)

        return {
            "thinking": thinking,
            "text": text,
            "raw_text": raw_text,
            "watermarked": wm is not None,
            "model": req.model,
            "provider": "minimax",
            "usage": {
                "input_tokens": resp.usage.input_tokens,
                "output_tokens": resp.usage.output_tokens,
            },
        }

    async def _chat_bedrock(self, req, wm) -> dict:
        import boto3

        client = boto3.client("bedrock-runtime", region_name="us-east-1")

        bedrock_messages = []
        for msg in req.messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if isinstance(content, str):
                bedrock_messages.append({"role": role, "content": [{"text": content}]})
            elif isinstance(content, list):
                parts = []
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "text":
                        parts.append({"text": item.get("text", "")})
                    elif isinstance(item, str):
                        parts.append({"text": item})
                bedrock_messages.append({"role": role, "content": parts})

        try:
            resp = client.converse(
                modelId=req.model,
                messages=bedrock_messages,
                system=[{"text": req.system}],
                inferenceConfig={
                    "maxTokens": req.max_tokens,
                    "temperature": req.temperature,
                },
            )
        except Exception as exc:  # noqa: BLE001
            return {"error": str(exc)}

        thinking = ""
        text = ""
        output = resp.get("output", {})
        message = output.get("message", {})
        for block in message.get("content", []):
            if "text" in block:
                text += block["text"]
            if "reasoningContent" in block:
                rc = block["reasoningContent"]
                if "reasoningText" in rc:
                    thinking += rc["reasoningText"].get("text", "")

        raw_text = text
        if wm and text:
            text = wm.apply(text)

        usage = resp.get("usage", {})
        return {
            "thinking": thinking,
            "text": text,
            "raw_text": raw_text,
            "watermarked": wm is not None,
            "model": req.model,
            "provider": "bedrock",
            "usage": {
                "input_tokens": usage.get("inputTokens", 0),
                "output_tokens": usage.get("outputTokens", 0),
            },
        }

    @staticmethod
    def _extract_prompt(messages: list[dict[str, Any]]) -> str:
        if not messages:
            return ""

        parts: list[str] = []
        for msg in messages:
            content = msg.get("content", "")
            if isinstance(content, str):
                parts.append(content)
            elif isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "text":
                        parts.append(str(item.get("text", "")))
                    elif isinstance(item, str):
                        parts.append(item)
        return "\n".join(p for p in parts if p)
