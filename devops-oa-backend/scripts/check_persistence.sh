#!/bin/sh
# Run persistence checks using curl. Usage: ./check_persistence.sh [BASE_URL]
set -e
BASE="${1:-https://recuitment-usa.onrender.com}"
API="${BASE%/}/api"

echo "Checking $API ..."

# Health: must include persistence.database and persistence.storage
HEALTH=$(curl -sS --max-time 15 "$API/health")
if ! echo "$HEALTH" | grep -q '"persistence"'; then
  echo "FAIL: /health does not report persistence (deploy latest backend first)" >&2
  echo "$HEALTH" | head -5 >&2
  exit 1
fi
DB=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin).get('persistence',{}); print(d.get('database',''))" 2>/dev/null || echo "unknown")
STORE=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin).get('persistence',{}); print(d.get('storage',''))" 2>/dev/null || echo "unknown")

if [ "$DB" != "postgres" ]; then
  echo "FAIL: database is '$DB' (expected postgres)" >&2
  exit 1
fi
if [ "$STORE" != "supabase" ]; then
  echo "FAIL: storage is '$STORE' (expected supabase)" >&2
  exit 1
fi

# Persistence endpoint: must return 200
CODE=$(curl -sS -o /tmp/persist.json -w "%{http_code}" --max-time 15 "$API/health/persistence")
if [ "$CODE" != "200" ]; then
  echo "FAIL: /health/persistence returned $CODE" >&2
  exit 1
fi

echo "OK – Backend is persistent (database=postgres, storage=supabase)"
echo "  checks: $(cat /tmp/persist.json 2>/dev/null | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin).get('checks',{})))" 2>/dev/null || echo '{}')"
