"""Database connection and session management."""

from sqlalchemy import create_engine, event, inspect, text
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
    """Supabase pooled connections do NOT permit PREPARE. Disable server-side prepared statements (psycopg2: 0 = never prepare)."""
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


def _column_names(connection, table_name: str) -> set[str]:
    inspector = inspect(connection)
    if not inspector.has_table(table_name):
        return set()
    return {column["name"] for column in inspector.get_columns(table_name)}


def _add_column_if_missing(
    connection,
    *,
    table_name: str,
    column_name: str,
    sqlite_ddl: str,
    postgres_ddl: str,
):
    columns = _column_names(connection, table_name)
    if column_name in columns:
        return

    ddl = sqlite_ddl if "sqlite" in _db_url else postgres_ddl
    connection.execute(text(ddl))


def ensure_runtime_schema():
    """Apply additive schema upgrades for existing databases."""
    with engine.begin() as connection:
        _add_column_if_missing(
            connection,
            table_name="applications",
            column_name="archived_at",
            sqlite_ddl="ALTER TABLE applications ADD COLUMN archived_at DATETIME",
            postgres_ddl="ALTER TABLE applications ADD COLUMN archived_at TIMESTAMP",
        )

        _add_column_if_missing(
            connection,
            table_name="assessment_progress_snapshots",
            column_name="progress_detail",
            sqlite_ddl="ALTER TABLE assessment_progress_snapshots ADD COLUMN progress_detail JSON",
            postgres_ddl="ALTER TABLE assessment_progress_snapshots ADD COLUMN progress_detail JSONB",
        )

        evaluation_columns = [
            ("round", "ALTER TABLE evaluations ADD COLUMN round VARCHAR(50)", "ALTER TABLE evaluations ADD COLUMN round VARCHAR(50)"),
            ("interviewee_name", "ALTER TABLE evaluations ADD COLUMN interviewee_name VARCHAR(255)", "ALTER TABLE evaluations ADD COLUMN interviewee_name VARCHAR(255)"),
            ("interviewee_gender", "ALTER TABLE evaluations ADD COLUMN interviewee_gender VARCHAR(20)", "ALTER TABLE evaluations ADD COLUMN interviewee_gender VARCHAR(20)"),
            ("interviewer_role", "ALTER TABLE evaluations ADD COLUMN interviewer_role VARCHAR(20)", "ALTER TABLE evaluations ADD COLUMN interviewer_role VARCHAR(20)"),
            ("leadership_score", "ALTER TABLE evaluations ADD COLUMN leadership_score INTEGER", "ALTER TABLE evaluations ADD COLUMN leadership_score INTEGER"),
            ("interest_in_otcr_score", "ALTER TABLE evaluations ADD COLUMN interest_in_otcr_score INTEGER", "ALTER TABLE evaluations ADD COLUMN interest_in_otcr_score INTEGER"),
            ("behavioral_performance_score", "ALTER TABLE evaluations ADD COLUMN behavioral_performance_score INTEGER", "ALTER TABLE evaluations ADD COLUMN behavioral_performance_score INTEGER"),
            ("business_acumen_score", "ALTER TABLE evaluations ADD COLUMN business_acumen_score INTEGER", "ALTER TABLE evaluations ADD COLUMN business_acumen_score INTEGER"),
            ("qualitative_creativity_score", "ALTER TABLE evaluations ADD COLUMN qualitative_creativity_score INTEGER", "ALTER TABLE evaluations ADD COLUMN qualitative_creativity_score INTEGER"),
            ("quantitative_structure_score", "ALTER TABLE evaluations ADD COLUMN quantitative_structure_score INTEGER", "ALTER TABLE evaluations ADD COLUMN quantitative_structure_score INTEGER"),
            ("case_performance_score", "ALTER TABLE evaluations ADD COLUMN case_performance_score INTEGER", "ALTER TABLE evaluations ADD COLUMN case_performance_score INTEGER"),
            ("creativity_conversation_score", "ALTER TABLE evaluations ADD COLUMN creativity_conversation_score INTEGER", "ALTER TABLE evaluations ADD COLUMN creativity_conversation_score INTEGER"),
            ("recommendation_label", "ALTER TABLE evaluations ADD COLUMN recommendation_label VARCHAR(20)", "ALTER TABLE evaluations ADD COLUMN recommendation_label VARCHAR(20)"),
            ("final_round_summary", "ALTER TABLE evaluations ADD COLUMN final_round_summary TEXT", "ALTER TABLE evaluations ADD COLUMN final_round_summary TEXT"),
            ("overall_performance_overview", "ALTER TABLE evaluations ADD COLUMN overall_performance_overview TEXT", "ALTER TABLE evaluations ADD COLUMN overall_performance_overview TEXT"),
        ]

        for column_name, sqlite_ddl, postgres_ddl in evaluation_columns:
            _add_column_if_missing(
                connection,
                table_name="evaluations",
                column_name=column_name,
                sqlite_ddl=sqlite_ddl,
                postgres_ddl=postgres_ddl,
            )

        # Older evaluation rows may predate round support. Treat them as first-round reviews.
        connection.execute(text("UPDATE evaluations SET round = 'Round 1' WHERE round IS NULL OR TRIM(round) = ''"))


def init_db():
    """Initialize database tables."""
    from models import AssessmentLink, Attempt, Submission, Application  # noqa: F401
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema()
