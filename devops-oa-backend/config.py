"""Configuration management for the DevOps OA backend."""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Admin password for link generation
    admin_password: str = "change-me-in-production"
    
    # Code execution API (Judge0 or Piston)
    code_exec_api_url: str = "https://judge0-ce.p.rapidapi.com"
    code_exec_api_key: str = ""
    
    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:8080"
    
    # Database
    database_url: str = "sqlite:///./devops_oa.db"
    
    # Frontend URL for assessment links
    frontend_base_url: str = "http://localhost:5173/#/tech/assessment"
    
    model_config = SettingsConfigDict(
        # Try Render secret file first, then local .env
        env_file=["/etc/secrets/.env", ".env"],
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
