-- =============================================================================
-- Migration V13: Add Director Visit Review Fields
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================

ALTER TABLE visits
    ADD COLUMN IF NOT EXISTS director_rating INT NULL,
    ADD COLUMN IF NOT EXISTS director_outcome VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS director_review_notes TEXT NULL,
    ADD COLUMN IF NOT EXISTS director_reviewed_at TIMESTAMP WITH TIME ZONE NULL,
    ADD COLUMN IF NOT EXISTS director_reviewer_id UUID NULL REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_visits_director_reviewed_at ON visits(director_reviewed_at);
