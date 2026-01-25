"""FastAPI application for DevOps OA backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from database import init_db
from routes import router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    # Initialize database on startup
    init_db()
    yield


app = FastAPI(
    title="DevOps OA Backend",
    description="Backend API for the OTCR DevOps Online Assessment",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
origins = [origin.strip() for origin in settings.allowed_origins.split(",")]
# Always include production origin
if "https://recruit.otcr-consulting.com" not in origins:
    origins.append("https://recruit.otcr-consulting.com")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "devops-oa-backend"}


@app.get("/debug/admin-secret-check")
async def debug_admin_secret():
    """Debug endpoint to check admin secret configuration (remove in production)."""
    import os
    admin_secret_from_env = os.environ.get("ADMIN_PASSWORD")
    admin_secret_from_settings = settings.admin_password
    
    return {
        "env_var_set": admin_secret_from_env is not None,
        "env_var_length": len(admin_secret_from_env) if admin_secret_from_env else 0,
        "settings_secret_length": len(admin_secret_from_settings),
        "using": "env" if admin_secret_from_env else "settings",
        "expected_secret_FULL": (admin_secret_from_env or admin_secret_from_settings),
        "expected_secret_prefix": (admin_secret_from_env or admin_secret_from_settings)[:5] if (admin_secret_from_env or admin_secret_from_settings) else "None"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
