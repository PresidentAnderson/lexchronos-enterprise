-- Row Level Security Policies for LexChronos
-- Multi-tenant security with organization-based access control

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('admin', 'super_admin')
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT TO authenticated
    USING (id = get_user_organization_id());

CREATE POLICY "Admins can update their organization" ON organizations
    FOR UPDATE TO authenticated
    USING (id = get_user_organization_id() AND is_user_admin());

-- User profiles policies
CREATE POLICY "Users can view profiles in their organization" ON user_profiles
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can insert users in their organization" ON user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

CREATE POLICY "Admins can update users in their organization" ON user_profiles
    FOR UPDATE TO authenticated
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- Clients policies
CREATE POLICY "Users can view clients in their organization" ON clients
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert clients in their organization" ON clients
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update clients in their organization" ON clients
    FOR UPDATE TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can delete clients in their organization" ON clients
    FOR DELETE TO authenticated
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- Practice areas policies
CREATE POLICY "Users can view practice areas in their organization" ON practice_areas
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage practice areas" ON practice_areas
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() AND is_user_admin())
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

-- Cases policies
CREATE POLICY "Users can view cases in their organization" ON cases
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert cases in their organization" ON cases
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update cases in their organization" ON cases
    FOR UPDATE TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can delete cases in their organization" ON cases
    FOR DELETE TO authenticated
    USING (organization_id = get_user_organization_id() AND is_user_admin());

-- Documents policies
CREATE POLICY "Users can view documents in their organization" ON documents
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert documents in their organization" ON documents
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update documents they uploaded" ON documents
    FOR UPDATE TO authenticated
    USING (uploaded_by = auth.uid() OR is_user_admin());

CREATE POLICY "Users can delete documents they uploaded or admins can delete any" ON documents
    FOR DELETE TO authenticated
    USING (uploaded_by = auth.uid() OR is_user_admin());

-- Timeline events policies
CREATE POLICY "Users can view timeline events in their organization" ON timeline_events
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage timeline events in their organization" ON timeline_events
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

-- Time entries policies
CREATE POLICY "Users can view time entries in their organization" ON time_entries
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage their own time entries" ON time_entries
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR is_user_admin())
    WITH CHECK (organization_id = get_user_organization_id());

-- Invoices policies
CREATE POLICY "Users can view invoices in their organization" ON invoices
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage invoices in their organization" ON invoices
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

-- Tasks policies
CREATE POLICY "Users can view tasks in their organization" ON tasks
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage tasks assigned to them or that they created" ON tasks
    FOR ALL TO authenticated
    USING (assigned_to = auth.uid() OR created_by = auth.uid() OR is_user_admin())
    WITH CHECK (organization_id = get_user_organization_id());

-- Conflict entities policies
CREATE POLICY "Users can view conflict entities in their organization" ON conflict_entities
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage conflict entities in their organization" ON conflict_entities
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

-- Trust accounts policies
CREATE POLICY "Users can view trust accounts in their organization" ON trust_accounts
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage trust accounts" ON trust_accounts
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() AND is_user_admin())
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

-- Trust transactions policies
CREATE POLICY "Users can view trust transactions in their organization" ON trust_transactions
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage trust transactions" ON trust_transactions
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() AND is_user_admin())
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_user_organization_id());

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;