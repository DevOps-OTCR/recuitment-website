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

from database import engine, init_db

def main():
    print(f"Ensuring schema for {engine.url} ...")
    init_db()
    print("Done. Verified base tables and applied additive runtime schema upgrades.")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
