-- Initial Database Setup for LexChronos
-- This script sets up the basic database structure and extensions

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For unaccented text search

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'trialing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_level AS ENUM ('error', 'warn', 'info', 'debug');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS trigger AS $$
BEGIN
    -- Update the updated_at timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    
    -- Log the change if audit table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            old_values,
            new_values,
            user_id,
            created_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
            COALESCE(NEW.updated_by, OLD.updated_by, current_setting('app.user_id', true)::uuid),
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create search index update function
CREATE OR REPLACE FUNCTION update_search_index() RETURNS trigger AS $$
BEGIN
    -- Update search vector if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = TG_TABLE_NAME AND column_name = 'search_vector') THEN
        NEW.search_vector = to_tsvector('english', 
            COALESCE(NEW.title, '') || ' ' || 
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.content, '')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to the application user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_user WHERE usename = 'lexchrono') THEN
        GRANT USAGE ON SCHEMA public TO lexchrono;
        GRANT CREATE ON SCHEMA public TO lexchrono;
        
        -- Grant permissions on sequences
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lexchrono;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO lexchrono;
        
        -- Grant permissions on tables
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lexchrono;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lexchrono;
        
        -- Grant permissions on functions
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO lexchrono;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO lexchrono;
    END IF;
END $$;

-- Create configuration table for runtime settings
CREATE TABLE IF NOT EXISTS app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO app_config (key, value, description, is_public) VALUES
('app_name', '"LexChronos"', 'Application name', true),
('app_version', '"1.0.0"', 'Application version', true),
('maintenance_mode', 'false', 'Maintenance mode flag', false),
('max_file_size', '10485760', 'Maximum file upload size in bytes (10MB)', false),
('password_min_length', '8', 'Minimum password length', false),
('session_timeout', '3600000', 'Session timeout in milliseconds', false),
('rate_limit_requests', '100', 'Rate limit requests per window', false),
('rate_limit_window', '900000', 'Rate limit window in milliseconds (15 minutes)', false)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);
CREATE INDEX IF NOT EXISTS idx_app_config_is_public ON app_config(is_public) WHERE is_public = true;

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at_app_config
    BEFORE UPDATE ON app_config
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Create a function to safely get config values
CREATE OR REPLACE FUNCTION get_config(config_key VARCHAR, default_value JSONB DEFAULT NULL) 
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT value INTO result FROM app_config WHERE key = config_key;
    RETURN COALESCE(result, default_value);
END;
$$ LANGUAGE plpgsql;

-- Create a function to set config values
CREATE OR REPLACE FUNCTION set_config(config_key VARCHAR, config_value JSONB, config_description TEXT DEFAULT NULL) 
RETURNS VOID AS $$
BEGIN
    INSERT INTO app_config (key, value, description)
    VALUES (config_key, config_value, config_description)
    ON CONFLICT (key) 
    DO UPDATE SET 
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, app_config.description),
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Log the successful initialization
DO $$
BEGIN
    RAISE NOTICE 'LexChronos database initialization completed successfully at %', CURRENT_TIMESTAMP;
END $$;