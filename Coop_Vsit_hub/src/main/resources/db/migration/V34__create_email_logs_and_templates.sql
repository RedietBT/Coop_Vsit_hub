-- Log of every guest email attempt (shown in the admin "Email Log" tab)
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(50),
    room_name VARCHAR(120),
    meeting_title VARCHAR(255),
    recipient_name VARCHAR(150),
    recipient_email VARCHAR(200) NOT NULL,
    email_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    triggered_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_booking ON email_logs(booking_code);

-- Admin-editable email content. A row only overrides the fields that are not blank;
-- everything else falls back to the built-in default text.
CREATE TABLE IF NOT EXISTS email_templates (
    template_key VARCHAR(40) PRIMARY KEY,
    subject TEXT,
    headline TEXT,
    intro TEXT,
    footer_note TEXT,
    signature TEXT,
    logo_url TEXT,
    accent_color VARCHAR(20),
    updated_by VARCHAR(150),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
