-- =============================================================================
-- Migration V5: Master Data Tables (Departments, Categories, Meeting Rooms) & Role Cleanup
-- Cooperative Bank of Oromia - Visit Hub
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DEPARTMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE departments IS 'Internal CoopBank departments requesting or hosting delegations';

-- -----------------------------------------------------------------------------
-- 2. PARTNERSHIP CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partnership_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE partnership_categories IS 'Partner organization classification categories';

-- -----------------------------------------------------------------------------
-- 3. MEETING ROOMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL UNIQUE,
    floor_location VARCHAR(100),
    capacity INT DEFAULT 10 NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE meeting_rooms IS 'CoopBank meeting rooms and executive spaces';

-- -----------------------------------------------------------------------------
-- 4. CLEAN UP UNUSED ROLES (REMOVE ROLE_BUSINESS_SPONSOR)
-- -----------------------------------------------------------------------------
-- Reassign any users with ROLE_BUSINESS_SPONSOR to ROLE_APPROVER
DO $$
DECLARE
    sponsor_role_id BIGINT;
    approver_role_id BIGINT;
BEGIN
    SELECT id INTO sponsor_role_id FROM roles WHERE name = 'ROLE_BUSINESS_SPONSOR';
    SELECT id INTO approver_role_id FROM roles WHERE name = 'ROLE_APPROVER';

    IF sponsor_role_id IS NOT NULL AND approver_role_id IS NOT NULL THEN
        -- Reassign user_roles
        UPDATE user_roles SET role_id = approver_role_id WHERE role_id = sponsor_role_id;
        -- Delete the legacy role
        DELETE FROM roles WHERE id = sponsor_role_id;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. SEED INITIAL MASTER DATA
-- -----------------------------------------------------------------------------

-- Seed Departments
INSERT INTO departments (name, code, description) VALUES
    ('Digital Banking & Payments', 'DIG_BANK', 'Omnichannel digital payments, Open Banking APIs, and fintech integrations'),
    ('Corporate Banking', 'CORP_BANK', 'Enterprise relationships, corporate payroll, and institutional peering'),
    ('FinTech PE & Open Banking', 'FINTECH_PE', 'Private equity, venture syndicates, and Open Banking sandbox access'),
    ('Retail Banking & MSME', 'RETAIL_BANK', 'Retail customer branch network and microfinance partnerships'),
    ('Executive Office', 'EXEC_OFFICE', 'Board of Directors and C-Suite executive delegations'),
    ('Operations & Front Desk', 'OPS_FRONT', 'Central operations, facility logistics, and guest reception'),
    ('Information Security & Risk', 'INFO_SEC', 'Cybersecurity compliance, audit, and risk intelligence')
ON CONFLICT (name) DO NOTHING;

-- Seed Partnership Categories
INSERT INTO partnership_categories (name, description) VALUES
    ('Strategic Partner', 'High-priority institutional and core banking alliance partners'),
    ('FinTech Peer', 'Digital payment gateways, wallets, and technology peers'),
    ('Regulator / Government Body', 'National Bank of Ethiopia, regulatory bodies, and ministries'),
    ('Commercial Enterprise', 'Corporate clients, multinational merchants, and enterprises'),
    ('NGO / Development Agency', 'International financial institutions and developmental programs')
ON CONFLICT (name) DO NOTHING;

-- Seed Meeting Rooms
INSERT INTO meeting_rooms (name, floor_location, capacity, description) VALUES
    ('Executive Boardroom (4th Floor)', '4th Floor, Executive Wing', 25, 'Flagship executive presentation boardroom with dual video conferencing and digital smart board'),
    ('FinTech Innovation Room A', '3rd Floor, FinTech Wing', 12, 'Agile collaborative workshop room with high-speed API peering display terminals'),
    ('Strategic Peering Room B', '3rd Floor, FinTech Wing', 10, 'Dedicated conference room for bilateral commercial negotiations'),
    ('CoopBank HQ VIP Lounge (Ground Floor)', 'Ground Floor, Main Reception', 15, 'Executive hospitality reception lounge for VIP dignitaries and keynote delegations')
ON CONFLICT (name) DO NOTHING;
