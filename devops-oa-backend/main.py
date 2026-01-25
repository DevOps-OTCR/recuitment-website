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
    import os
    admin_password = settings.admin_password
    
    # Check if secret file exists
    secret_file_exists = os.path.exists("/etc/secrets/.env")
    
    return {
        "password_set": admin_password != "change-me-in-production",
        "password_length": len(admin_password) if admin_password else 0,
        "expected_password_FULL": admin_password,
        "expected_password_prefix": admin_password[:5] if admin_password else "NOT_SET",
        "source": "Render /etc/secrets/.env or local .env file",
        "secret_file_exists": secret_file_exists,
        "secret_file_path": "/etc/secrets/.env"
    }


@app.get("/debug/check-secret-file")
async def check_secret_file():
    """Debug endpoint to read secret file content (remove in production)."""
    import os
    
    secret_file_path = "/etc/secrets/.env"
    
    if not os.path.exists(secret_file_path):
        return {
            "exists": False,
            "path": secret_file_path,
            "message": "Secret file not found at /etc/secrets/.env"
        }
    
    try:
        with open(secret_file_path, 'r') as f:
            content = f.read()
        return {
            "exists": True,
            "path": secret_file_path,
            "content": content,
            "lines": len(content.split('\n'))
        }
    except Exception as e:
        return {
            "exists": True,
            "path": secret_file_path,
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
