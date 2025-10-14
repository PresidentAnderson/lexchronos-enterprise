-- LexChronos Blueprint Features Migration
-- Adds support for AI integration, evidence management, and public summaries

-- Add new columns to existing documents table for enhanced evidence management
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS key_points TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS confidentiality_flags TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS embeddings vector(1536); -- OpenAI embedding size
ALTER TABLE documents ADD COLUMN IF NOT EXISTS confidentiality_level VARCHAR(20) DEFAULT 'CONFIDENTIAL';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS checksum VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT false;

-- Update existing category enum to match blueprint categories
ALTER TABLE documents ALTER COLUMN category TYPE VARCHAR(50);

-- Create exhibits table for evidence organization
CREATE TABLE exhibits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    exhibit_number VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    documents UUID[] DEFAULT '{}',
    exhibit_type VARCHAR(50) DEFAULT 'EVIDENCE', -- EVIDENCE, CHRONOLOGY, LEGAL_BRIEF
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, FINALIZED, SUBMITTED
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique exhibit numbers per case
    UNIQUE(organization_id, case_id, exhibit_number)
);

-- Create public summaries table
CREATE TABLE public_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    introduction TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    access_level VARCHAR(20) DEFAULT 'PASSWORD_PROTECTED', -- PUBLIC, PASSWORD_PROTECTED, PRIVATE
    password_hash VARCHAR(255),
    is_published BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    seo_metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI summaries table for tracking AI-generated content
CREATE TABLE ai_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    summary_type VARCHAR(50) NOT NULL, -- 'document', 'legal_analysis', 'rebuttal', 'strategy'
    content TEXT NOT NULL,
    key_points TEXT[],
    confidence_score DECIMAL(3,2),
    model_version VARCHAR(50),
    processing_time_ms INTEGER,
    token_usage JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create external integrations table for API connections
CREATE TABLE external_integrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- 'openai', 'hubspot', 'google_drive', 'gmail', 'calendar'
    service_name VARCHAR(100) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    api_key_hash VARCHAR(255), -- For API keys like OpenAI
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'IDLE', -- IDLE, SYNCING, ERROR, SUCCESS
    error_details TEXT,
    usage_stats JSONB DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate integrations
    UNIQUE(organization_id, service_type, service_name)
);

-- Create audit logs table for comprehensive tracking
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES user_profiles(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- DOCUMENT, CASE, USER, etc.
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    risk_level VARCHAR(20) DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create redaction logs for tracking content redaction
CREATE TABLE redaction_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    public_summary_id UUID REFERENCES public_summaries(id) ON DELETE CASCADE,
    redaction_type VARCHAR(50) NOT NULL, -- 'PRIVACY', 'CONFIDENTIALITY', 'PRIVILEGE', 'SECURITY'
    original_content TEXT,
    redacted_content TEXT,
    redaction_reason TEXT NOT NULL,
    auto_detected BOOLEAN DEFAULT false, -- Whether redaction was AI-suggested
    approved_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search analytics table
CREATE TABLE search_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES user_profiles(id),
    search_query TEXT NOT NULL,
    search_type VARCHAR(20) NOT NULL, -- 'semantic', 'full_text', 'hybrid'
    results_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    filters_used JSONB DEFAULT '{}',
    clicked_results UUID[],
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable vector extension for semantic search (requires pgvector)
-- This should be run as superuser: CREATE EXTENSION IF NOT EXISTS vector;
-- For now, we'll add a comment for manual installation
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Create indexes for performance
CREATE INDEX idx_documents_organization_extracted_text ON documents USING gin(to_tsvector('english', extracted_text)) WHERE extracted_text IS NOT NULL;
CREATE INDEX idx_documents_ai_summary ON documents USING gin(to_tsvector('english', ai_summary)) WHERE ai_summary IS NOT NULL;
CREATE INDEX idx_documents_confidentiality_level ON documents(confidentiality_level);
CREATE INDEX idx_documents_is_processed ON documents(is_processed);
CREATE INDEX idx_documents_checksum ON documents(checksum);

-- Vector similarity index (requires pgvector)
-- CREATE INDEX idx_documents_embeddings ON documents USING ivfflat (embeddings vector_cosine_ops);

CREATE INDEX idx_exhibits_organization_case ON exhibits(organization_id, case_id);
CREATE INDEX idx_exhibits_status ON exhibits(status);
CREATE INDEX idx_exhibits_exhibit_number ON exhibits(exhibit_number);

CREATE INDEX idx_public_summaries_slug ON public_summaries(slug);
CREATE INDEX idx_public_summaries_published ON public_summaries(is_published) WHERE is_published = true;
CREATE INDEX idx_public_summaries_organization ON public_summaries(organization_id);

CREATE INDEX idx_ai_summaries_document ON ai_summaries(document_id);
CREATE INDEX idx_ai_summaries_case ON ai_summaries(case_id);
CREATE INDEX idx_ai_summaries_type ON ai_summaries(summary_type);
CREATE INDEX idx_ai_summaries_created ON ai_summaries(created_at);

CREATE INDEX idx_external_integrations_org_service ON external_integrations(organization_id, service_type);
CREATE INDEX idx_external_integrations_active ON external_integrations(is_active) WHERE is_active = true;
CREATE INDEX idx_external_integrations_sync_status ON external_integrations(sync_status);

CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_risk_level ON audit_logs(risk_level);

CREATE INDEX idx_search_analytics_organization ON search_analytics(organization_id);
CREATE INDEX idx_search_analytics_user ON search_analytics(user_id);
CREATE INDEX idx_search_analytics_created ON search_analytics(created_at);

-- Update RLS policies for new tables
ALTER TABLE exhibits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE redaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for exhibits
CREATE POLICY "Users can view exhibits in their organization" ON exhibits
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage exhibits in their organization" ON exhibits
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

-- RLS policies for public summaries
CREATE POLICY "Users can view public summaries in their organization" ON public_summaries
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can manage public summaries in their organization" ON public_summaries
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id())
    WITH CHECK (organization_id = get_user_organization_id());

-- Special policy for public access to published summaries
CREATE POLICY "Public access to published summaries" ON public_summaries
    FOR SELECT TO anon
    USING (is_published = true AND access_level IN ('PUBLIC', 'PASSWORD_PROTECTED'));

-- RLS policies for AI summaries
CREATE POLICY "Users can view AI summaries in their organization" ON ai_summaries
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert AI summaries" ON ai_summaries
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_user_organization_id());

-- RLS policies for external integrations
CREATE POLICY "Admins can manage external integrations" ON external_integrations
    FOR ALL TO authenticated
    USING (organization_id = get_user_organization_id() AND is_user_admin())
    WITH CHECK (organization_id = get_user_organization_id() AND is_user_admin());

-- RLS policies for audit logs
CREATE POLICY "Users can view audit logs in their organization" ON audit_logs
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_user_organization_id());

-- RLS policies for redaction logs
CREATE POLICY "Users can view redaction logs in their organization" ON redaction_logs
    FOR SELECT TO authenticated
    USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert redaction logs in their organization" ON redaction_logs
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_user_organization_id());

-- RLS policies for search analytics
CREATE POLICY "Users can view search analytics for their searches" ON search_analytics
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System can insert search analytics" ON search_analytics
    FOR INSERT TO authenticated
    WITH CHECK (organization_id = get_user_organization_id());

-- Updated triggers for new tables
CREATE TRIGGER update_exhibits_updated_at BEFORE UPDATE ON exhibits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_summaries_updated_at BEFORE UPDATE ON public_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_integrations_updated_at BEFORE UPDATE ON external_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate exhibit numbers
CREATE OR REPLACE FUNCTION generate_exhibit_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    case_prefix TEXT;
BEGIN
    -- Get case prefix for exhibit numbering
    SELECT 
        CASE 
            WHEN case_number IS NOT NULL THEN SUBSTRING(case_number FROM 1 FOR 3)
            ELSE 'EXH'
        END
    INTO case_prefix
    FROM cases 
    WHERE id = NEW.case_id;
    
    -- Get next exhibit number for this case
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(exhibit_number FROM LENGTH(case_prefix) + 2) AS INTEGER
        )
    ), 0) + 1
    INTO next_number
    FROM exhibits 
    WHERE organization_id = NEW.organization_id 
    AND (case_id = NEW.case_id OR NEW.case_id IS NULL)
    AND exhibit_number LIKE case_prefix || '-%';
    
    -- Generate exhibit number: PREFIX-NNN
    NEW.exhibit_number := case_prefix || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto exhibit number generation trigger
CREATE TRIGGER generate_exhibit_number_trigger
    BEFORE INSERT ON exhibits
    FOR EACH ROW
    WHEN (NEW.exhibit_number IS NULL OR NEW.exhibit_number = '')
    EXECUTE FUNCTION generate_exhibit_number();

-- Function to update public summary view count
CREATE OR REPLACE FUNCTION increment_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public_summaries 
    SET 
        view_count = view_count + 1,
        last_viewed_at = NOW()
    WHERE id = NEW.public_summary_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public_summaries TO anon; -- For public access