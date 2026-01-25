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
    """Debug endpoint to check admin password configuration (remove in production)."""
    admin_password = settings.admin_password
    
    return {
        "password_set": admin_password != "change-me-in-production",
        "password_length": len(admin_password) if admin_password else 0,
        "expected_password_FULL": admin_password,
        "expected_password_prefix": admin_password[:5] if admin_password else "NOT_SET",
        "source": "Render /etc/secrets/.env or local .env file"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
