-- =============================================================================
-- V11: Add is_pinned column to visit_feedbacks table
-- This supports the Admin "Pin to Executive Cockpit" feature where admins
-- can pin a customer comment to the Executive Analytics Dashboard.
-- =============================================================================

ALTER TABLE visit_feedbacks
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN visit_feedbacks.is_pinned IS 'Admin-pinned flag; pinned comments are displayed on the Executive Analytics Cockpit widget.';
