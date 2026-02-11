-- Run this in Supabase SQL Editor if applications table does not exist.
-- Creates tables in dependency order. Safe to run once (uses IF NOT EXISTS where possible).

-- 1. assessment_links (no FK deps)
CREATE TABLE IF NOT EXISTS assessment_links (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(255),
    label VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_assessment_links_token ON assessment_links (token);
CREATE INDEX IF NOT EXISTS ix_assessment_links_email ON assessment_links (email);

-- 2. applications (FK to assessment_links)
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    interest VARCHAR(500),
    resume_filename VARCHAR(255),
    resume_path VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    reviewed_at TIMESTAMP,
    notes TEXT,
    archived_at TIMESTAMP,
    assessment_link_id INTEGER REFERENCES assessment_links (id)
);
CREATE INDEX IF NOT EXISTS ix_applications_email ON applications (email);
CREATE INDEX IF NOT EXISTS ix_applications_assessment_link_id ON applications (assessment_link_id);

-- 3. attempts (FK to assessment_links)
CREATE TABLE IF NOT EXISTS attempts (
    id SERIAL PRIMARY KEY,
    link_id INTEGER NOT NULL REFERENCES assessment_links (id),
    started_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_activity_at TIMESTAMP DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP,
    sections_completed JSONB DEFAULT '[]',
    focus_loss_events INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    integrity_notes VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS ix_attempts_link_id ON attempts (link_id);

-- 4. submissions (FK to attempts)
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES attempts (id),
    section VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    coding_result JSONB,
    notes VARCHAR(500),
    submitted_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_submissions_attempt_id ON submissions (attempt_id);

-- 5. assessment_progress_snapshots (FK to attempts) - progress every 5 min during assessment
CREATE TABLE IF NOT EXISTS assessment_progress_snapshots (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES attempts (id) ON DELETE CASCADE,
    snapshot_at TIMESTAMP DEFAULT NOW() NOT NULL,
    sections_completed JSONB DEFAULT '[]',
    current_section VARCHAR(50),
    elapsed_seconds INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_assessment_progress_snapshots_attempt_id ON assessment_progress_snapshots (attempt_id);
