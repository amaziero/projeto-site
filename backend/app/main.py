# C:/repo/projeto/backend/.venv/Scripts/Activate.ps1
# uvicorn app.main:app --reload

# http://127.0.0.1:8000/docs

from fastapi import FastAPI
from app.core.middlaware import limit_upload_size
from app.core.config import settings
from app.api.routes import router as api_router

def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

    app.middleware("http")(
        limit_upload_size
    )

    app.include_router(
        api_router
    )
    return app

app = create_app()
