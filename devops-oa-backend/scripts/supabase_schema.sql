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

-- 3. evaluations (FK to applications)
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications (id),
    interviewer_name VARCHAR(100) NOT NULL,
    round VARCHAR(50),
    interviewee_name VARCHAR(255),
    interviewee_gender VARCHAR(20),
    interviewer_role VARCHAR(20),
    culture_fit_score INTEGER,
    technical_score INTEGER,
    communication_score INTEGER,
    leadership_score INTEGER,
    interest_in_otcr_score INTEGER,
    behavioral_performance_score INTEGER,
    business_acumen_score INTEGER,
    qualitative_creativity_score INTEGER,
    quantitative_structure_score INTEGER,
    case_performance_score INTEGER,
    creativity_conversation_score INTEGER,
    recommendation VARCHAR(20) NOT NULL DEFAULT 'MAYBE',
    recommendation_label VARCHAR(20),
    comments TEXT,
    final_round_summary TEXT,
    overall_performance_overview TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_evaluations_application_id ON evaluations (application_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'interviewee_name'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN interviewee_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'interviewee_gender'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN interviewee_gender VARCHAR(20);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'interviewer_role'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN interviewer_role VARCHAR(20);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'leadership_score'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN leadership_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'interest_in_otcr_score'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN interest_in_otcr_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'behavioral_performance_score'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN behavioral_performance_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'business_acumen_score'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN business_acumen_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'qualitative_creativity_score'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN qualitative_creativity_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'quantitative_structure_score'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN quantitative_structure_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'case_performance_score'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN case_performance_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'creativity_conversation_score'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN creativity_conversation_score INTEGER;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'recommendation_label'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN recommendation_label VARCHAR(20);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'final_round_summary'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN final_round_summary TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'evaluations' AND column_name = 'overall_performance_overview'
    ) THEN
        ALTER TABLE evaluations ADD COLUMN overall_performance_overview TEXT;
    END IF;
END $$;

-- 4. attempts (FK to assessment_links)
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

-- 5. submissions (FK to attempts)
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

-- 6. assessment_progress_snapshots (FK to attempts) - progress every 5 min during assessment
CREATE TABLE IF NOT EXISTS assessment_progress_snapshots (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER NOT NULL REFERENCES attempts (id) ON DELETE CASCADE,
    snapshot_at TIMESTAMP DEFAULT NOW() NOT NULL,
    sections_completed JSONB DEFAULT '[]',
    current_section VARCHAR(50),
    elapsed_seconds INTEGER NOT NULL,
    progress_detail JSONB
);
CREATE INDEX IF NOT EXISTS ix_assessment_progress_snapshots_attempt_id ON assessment_progress_snapshots (attempt_id);
-- Add progress_detail if table already existed without it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'assessment_progress_snapshots' AND column_name = 'progress_detail'
    ) THEN
        ALTER TABLE assessment_progress_snapshots ADD COLUMN progress_detail JSONB;
    END IF;
END $$;
