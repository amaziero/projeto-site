# C:/repo/projeto/backend/.venv/Scripts/Activate.ps1
# uvicorn app.main:app --reload
# uvicorn app.main:app --reload --host localhost --port 8000

# para ambinente de prod
# gunicorn -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 --workers 4

# http://127.0.0.1:8000/docs

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.middlaware import limit_upload_size
from app.core.config import settings
from app.api.routes.split import router as api_router

from app.api.routes.merge import router as merge_router
from app.core.exceptions import DomainError, handle_domain_error

origins = [
    "https://projeto-site-wfoe.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)
    
    app.middleware("http")(
        limit_upload_size
    )

    app.include_router(merge_router, prefix="/v1")
    app.include_router(api_router, prefix="/v1")

    app.add_exception_handler(DomainError, handle_domain_error)
    
    return app

app = create_app()


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],  # ou ["*"] para todos os métodos
    allow_headers=["*"],  # permite Content-Type
)
