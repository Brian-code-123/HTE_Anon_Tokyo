"""FastAPI application assembly and SPA serving."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.chat import router as chat_router
from app.api.registry import router as registry_router
from app.config import load_settings
from app.repositories.sqlite_registry import SQLiteRegistryRepository
from app.services.anchoring_service import AnchoringService
from app.services.chat_service import ChatService
from app.services.signing_service import SigningService
from app.services.watermark_service import WatermarkService

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = BASE_DIR / 'frontend' / 'dist'
FRONTEND_INDEX = FRONTEND_DIST_DIR / 'index.html'
FRONTEND_ASSETS_DIR = FRONTEND_DIST_DIR / 'assets'


def _frontend_missing_message() -> str:
    return (
        '<!doctype html><html><head><meta charset="utf-8"><title>Frontend Build Missing</title>'
        '<style>body{font-family:system-ui;padding:2rem;line-height:1.5;background:#f8fafc;color:#0f172a}'
        'code{background:#e2e8f0;padding:.15rem .35rem;border-radius:6px}</style></head><body>'
        '<h1>Frontend build not found</h1>'
        '<p>The React SPA is not built yet. APIs are available, but UI routes need compiled assets.</p>'
        '<p>Run:</p><p><code>cd origraph-registry-demo/frontend && npm install && npm run build</code></p>'
        '</body></html>'
    )


def create_app() -> FastAPI:
    load_dotenv(BASE_DIR / '.env')
    load_dotenv()

    settings = load_settings()

    app = FastAPI(title='Origraph Watermark Lab')

    app.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_methods=['*'],
        allow_headers=['*'],
    )

    frontend_ready = FRONTEND_INDEX.exists()
    if FRONTEND_ASSETS_DIR.exists():
        app.mount('/assets', StaticFiles(directory=str(FRONTEND_ASSETS_DIR)), name='frontend-assets')

    if not frontend_ready:
        print('WARNING: frontend dist build not found at', FRONTEND_INDEX)
        print('Run: cd origraph-registry-demo/frontend && npm install && npm run build')

    registry_repo = SQLiteRegistryRepository()
    signing_service = SigningService(admin_secret=settings.registry_admin_secret)
    anchoring_service = AnchoringService(
        repository=registry_repo,
        signing_service=signing_service,
    )

    app.state.settings = settings
    app.state.frontend_ready = frontend_ready
    app.state.registry_repo = registry_repo
    app.state.signing_service = signing_service
    app.state.anchoring_service = anchoring_service
    app.state.chat_service = ChatService(settings=settings)
    app.state.watermark_service = WatermarkService()

    app.include_router(chat_router)
    app.include_router(registry_router)

    @app.get('/{full_path:path}')
    async def spa_fallback(full_path: str):
        # API routes are handled by dedicated routers; this fallback serves SPA routes.
        if full_path.startswith('api/'):
            return JSONResponse({'detail': 'Not Found'}, status_code=404)
        if app.state.frontend_ready:
            candidate = FRONTEND_DIST_DIR / full_path
            if full_path and candidate.is_file():
                return FileResponse(candidate)
            return FileResponse(FRONTEND_INDEX)
        return HTMLResponse(content=_frontend_missing_message(), status_code=503)

    return app


app = create_app()


def run() -> None:
    import uvicorn

    from registry.db import DB_PATH

    settings = app.state.settings
    if not settings.minimax_api_key and not settings.is_fixture_mode:
        print('WARNING: MINIMAX_API_KEY not set. Set it in .env or environment.')

    print('Registry DB:', DB_PATH)
    print('Admin secret:', 'SET' if settings.registry_admin_secret else 'NOT SET')
    print('Demo mode:', settings.demo_mode)
    print('Frontend build:', 'READY' if app.state.frontend_ready else 'MISSING')

    host = os.getenv('APP_HOST', '127.0.0.1').strip() or '127.0.0.1'
    port_raw = os.getenv('APP_PORT', '5050').strip() or '5050'
    try:
        port = int(port_raw)
    except ValueError:
        print(f'WARNING: invalid APP_PORT={port_raw!r}, falling back to 5050')
        port = 5050

    print('Bind host:', host)
    print('Bind port:', port)

    reload_enabled = os.getenv('UVICORN_RELOAD', '1').strip().lower() in {'1', 'true', 'yes'}
    target = 'app.main:app' if reload_enabled else app
    uvicorn.run(target, host=host, port=port, reload=reload_enabled)
