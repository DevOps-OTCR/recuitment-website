#!/usr/bin/env python3
"""
Verify Supabase connection: tables exist and are readable.
Works even when your network cannot resolve db.PROJECT_REF.supabase.co
by using the REST API (same host as dashboard).

Usage:
  # Option A – REST (no Postgres DNS needed; use same host as dashboard)
  export SUPABASE_URL='https://imauccpkchggjzasgsjj.supabase.co'
  export SUPABASE_KEY='your-service-role-key'
  python3 scripts/verify_supabase_connection.py

  # Option B – Direct Postgres (if your DNS resolves db.*.supabase.co)
  export DATABASE_URL='postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres?sslmode=require'
  python3 scripts/verify_supabase_connection.py

  # Option C – Connection pooler (get URI from Supabase Dashboard → Database → Connection pooling)
  export DATABASE_URL='postgresql://postgres.REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres'
  python3 scripts/verify_supabase_connection.py
"""
import os
import sys

def verify_via_rest():
    """Verify using Supabase REST API (HTTPS to project URL – no db.* DNS needed)."""
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None, "Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY)"
    try:
        import urllib.request
        req = urllib.request.Request(
            f"{url}/rest/v1/applications?select=id&limit=0",
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            if r.status in (200, 206):
                return True, None
            return False, f"HTTP {r.status}"
    except Exception as e:
        return False, str(e)


def verify_via_postgres():
    """Verify using direct Postgres connection (DATABASE_URL)."""
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from sqlalchemy import text
    from database import engine

    url = str(engine.url)
    print(f"Connecting to: {url.split('@')[1] if '@' in url else url[:60]}...")
    try:
        with engine.connect() as conn:
            print("✓ Connected to database")
            r = conn.execute(text("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'applications'
            """))
            if not r.fetchone():
                return False, "Table 'applications' NOT FOUND"
            print("✓ Table 'applications' exists")
            r = conn.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'applications'
                AND column_name = 'archived_at'
            """))
            if not r.fetchone():
                return False, "Column 'archived_at' NOT FOUND"
            print("✓ Column 'archived_at' exists")
            r = conn.execute(text("SELECT COUNT(*) FROM applications"))
            print(f"✓ Can read from applications (count: {r.fetchone()[0]})")
            for t in ["assessment_links", "attempts", "submissions"]:
                r = conn.execute(text("""
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = :t
                """), {"t": t})
                if not r.fetchone():
                    return False, f"Table '{t}' NOT FOUND"
                print(f"✓ Table '{t}' exists")
            return True, None
    except Exception as e:
        return False, str(e)


def main():
    print("Supabase connection verification\n")
    err_msg = None

    # 1. Try REST first (works when db.*.supabase.co does not resolve)
    key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if os.environ.get("SUPABASE_URL") and key:
        print("Trying REST API (SUPABASE_URL + SUPABASE_KEY)...")
        ok, err = verify_via_rest()
        if ok:
            print("✓ REST API reachable; 'applications' table exists and is readable.")
            print("\n✅ Verification passed (REST). Render can use DATABASE_URL for Postgres.")
            return 0
        if err and "resolve" not in err.lower() and "nodename" not in err.lower():
            print(f"✗ REST failed: {err}")
        else:
            err_msg = err
        print()
    else:
        print("(Set SUPABASE_URL + SUPABASE_KEY to verify via REST.)\n")

    # 2. Try Postgres (DATABASE_URL)
    if os.environ.get("DATABASE_URL") and "postgres" in os.environ.get("DATABASE_URL", "").lower():
        print("Trying Postgres (DATABASE_URL)...")
        ok, err = verify_via_postgres()
        if ok:
            print("\n✅ All checks passed. Render ↔ Supabase connection is OK.")
            return 0
        print(f"\n✗ Postgres error: {err}")
        if err and ("nodename" in err.lower() or "resolve" in err.lower() or "could not translate host" in err.lower()):
            print("\n--- Your network cannot resolve the database host (db.*.supabase.co). ---")
            print("1. Use REST verification: set SUPABASE_URL and SUPABASE_KEY, then run this script again.")
            print("2. Or use Connection pooler: Supabase Dashboard → Project Settings → Database")
            print("   → Connection string → 'Connection pooling' → copy URI and set DATABASE_URL to that.")
            print("   Pooler host (e.g. aws-0-REGION.pooler.supabase.com) may resolve on your network.")
            print("3. Or run this script from a network where db.*.supabase.co resolves (e.g. mobile hotspot).")
    else:
        print("No DATABASE_URL set. Set DATABASE_URL and/or SUPABASE_URL+SUPABASE_KEY and re-run.")

    return 1


if __name__ == "__main__":
    sys.exit(main())
