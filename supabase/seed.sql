-- LexChronos Initial Seed Data
-- Sample data for demonstration and development

-- Insert demo organization
INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status, settings) VALUES 
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Anderson Legal Group', 'anderson-legal', 'professional', 'active', 
     '{"time_zone": "America/New_York", "currency": "USD", "date_format": "MM/DD/YYYY"}');

-- Insert practice areas
INSERT INTO practice_areas (id, organization_id, name, description, hourly_rate, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Corporate Law', 'Business formation, contracts, and compliance', 450.00, true),
    ('550e8400-e29b-41d4-a716-446655440002', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Real Estate Law', 'Property transactions, leases, and zoning', 375.00, true),
    ('550e8400-e29b-41d4-a716-446655440003', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Employment Law', 'Workplace disputes and employment contracts', 400.00, true),
    ('550e8400-e29b-41d4-a716-446655440004', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Intellectual Property', 'Patents, trademarks, and copyright protection', 500.00, true),
    ('550e8400-e29b-41d4-a716-446655440005', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Litigation', 'Civil and commercial litigation', 425.00, true);

-- Insert sample clients
INSERT INTO clients (id, organization_id, client_number, type, first_name, last_name, company_name, email, phone, address, billing_address, contact_preferences, notes, status, created_by) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'CLI-001', 'individual', 'John', 'Smith', NULL, 'john.smith@email.com', '(555) 123-4567', 
     '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}', 
     '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}', 
     '{"preferred_method": "email", "frequency": "weekly"}', 'Long-time client, prefers morning meetings', 'active', NULL),
    
    ('650e8400-e29b-41d4-a716-446655440002', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'CLI-002', 'corporate', NULL, NULL, 'TechStart Solutions Inc.', 'legal@techstart.com', '(555) 987-6543', 
     '{"street": "456 Innovation Blvd", "city": "San Francisco", "state": "CA", "zip": "94107"}', 
     '{"street": "456 Innovation Blvd", "city": "San Francisco", "state": "CA", "zip": "94107"}', 
     '{"preferred_method": "email", "frequency": "bi_weekly"}', 'Startup client, rapid growth phase', 'active', NULL),
    
    ('650e8400-e29b-41d4-a716-446655440003', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'CLI-003', 'individual', 'Sarah', 'Johnson', NULL, 'sarah.johnson@email.com', '(555) 456-7890', 
     '{"street": "789 Oak Avenue", "city": "Chicago", "state": "IL", "zip": "60601"}', 
     '{"street": "789 Oak Avenue", "city": "Chicago", "state": "IL", "zip": "60601"}', 
     '{"preferred_method": "phone", "frequency": "monthly"}', 'Real estate investor, multiple properties', 'active', NULL);

-- Insert sample cases
INSERT INTO cases (id, organization_id, case_number, title, description, client_id, practice_area_id, assigned_attorney, status, priority, court_name, court_case_number, opposing_party, opposing_counsel, date_opened, estimated_hours, budget_amount, notes, metadata, created_by) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'CASE-2024-001', 'Smith v. ABC Corp Contract Dispute', 'Breach of contract claim involving service agreement with ABC Corporation', 
     '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NULL, 'active', 'high', 
     'New York Supreme Court', 'SC-2024-1234', 'ABC Corporation', 'Johnson & Associates', '2024-01-15', 50, 22500.00, 
     'Client seeks $150K in damages for alleged breach of service contract', '{"case_value": 150000, "settlement_target": 120000}', NULL),
    
    ('750e8400-e29b-41d4-a716-446655440002', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'CASE-2024-002', 'TechStart IP Portfolio Development', 'Comprehensive intellectual property strategy and trademark registration for startup', 
     '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', NULL, 'active', 'medium', 
     NULL, NULL, NULL, NULL, '2024-02-01', 75, 37500.00, 
     'Multi-phase project covering trademark, copyright, and trade secret protection', '{"trademarks": 5, "copyrights": 12, "phase": 1}', NULL),
    
    ('750e8400-e29b-41d4-a716-446655440003', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'CASE-2024-003', 'Johnson Property Acquisition', 'Due diligence and closing for commercial real estate purchase', 
     '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', NULL, 'active', 'medium', 
     NULL, NULL, NULL, NULL, '2024-02-10', 25, 9375.00, 
     'Commercial property purchase - due diligence phase', '{"property_value": 2500000, "closing_date": "2024-03-15"}', NULL);

-- Insert sample timeline events
INSERT INTO timeline_events (id, organization_id, case_id, title, description, event_type, event_date, location, attendees, is_milestone, is_deadline, reminder_settings, metadata, created_by) VALUES
    ('850e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '750e8400-e29b-41d4-a716-446655440001', 
     'Initial Client Consultation', 'First meeting with client to discuss case details and strategy', 'meeting', 
     '2024-01-15 10:00:00-05', 'Conference Room A', '["John Smith", "Attorney"]', true, false, 
     '{"reminders": [{"time": "1_day_before", "method": "email"}]}', '{"meeting_type": "initial_consultation"}', NULL),
    
    ('850e8400-e29b-41d4-a716-446655440002', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '750e8400-e29b-41d4-a716-446655440001', 
     'Discovery Deadline', 'Deadline for completing all discovery requests', 'deadline', 
     '2024-04-15 17:00:00-05', NULL, NULL, false, true, 
     '{"reminders": [{"time": "2_weeks_before", "method": "email"}, {"time": "1_week_before", "method": "system"}]}', '{"deadline_type": "discovery"}', NULL),
    
    ('850e8400-e29b-41d4-a716-446655440003', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '750e8400-e29b-41d4-a716-446655440002', 
     'Trademark Search Completion', 'Completed comprehensive trademark search for all proposed marks', 'milestone', 
     '2024-02-15 12:00:00-05', NULL, NULL, true, false, '{}', '{"search_results": "available", "marks_cleared": 5}', NULL);

-- Insert sample tasks
INSERT INTO tasks (id, organization_id, case_id, assigned_to, title, description, status, priority, due_date, estimated_hours, metadata, created_by) VALUES
    ('950e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '750e8400-e29b-41d4-a716-446655440001', 
     NULL, 'Draft Initial Complaint', 'Prepare and draft the initial complaint document for filing', 'pending', 'high', 
     '2024-01-25 17:00:00-05', 8, '{"document_type": "complaint", "estimated_pages": 15}', NULL),
    
    ('950e8400-e29b-41d4-a716-446655440002', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '750e8400-e29b-41d4-a716-446655440001', 
     NULL, 'Review Discovery Documents', 'Review and analyze documents received from opposing party', 'pending', 'medium', 
     '2024-02-15 17:00:00-05', 12, '{"document_count": 45, "priority_docs": 8}', NULL),
    
    ('950e8400-e29b-41d4-a716-446655440003', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '750e8400-e29b-41d4-a716-446655440002', 
     NULL, 'File Trademark Applications', 'Submit trademark applications to USPTO for approved marks', 'in_progress', 'high', 
     '2024-02-20 17:00:00-05', 6, '{"applications": 3, "filing_fees": 1200}', NULL);

-- Insert sample conflict entities
INSERT INTO conflict_entities (id, organization_id, name, entity_type, aliases, relationships, notes, created_by) VALUES
    ('a50e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'ABC Corporation', 'company', 
     '["ABC Corp", "American Business Company"]', 
     '[{"type": "subsidiary", "entity": "ABC Holdings Inc"}, {"type": "competitor", "entity": "XYZ Corp"}]', 
     'Major corporation in technology sector, multiple subsidiaries', NULL),
    
    ('a50e8400-e29b-41d4-a716-446655440002', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Robert Johnson', 'person', 
     '["Bob Johnson", "R. Johnson"]', 
     '[{"type": "spouse", "entity": "Mary Johnson"}, {"type": "business_partner", "entity": "Johnson & Associates"}]', 
     'Prominent attorney, potential conflicts in litigation matters', NULL);

-- Insert sample trust account
INSERT INTO trust_accounts (id, organization_id, client_id, account_name, account_number, balance, status, created_by) VALUES
    ('b50e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '650e8400-e29b-41d4-a716-446655440001', 
     'Smith Client Trust Account', 'TRUST-001-SMITH', 5000.00, 'active', NULL);

-- Insert sample trust transactions
INSERT INTO trust_transactions (id, organization_id, trust_account_id, transaction_type, amount, description, reference_number, transaction_date, balance_after, metadata, created_by) VALUES
    ('c50e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'b50e8400-e29b-41d4-a716-446655440001', 
     'deposit', 5000.00, 'Initial retainer deposit for Case CASE-2024-001', 'DEP-001-2024', '2024-01-15', 5000.00, 
     '{"payment_method": "check", "check_number": "1234"}', NULL);

-- Insert sample time entries
INSERT INTO time_entries (id, organization_id, case_id, user_id, description, hours, rate, date_worked, is_billable, is_billed, activity_type, metadata, created_at) VALUES
    ('d50e8400-e29b-41d4-a716-446655440001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '750e8400-e29b-41d4-a716-446655440001', 
     NULL, 'Initial client consultation and case assessment', 2.50, 450.00, '2024-01-15', true, false, 'consultation', 
     '{"meeting_type": "initial", "client_satisfaction": "high"}', NOW()),
    
    ('d50e8400-e29b-41d4-a716-446655440002', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '750e8400-e29b-41d4-a716-446655440001', 
     NULL, 'Legal research on contract law precedents', 4.00, 450.00, '2024-01-16', true, false, 'research', 
     '{"research_topics": ["breach_of_contract", "damages", "precedents"]}', NOW()),
    
    ('d50e8400-e29b-41d4-a716-446655440003', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', '750e8400-e29b-41d4-a716-446655440002', 
     NULL, 'Trademark search and analysis', 6.00, 500.00, '2024-02-05', true, false, 'research', 
     '{"search_databases": ["USPTO", "common_law", "international"]}', NOW());

-- Update sequences to avoid conflicts
SELECT setval('organizations_id_seq', 1000);
SELECT setval('user_profiles_id_seq', 1000);
SELECT setval('clients_id_seq', 1000);
SELECT setval('practice_areas_id_seq', 1000);
SELECT setval('cases_id_seq', 1000);
SELECT setval('documents_id_seq', 1000);
SELECT setval('timeline_events_id_seq', 1000);
SELECT setval('time_entries_id_seq', 1000);
SELECT setval('invoices_id_seq', 1000);
SELECT setval('tasks_id_seq', 1000);
SELECT setval('conflict_entities_id_seq', 1000);
SELECT setval('trust_accounts_id_seq', 1000);
SELECT setval('trust_transactions_id_seq', 1000);
SELECT setval('notifications_id_seq', 1000);