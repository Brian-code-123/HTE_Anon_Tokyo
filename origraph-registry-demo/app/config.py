"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(slots=True)
class Settings:
    minimax_api_key: str
    minimax_base_url: str
    registry_admin_secret: str
    demo_mode: str

    @property
    def is_fixture_mode(self) -> bool:
        return self.demo_mode == "fixture"

    def validate(self) -> None:
        if self.demo_mode not in {"live", "fixture"}:
            raise ValueError("DEMO_MODE must be either 'live' or 'fixture'")
        if not self.registry_admin_secret:
            raise ValueError("REGISTRY_ADMIN_SECRET must not be empty")


def load_settings() -> Settings:
    settings = Settings(
        minimax_api_key=os.getenv("MINIMAX_API_KEY", "").strip(),
        minimax_base_url=os.getenv("MINIMAX_BASE_URL", "https://api.minimax.io/anthropic").strip(),
        registry_admin_secret=os.getenv("REGISTRY_ADMIN_SECRET", "dev-admin-secret").strip(),
        demo_mode=os.getenv("DEMO_MODE", "live").strip().lower() or "live",
    )
    settings.validate()
    return settings
