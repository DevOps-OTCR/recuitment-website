# DevOps OA Backend

FastAPI backend for the OTCR DevOps online assessment (link generation, applications, submissions, code execution).

## Architecture (production)

- **Compute:** Python runs on a server (e.g. [Render](https://render.com)) the same way as any standard web app. No serverless or edge; one long-lived process.
- **Data:** All persistent data lives in **Supabase**:
  - **Postgres** – applications, assessment links, attempts, submissions (use Supabase’s Transaction pooler URL on Render). Supabase pooled connections do **not** permit PREPARE; the app disables server-side prepared statements when using the pooler.
  - **Storage** – resume PDFs in a private bucket.

So the app is “fully on Supabase” for data; the server only runs the Python API and talks to Supabase for DB and files. Local development can use SQLite and optional local file storage.

## Setup

1. **Supabase:** Create a project, run the schema (`scripts/supabase_schema.sql` or `scripts/ensure_tables.py` with `DATABASE_URL`). Create a private Storage bucket named `resumes` (or let the app create it on first run). Use the **Transaction pooler** connection string for Render.
2. **Environment (e.g. Render):** Set `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY` (Service Role), `ADMIN_PASSWORD`, `FRONTEND_BASE_URL`, and optionally `CODE_EXEC_API_KEY`, `ALLOWED_ORIGINS`. Render can mount a secret file at `/etc/secrets/.env`; the app loads it on startup.
3. **Run:** `uvicorn main:app --host 0.0.0.0 --port 8000`

If `DATABASE_URL` points to Supabase Postgres, `SUPABASE_URL` and `SUPABASE_KEY` are **required** (startup will fail otherwise). For local dev with SQLite, Supabase is optional.
