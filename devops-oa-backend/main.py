"""FastAPI application for DevOps OA backend.

Author: Adeetya Upadhyay <adeeu2@illinois.edu>
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from database import init_db
from routes import router
from storage import ensure_resumes_bucket

settings = get_settings()


def _require_supabase_storage_in_production():
    """When using Supabase Postgres (production), Supabase Storage is required."""
    url = (settings.database_url or "").lower()
    if "postgres" not in url or "supabase" not in url:
        return  # SQLite or non-Supabase Postgres: local storage allowed
    if settings.supabase_url and settings.supabase_key:
        return  # Supabase Storage configured
    raise RuntimeError(
        "Production uses Supabase Postgres; Supabase Storage is required. "
        "Set SUPABASE_URL and SUPABASE_KEY (Service Role) in your environment (e.g. Render env vars or /etc/secrets/.env)."
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    _require_supabase_storage_in_production()
    init_db()
    ensure_resumes_bucket()
    yield


app = FastAPI(
    title="DevOps OA Backend",
    description="Backend API for the OTCR DevOps Online Assessment",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS: allow frontend origin(s); production is always included
_production_origin = "https://recruit.otcr-consulting.com"
origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
if _production_origin not in origins:
    origins.append(_production_origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "devops-oa-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
