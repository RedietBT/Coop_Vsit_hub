-- =============================================================================
-- Migration V3: Core Visit Hub Tables (Organizations, Visits & Customer Feedback)
-- Cooperative Bank of Oromia (CoopBank DxValley) - Visit Hub
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATIONS TABLE (Guest & Partner Organizations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL, -- e.g. Strategic Partners, Regulators, Enterprise Customers, Fintech
    market_country VARCHAR(100) DEFAULT 'Ethiopia' NOT NULL,
    relationship_score INT DEFAULT 50 NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE organizations IS 'Guest organizations visiting CoopBank DxValley';

-- -----------------------------------------------------------------------------
-- 2. VISITS TABLE (Executive Visit Requests & Lifecycle Management)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_code VARCHAR(30) NOT NULL UNIQUE, -- Human-readable identifier e.g., VIS-2026-0001
    title VARCHAR(200) NOT NULL,
    requesting_department VARCHAR(100) NOT NULL,
    visit_type VARCHAR(50) DEFAULT 'EXTERNAL' NOT NULL, -- INTERNAL, EXTERNAL, VIP_DELEGATION
    visit_objective TEXT NOT NULL,
    expected_outcome TEXT,
    priority_level VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
    status VARCHAR(30) DEFAULT 'SUBMITTED' NOT NULL, -- DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, SCHEDULED, IN_PROGRESS, COMPLETED, REJECTED, CANCELLED
    opportunity_value NUMERIC(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
    presentation_theme VARCHAR(150),
    sensitive_topics TEXT,
    
    -- Facility & Conflict Management
    location_room VARCHAR(100), -- e.g. DxValley Executive Boardroom, Main Conference Hall
    visitor_count INT DEFAULT 1 NOT NULL, -- Total delegation size
    visitor_badge_number VARCHAR(50), -- Assigned during front desk security check-in

    -- Approver / Reviewer Feedback
    decision_notes TEXT, -- Notes or justification provided upon Approval or Rejection
    
    -- Guest Classification (Organization vs Individual Person)
    guest_category VARCHAR(30) DEFAULT 'ORGANIZATION' NOT NULL, -- ORGANIZATION or INDIVIDUAL
    guest_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL, -- Nullable if individual guest
    
    -- Individual Guest Details (When guest_category = 'INDIVIDUAL' or primary guest contact)
    individual_guest_first_name VARCHAR(50),
    individual_guest_middle_name VARCHAR(50),
    individual_guest_last_name VARCHAR(50),
    individual_guest_email VARCHAR(100),
    individual_guest_phone VARCHAR(30),
    individual_guest_title VARCHAR(100), -- e.g., Senior Consultant, Envoy, Auditor, VIP Visitor
    individual_guest_id_number VARCHAR(50), -- National ID / Passport / Driver License for Security Desk check-in

    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    scheduled_end_time TIMESTAMP WITH TIME ZONE,
    actual_check_in_time TIMESTAMP WITH TIME ZONE,
    actual_check_out_time TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE visits IS 'Master executive visit requests and lifecycle tracking';

-- -----------------------------------------------------------------------------
-- 3. VISIT_FEEDBACKS TABLE (Customer & Visitor Post-Visit Surveys)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visit_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL UNIQUE REFERENCES visits(id) ON DELETE CASCADE,
    survey_token VARCHAR(255) NOT NULL UNIQUE, -- Single-use token sent via MailHog email link
    token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_submitted BOOLEAN DEFAULT FALSE NOT NULL,
    
    hospitality_rating INT CHECK (hospitality_rating BETWEEN 1 AND 5),
    facility_rating INT CHECK (facility_rating BETWEEN 1 AND 5),
    objective_rating INT CHECK (objective_rating BETWEEN 1 AND 5),
    nps_score INT CHECK (nps_score BETWEEN 0 AND 10),
    comments TEXT,
    
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE visit_feedbacks IS 'Post-visit visitor survey responses and satisfaction analytics';

-- -----------------------------------------------------------------------------
-- INDEXES FOR VISITS & FEEDBACK PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_visits_visit_code ON visits(visit_code);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_priority ON visits(priority_level);
CREATE INDEX IF NOT EXISTS idx_visits_requester ON visits(requester_id);
CREATE INDEX IF NOT EXISTS idx_visits_guest_org ON visits(guest_organization_id);
CREATE INDEX IF NOT EXISTS idx_visits_start_time ON visits(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_visit_feedbacks_token ON visit_feedbacks(survey_token);
