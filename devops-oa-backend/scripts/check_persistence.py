#!/usr/bin/env python3
"""
Run persistence checks against the DevOps OA backend.
Exits 0 only if the backend reports persistent DB and storage (Postgres + Supabase).
Usage:
  python scripts/check_persistence.py [BASE_URL]
  BASE_URL defaults to https://recuitment-usa.onrender.com
"""
import json
import sys
import urllib.request
import urllib.error

DEFAULT_BASE = "https://recuitment-usa.onrender.com"


def main():
    base = (sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BASE).rstrip("/")
    api = f"{base}/api"
    errors = []

    # 1. Health: check persistence backends
    try:
        with urllib.request.urlopen(urllib.request.Request(f"{api}/health"), timeout=15) as r:
            data = json.loads(r.read().decode())
    except urllib.error.URLError as e:
        errors.append(f"Health request failed: {e}")
        return fail(errors)
    except Exception as e:
        errors.append(f"Health parse failed: {e}")
        return fail(errors)

    persistence = data.get("persistence") or {}
    db = persistence.get("database") or "unknown"
    storage = persistence.get("storage") or "unknown"

    if db != "postgres":
        errors.append(f"Database is not persistent: got '{db}' (expected 'postgres')")
    if storage != "supabase":
        errors.append(f"Storage is not persistent: got '{storage}' (expected 'supabase')")

    if errors:
        return fail(errors, data)

    # 2. Persistence endpoint: verify DB and storage are reachable
    try:
        with urllib.request.urlopen(urllib.request.Request(f"{api}/health/persistence"), timeout=15) as r:
            persist_data = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 503:
            errors.append(f"Persistence check failed (503): {e.read().decode()}")
        else:
            errors.append(f"Persistence check failed: {e.code} {e.reason}")
        return fail(errors)
    except urllib.error.URLError as e:
        errors.append(f"Persistence request failed: {e}")
        return fail(errors)
    except Exception as e:
        errors.append(f"Persistence parse failed: {e}")
        return fail(errors)

    checks = persist_data.get("checks") or {}
    if checks.get("database") != "ok":
        errors.append("Database connectivity check did not return ok")
    if storage == "supabase" and checks.get("storage") != "ok":
        errors.append("Supabase storage connectivity check did not return ok")

    if errors:
        return fail(errors, persist_data)

    print("OK – Backend is persistent")
    print(f"  database: {db}")
    print(f"  storage:  {storage}")
    print(f"  checks:   {checks}")
    return 0


def fail(errors, data=None):
    print("Persistence checks failed:", file=sys.stderr)
    for e in errors:
        print(f"  - {e}", file=sys.stderr)
    if data:
        print("  response: " + json.dumps(data, indent=2), file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    sys.exit(main())
