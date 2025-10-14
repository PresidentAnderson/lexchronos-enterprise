-- Database Triggers and Functions for LexChronos
-- Automated business logic and data integrity

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_events_updated_at BEFORE UPDATE ON timeline_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conflict_entities_updated_at BEFORE UPDATE ON conflict_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trust_accounts_updated_at BEFORE UPDATE ON trust_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    org_slug TEXT;
BEGIN
    -- Get organization slug
    SELECT slug INTO org_slug FROM organizations WHERE id = NEW.organization_id;
    
    -- Get current year
    year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Get next case number for this organization and year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(case_number FROM LENGTH(UPPER(org_slug)) + 6) AS INTEGER
        )
    ), 0) + 1
    INTO next_number
    FROM cases 
    WHERE organization_id = NEW.organization_id 
    AND case_number LIKE UPPER(org_slug) || '-' || year_suffix || '-%';
    
    -- Generate case number: ORG-YYYY-NNN
    NEW.case_number := UPPER(org_slug) || '-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto case number generation trigger
CREATE TRIGGER generate_case_number_trigger
    BEFORE INSERT ON cases
    FOR EACH ROW
    WHEN (NEW.case_number IS NULL OR NEW.case_number = '')
    EXECUTE FUNCTION generate_case_number();

-- Function to auto-generate client numbers
CREATE OR REPLACE FUNCTION generate_client_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get next client number for this organization
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(client_number FROM 5) AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM clients 
    WHERE organization_id = NEW.organization_id;
    
    -- Generate client number: CLI-NNNN
    NEW.client_number := 'CLI-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto client number generation trigger
CREATE TRIGGER generate_client_number_trigger
    BEFORE INSERT ON clients
    FOR EACH ROW
    WHEN (NEW.client_number IS NULL OR NEW.client_number = '')
    EXECUTE FUNCTION generate_client_number();

-- Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
BEGIN
    -- Get current year
    year_suffix := EXTRACT(YEAR FROM NEW.issue_date)::TEXT;
    
    -- Get next invoice number for this organization and year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM invoices 
    WHERE organization_id = NEW.organization_id 
    AND invoice_number LIKE 'INV-' || year_suffix || '-%';
    
    -- Generate invoice number: INV-YYYY-NNNN
    NEW.invoice_number := 'INV-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto invoice number generation trigger
CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW
    WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
    EXECUTE FUNCTION generate_invoice_number();

-- Function to update trust account balance after transactions
CREATE OR REPLACE FUNCTION update_trust_account_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance DECIMAL(12,2);
    new_balance DECIMAL(12,2);
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance 
    FROM trust_accounts 
    WHERE id = NEW.trust_account_id;
    
    -- Calculate new balance based on transaction type
    IF NEW.transaction_type = 'deposit' THEN
        new_balance := current_balance + NEW.amount;
    ELSIF NEW.transaction_type = 'withdrawal' THEN
        new_balance := current_balance - NEW.amount;
        -- Prevent negative balances
        IF new_balance < 0 THEN
            RAISE EXCEPTION 'Insufficient funds. Current balance: %, Withdrawal amount: %', current_balance, NEW.amount;
        END IF;
    ELSE
        new_balance := current_balance; -- For transfer transactions, handle separately
    END IF;
    
    -- Update the balance_after field in the transaction
    NEW.balance_after := new_balance;
    
    -- Update the trust account balance
    UPDATE trust_accounts 
    SET balance = new_balance, updated_at = NOW()
    WHERE id = NEW.trust_account_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trust account balance update trigger
CREATE TRIGGER update_trust_balance_trigger
    BEFORE INSERT ON trust_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_account_balance();

-- Function to auto-complete tasks when cases are closed
CREATE OR REPLACE FUNCTION auto_complete_tasks_on_case_close()
RETURNS TRIGGER AS $$
BEGIN
    -- If case is being closed, mark all pending tasks as cancelled
    IF OLD.status != 'closed' AND NEW.status = 'closed' THEN
        UPDATE tasks 
        SET status = 'cancelled', updated_at = NOW()
        WHERE case_id = NEW.id 
        AND status IN ('pending', 'in_progress');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-complete tasks trigger
CREATE TRIGGER auto_complete_tasks_trigger
    AFTER UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION auto_complete_tasks_on_case_close();

-- Function to create notification for new case assignment
CREATE OR REPLACE FUNCTION notify_case_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- If attorney is assigned to a case
    IF NEW.assigned_attorney IS NOT NULL AND 
       (OLD IS NULL OR OLD.assigned_attorney IS NULL OR OLD.assigned_attorney != NEW.assigned_attorney) THEN
        
        INSERT INTO notifications (organization_id, user_id, type, title, message, data)
        VALUES (
            NEW.organization_id,
            NEW.assigned_attorney,
            'case_assignment',
            'New Case Assigned',
            'You have been assigned to case: ' || NEW.title,
            jsonb_build_object(
                'case_id', NEW.id,
                'case_number', NEW.case_number,
                'case_title', NEW.title,
                'priority', NEW.priority
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply case assignment notification trigger
CREATE TRIGGER notify_case_assignment_trigger
    AFTER INSERT OR UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION notify_case_assignment();

-- Function to create notification for approaching deadlines
CREATE OR REPLACE FUNCTION check_approaching_deadlines()
RETURNS VOID AS $$
DECLARE
    deadline_record RECORD;
BEGIN
    -- Find deadlines within the next 7 days
    FOR deadline_record IN
        SELECT te.*, c.title as case_title, c.assigned_attorney, c.organization_id
        FROM timeline_events te
        JOIN cases c ON te.case_id = c.id
        WHERE te.is_deadline = true
        AND te.event_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        AND c.status = 'active'
        AND c.assigned_attorney IS NOT NULL
    LOOP
        -- Create notification if it doesn't already exist
        INSERT INTO notifications (organization_id, user_id, type, title, message, data)
        SELECT 
            deadline_record.organization_id,
            deadline_record.assigned_attorney,
            'deadline_reminder',
            'Upcoming Deadline',
            'Deadline approaching for case: ' || deadline_record.case_title || ' - ' || deadline_record.title,
            jsonb_build_object(
                'case_id', deadline_record.case_id,
                'event_id', deadline_record.id,
                'deadline_date', deadline_record.event_date,
                'days_remaining', EXTRACT(days FROM deadline_record.event_date - NOW())
            )
        WHERE NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = deadline_record.assigned_attorney 
            AND type = 'deadline_reminder'
            AND (data->>'event_id')::UUID = deadline_record.id
            AND created_at > NOW() - INTERVAL '1 day'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    time_total DECIMAL(12,2) := 0;
    expense_total DECIMAL(12,2) := 0;
BEGIN
    -- Calculate total from time entries
    SELECT COALESCE(SUM(amount), 0) INTO time_total
    FROM time_entries 
    WHERE invoice_id = NEW.id;
    
    -- For now, we'll just use time entries total
    -- Future: Add expenses table and calculate expense total
    
    -- Update invoice totals
    NEW.subtotal := time_total + expense_total;
    NEW.total_amount := NEW.subtotal + COALESCE(NEW.tax_amount, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply invoice totals calculation trigger
CREATE TRIGGER calculate_invoice_totals_trigger
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_totals();

-- Create a function to search cases (for full-text search)
CREATE OR REPLACE FUNCTION search_cases(
    search_term TEXT,
    org_id UUID,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    case_number VARCHAR(100),
    title VARCHAR(500),
    client_name TEXT,
    status VARCHAR(50),
    priority VARCHAR(20),
    date_opened DATE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.case_number,
        c.title,
        CASE 
            WHEN cl.type = 'individual' THEN cl.first_name || ' ' || cl.last_name
            ELSE cl.company_name
        END as client_name,
        c.status,
        c.priority,
        c.date_opened,
        ts_rank(
            to_tsvector('english', c.title || ' ' || COALESCE(c.description, '') || ' ' || c.case_number),
            plainto_tsquery('english', search_term)
        ) as rank
    FROM cases c
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.organization_id = org_id
    AND (
        to_tsvector('english', c.title || ' ' || COALESCE(c.description, '') || ' ' || c.case_number) 
        @@ plainto_tsquery('english', search_term)
    )
    ORDER BY rank DESC, c.date_opened DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on search function
GRANT EXECUTE ON FUNCTION search_cases(TEXT, UUID, INTEGER) TO authenticated;