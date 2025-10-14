-- LexChronos Database Deployment Script
-- Run this in your Supabase SQL editor to set up the complete database

-- Step 1: Create the schema and tables
\i supabase/migrations/001_initial_schema.sql

-- Step 2: Set up Row Level Security policies
\i supabase/migrations/002_row_level_security.sql

-- Step 3: Configure triggers and functions
\i supabase/migrations/003_triggers_functions.sql

-- Step 4: Insert sample data
\i supabase/seed.sql

-- Verify the deployment
SELECT 'Database deployment completed successfully!' as status;

-- Show table counts
SELECT 
    'organizations' as table_name, COUNT(*) as records FROM organizations
UNION ALL SELECT 'practice_areas', COUNT(*) FROM practice_areas
UNION ALL SELECT 'clients', COUNT(*) FROM clients  
UNION ALL SELECT 'cases', COUNT(*) FROM cases
UNION ALL SELECT 'timeline_events', COUNT(*) FROM timeline_events
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'conflict_entities', COUNT(*) FROM conflict_entities
UNION ALL SELECT 'trust_accounts', COUNT(*) FROM trust_accounts
UNION ALL SELECT 'trust_transactions', COUNT(*) FROM trust_transactions
UNION ALL SELECT 'time_entries', COUNT(*) FROM time_entries
ORDER BY table_name;