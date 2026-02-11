"""Database connection and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from config import get_settings

settings = get_settings()


def _database_url() -> str:
    """Use configured DATABASE_URL; ensure Supabase Postgres has SSL."""
    url = settings.database_url
    if "supabase" in url:
        parsed = urlparse(url)
        qs = parse_qs(parsed.query)
        if "sslmode" not in qs:
            qs["sslmode"] = ["require"]
            new_query = urlencode(qs, doseq=True)
            url = urlunparse(parsed._replace(query=new_query))
    return url


# Create engine with SQLite-specific settings
_db_url = _database_url()
connect_args = {}
if "sqlite" in _db_url:
    connect_args["check_same_thread"] = False
elif "pooler.supabase.com" in _db_url:
    # Transaction pooler does not support PREPARE statements; disable server-side prepared statements
    connect_args["prepare_threshold"] = 0
engine = create_engine(_db_url, connect_args=connect_args)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    from models import AssessmentLink, Attempt, Submission, Application  # noqa: F401
    Base.metadata.create_all(bind=engine)
