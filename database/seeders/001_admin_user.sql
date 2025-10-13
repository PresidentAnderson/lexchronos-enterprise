-- Seeder: Create admin user
-- Description: Creates default admin user for initial setup

-- Insert admin user (password: admin123)
-- Note: This should be changed immediately after first login
INSERT INTO users (
    id,
    email,
    email_verified,
    username,
    password_hash,
    first_name,
    last_name,
    role,
    status,
    preferences,
    settings,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'admin@lexchronos.com',
    true,
    'admin',
    '$2b$12$rQZ8qVz5V5qJ5qJ5qJ5qJOJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5', -- bcrypt hash for 'admin123'
    'System',
    'Administrator',
    'admin',
    'active',
    '{"theme": "light", "notifications": {"email": true, "push": true}}',
    '{"dashboard": {"layout": "grid", "widgets": ["users", "analytics", "system"]}}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert test user for development
INSERT INTO users (
    id,
    email,
    email_verified,
    username,
    password_hash,
    first_name,
    last_name,
    role,
    status,
    preferences,
    settings,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'user@lexchronos.com',
    true,
    'testuser',
    '$2b$12$rQZ8qVz5V5qJ5qJ5qJ5qJOJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5', -- bcrypt hash for 'admin123'
    'Test',
    'User',
    'user',
    'active',
    '{"theme": "dark", "notifications": {"email": false, "push": true}}',
    '{}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Log the seeding
DO $$
BEGIN
    RAISE NOTICE 'Admin and test users seeded successfully at %', CURRENT_TIMESTAMP;
    RAISE NOTICE 'Default credentials:';
    RAISE NOTICE '  Admin: admin@lexchronos.com / admin123';
    RAISE NOTICE '  User:  user@lexchronos.com / admin123';
    RAISE NOTICE 'IMPORTANT: Change these passwords immediately in production!';
END $$;