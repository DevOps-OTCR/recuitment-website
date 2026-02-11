#!/usr/bin/env python3
"""
One-off: check if DB has required tables and create them if missing.
Uses DATABASE_URL from environment or .env. Safe to run multiple times.

  python scripts/ensure_tables.py

For Supabase, set DATABASE_URL first:
  export DATABASE_URL='postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres'
  python scripts/ensure_tables.py
"""
import sys
import os

# Run from backend root so config/database resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine

def main():
    url = str(engine.url)
    is_sqlite = "sqlite" in url

    with engine.connect() as conn:
        if is_sqlite:
            # SQLite: check if applications table exists
            r = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='applications'"
            ))
            applications_exists = r.fetchone() is not None
        else:
            # Postgres: check public.applications
            r = conn.execute(text("""
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'applications'
            """))
            applications_exists = r.fetchone() is not None

        if not applications_exists:
            print("Table 'applications' not found. Creating all tables...")
            from database import Base
            from models import Application, AssessmentLink, Attempt, Submission, ProgressSnapshot  # noqa: F401
            Base.metadata.create_all(bind=engine)
            conn.commit()
            print("Done. Created: applications, assessment_links, attempts, submissions, assessment_progress_snapshots")
        else:
            print("Table 'applications' exists.")

        # Ensure archived_at column exists (for tables created before we added it)
        if is_sqlite:
            r = conn.execute(text("PRAGMA table_info(applications)"))
            columns = [row[1] for row in r.fetchall()]
        else:
            r = conn.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'applications'
            """))
            columns = [row[0] for row in r.fetchall()]

        if "archived_at" not in columns:
            print("Adding column 'archived_at' to applications...")
            if is_sqlite:
                conn.execute(text("ALTER TABLE applications ADD COLUMN archived_at DATETIME"))
            else:
                conn.execute(text("ALTER TABLE applications ADD COLUMN archived_at TIMESTAMP"))
            conn.commit()
            print("Done.")
        else:
            print("Column 'archived_at' already exists.")

    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
