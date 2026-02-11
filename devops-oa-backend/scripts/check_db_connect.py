#!/usr/bin/env python3
"""
Check that the database module loads and can connect (e.g. before deploying to Render).
Exits 0 if OK, 1 on error. Use the same DATABASE_URL you use in production (pooler URL).

Usage (from repo root or from devops-oa-backend):
  export DATABASE_URL='postgresql://postgres.REF:PASSWORD@...pooler.supabase.com:6543/postgres'
  python3 devops-oa-backend/scripts/check_db_connect.py
  # or from devops-oa-backend:
  python3 scripts/check_db_connect.py
"""
import os
import sys

# Run from devops-oa-backend so config/database resolve
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

def main():
    if not os.environ.get("DATABASE_URL") or "postgres" not in os.environ.get("DATABASE_URL", "").lower():
        print("Set DATABASE_URL (Postgres) to check connection.", file=sys.stderr)
        return 1
    try:
        from sqlalchemy import text
        from database import engine, _db_url
        # Redact password in output
        u = _db_url
        if "@" in u and ":" in u:
            parts = u.split("@", 1)
            u = "***@" + parts[1]
        print("Database URL (redacted):", u[:60] + "..." if len(u) > 60 else u)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("OK: connected.")
        return 0
    except Exception as e:
        print("FAIL:", e, file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
