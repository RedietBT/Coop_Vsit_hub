-- =============================================================================
-- Migration V4: Staff In-App & Email Notifications Table
-- Cooperative Bank of Oromia (CoopBank DxValley) - Visit Hub
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- VISIT_REQUESTED, VISIT_APPROVED, VISIT_REJECTED, VISITOR_CHECKED_IN, VISITOR_CHECKED_OUT, FEEDBACK_SUBMITTED, SYSTEM_ALERT
    reference_id UUID,
    reference_code VARCHAR(50), -- e.g. VIS-2026-0001
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE notifications IS 'In-app and email alert notifications dispatched to bank staff';

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
