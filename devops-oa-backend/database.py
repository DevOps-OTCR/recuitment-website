"""Database connection and session management."""

from sqlalchemy import create_engine, event
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
engine = create_engine(_db_url, connect_args=connect_args)


@event.listens_for(engine, "connect")
def _set_psycopg2_prepare_threshold(dbapi_conn, connection_record):
    """Supabase transaction pooler does not support PREPARE; disable server-side prepared statements."""
    if "pooler.supabase.com" not in _db_url:
        return
    try:
        dbapi_conn.prepare_threshold = 0
    except AttributeError:
        pass

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
