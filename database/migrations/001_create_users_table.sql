-- Migration: Create users table
-- Created: $(date '+%Y-%m-%d %H:%M:%S')
-- Description: Create the users table with authentication and profile information

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255), -- NULL for OAuth-only users
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200) GENERATED ALWAYS AS (
        TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
    ) STORED,
    avatar_url TEXT,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT false,
    date_of_birth DATE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'pending',
    
    -- Security fields
    password_changed_at TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    backup_codes TEXT[], -- Encrypted backup codes
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- OAuth information
    oauth_providers JSONB DEFAULT '[]', -- Array of connected providers
    
    -- Subscription information
    subscription_id VARCHAR(255), -- Stripe subscription ID
    subscription_status subscription_status,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    trial_ends_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    
    -- Search
    search_vector tsvector,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_subscription_status ON users(subscription_status) WHERE subscription_status IS NOT NULL;
CREATE INDEX idx_users_subscription_expires ON users(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;
CREATE INDEX idx_users_last_login ON users(last_login_at);
CREATE INDEX idx_users_search ON users USING gin(search_vector);
CREATE INDEX idx_users_preferences ON users USING gin(preferences);
CREATE INDEX idx_users_settings ON users USING gin(settings);
CREATE INDEX idx_users_oauth_providers ON users USING gin(oauth_providers);
CREATE INDEX idx_users_tags ON users USING gin(tags);
CREATE INDEX idx_users_metadata ON users USING gin(metadata);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Create partial indexes for active users
CREATE INDEX idx_users_active ON users(id, email, role) WHERE status = 'active' AND deleted_at IS NULL;

-- Create composite indexes for common queries
CREATE INDEX idx_users_email_status ON users(email, status);
CREATE INDEX idx_users_role_status ON users(role, status);

-- Create triggers
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_search_index_users
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_search_index();

-- Create audit trigger
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(user_id UUID, permission VARCHAR) 
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
    is_active BOOLEAN;
BEGIN
    SELECT role, (status = 'active' AND deleted_at IS NULL) 
    INTO user_role_val, is_active
    FROM users 
    WHERE id = user_id;
    
    -- User must be active
    IF NOT is_active THEN
        RETURN FALSE;
    END IF;
    
    -- Admin can do everything
    IF user_role_val = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Specific permission checks
    CASE permission
        WHEN 'read_users' THEN
            RETURN user_role_val IN ('admin', 'moderator');
        WHEN 'write_users' THEN
            RETURN user_role_val = 'admin';
        WHEN 'manage_users' THEN
            RETURN user_role_val = 'admin';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user by email or username
CREATE OR REPLACE FUNCTION get_user_by_login(login_identifier VARCHAR) 
RETURNS users AS $$
DECLARE
    user_record users;
BEGIN
    -- Try email first, then username
    SELECT * INTO user_record FROM users 
    WHERE email = login_identifier 
       OR username = login_identifier
    AND status != 'suspended' 
    AND deleted_at IS NULL
    LIMIT 1;
    
    RETURN user_record;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user last login
CREATE OR REPLACE FUNCTION update_user_last_login(user_id UUID, ip_address INET DEFAULT NULL) 
RETURNS VOID AS $$
BEGIN
    UPDATE users 
    SET 
        last_login_at = CURRENT_TIMESTAMP,
        last_login_ip = COALESCE(ip_address, last_login_ip),
        failed_login_attempts = 0,
        locked_until = NULL
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login(user_id UUID) 
RETURNS VOID AS $$
DECLARE
    max_attempts INTEGER := 5;
    lockout_duration INTERVAL := '30 minutes';
BEGIN
    UPDATE users 
    SET 
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE 
            WHEN failed_login_attempts + 1 >= max_attempts 
            THEN CURRENT_TIMESTAMP + lockout_duration
            ELSE locked_until
        END
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to safely delete user (soft delete)
CREATE OR REPLACE FUNCTION soft_delete_user(user_id UUID, deleted_by_id UUID DEFAULT NULL) 
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE users 
    SET 
        status = 'inactive',
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = deleted_by_id,
        -- Clear sensitive information
        password_hash = NULL,
        two_factor_secret = NULL,
        backup_codes = NULL,
        -- Anonymize email but keep for referential integrity
        email = 'deleted_' || id::text || '@deleted.local'
    WHERE id = user_id 
    AND deleted_at IS NULL;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- Create constraints
ALTER TABLE users ADD CONSTRAINT users_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT users_username_format 
    CHECK (username IS NULL OR (username ~* '^[A-Za-z0-9_-]{3,50}$'));

ALTER TABLE users ADD CONSTRAINT users_phone_format 
    CHECK (phone IS NULL OR (phone ~* '^\+?[1-9]\d{1,14}$'));

ALTER TABLE users ADD CONSTRAINT users_password_required 
    CHECK ((password_hash IS NOT NULL) OR (oauth_providers::jsonb != '[]'::jsonb));

ALTER TABLE users ADD CONSTRAINT users_trial_ends_future 
    CHECK (trial_ends_at IS NULL OR trial_ends_at > created_at);

ALTER TABLE users ADD CONSTRAINT users_subscription_expires_future 
    CHECK (subscription_expires_at IS NULL OR subscription_expires_at > created_at);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON users TO lexchrono;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO lexchrono;