"""Configuration management for the DevOps OA backend."""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


def _load_secret_file():
    """Load secret file from Render /etc/secrets/.env into environment variables."""
    secret_file_path = "/etc/secrets/.env"
    
    if os.path.exists(secret_file_path):
        try:
            with open(secret_file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    # Skip empty lines and comments
                    if not line or line.startswith('#'):
                        continue
                    # Parse KEY=VALUE
                    if '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        # Set in environment
                        os.environ[key] = value
        except Exception as e:
            print(f"Warning: Could not load secret file {secret_file_path}: {e}")


# Load secret file on startup
_load_secret_file()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Admin password for link generation
    admin_password: str = "change-me-in-production"
    
    # Code execution API (Judge0 or Piston)
    code_exec_api_url: str = "https://judge0-ce.p.rapidapi.com"
    code_exec_api_key: str = ""
    
    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:8080"
    
    # Database (use Supabase Postgres in production)
    database_url: str = "sqlite:///./devops_oa.db"
    
    # Supabase (for resume storage; optional – if set, resumes go to Storage instead of local disk)
    supabase_url: str = ""
    supabase_key: str = ""  # Use Service Role key for private bucket access
    
    # Frontend URL for assessment links
    frontend_base_url: str = "http://localhost:5173/#/tech/assessment"
    
    model_config = SettingsConfigDict(
        # Fall back to local .env if secret file not found
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
