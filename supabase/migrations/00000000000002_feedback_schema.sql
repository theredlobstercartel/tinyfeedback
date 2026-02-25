-- =============================================
-- STORY: ST-15 - Schema de Feedbacks no Banco
-- Migration: 00000000000002_feedback_schema.sql
-- Description: Feedback schema with widgets, metadata JSONB, and optimized indexes
-- =============================================

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

-- Feedback types: NPS, SUGGESTION, BUG
CREATE TYPE feedback_type_v2 AS ENUM ('NPS', 'SUGGESTION', 'BUG');

-- Feedback status: NEW, READ, ARCHIVED (soft delete support)
CREATE TYPE feedback_status_v2 AS ENUM ('NEW', 'READ', 'ARCHIVED');

-- Widget status for soft delete
CREATE TYPE widget_status AS ENUM ('active', 'archived', 'deleted');

-- =============================================
-- TABLE: widgets
-- =============================================
CREATE TABLE widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    website_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    
    -- Configuration
    settings JSONB NOT NULL DEFAULT '{
        "position": "bottom-right",
        "primaryColor": "#3B82F6",
        "labels": {
            "nps": "Como você avalia nosso produto?",
            "suggestion": "Sugestão",
            "bug": "Reportar um problema"
        },
        "categories": ["Feature", "Improvement", "Other"]
    }',
    
    -- Soft delete support
    status widget_status NOT NULL DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE widgets IS 'Widget configurations for collecting feedback';
COMMENT ON COLUMN widgets.api_key IS 'Unique API key for widget authentication';
COMMENT ON COLUMN widgets.settings IS 'Widget appearance and behavior settings';
COMMENT ON COLUMN widgets.status IS 'Widget status: active, archived (soft delete), deleted';

-- =============================================
-- TABLE: feedbacks_v2 (New feedback schema per ST-15)
-- =============================================
CREATE TABLE feedbacks_v2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationship with widgets (AC5)
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    
    -- Feedback type (AC2): NPS, SUGGESTION, BUG
    type feedback_type_v2 NOT NULL,
    
    -- Content field (generic text content)
    content TEXT,
    
    -- Type-specific fields (AC4)
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    title VARCHAR(500),
    description TEXT,
    
    -- Flexible metadata JSONB (AC3)
    metadata JSONB NOT NULL DEFAULT '{}',
    
    -- Status with soft delete support (AC7): NEW, READ, ARCHIVED
    status feedback_status_v2 NOT NULL DEFAULT 'NEW',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE feedbacks_v2 IS 'Feedback entries with widget relationship and metadata';
COMMENT ON COLUMN feedbacks_v2.widget_id IS 'Foreign key to widgets table';
COMMENT ON COLUMN feedbacks_v2.type IS 'Feedback type: NPS, SUGGESTION, BUG';
COMMENT ON COLUMN feedbacks_v2.content IS 'Generic content field';
COMMENT ON COLUMN feedbacks_v2.nps_score IS 'NPS score 0-10 (only for NPS type)';
COMMENT ON COLUMN feedbacks_v2.title IS 'Title for suggestion/bug reports';
COMMENT ON COLUMN feedbacks_v2.description IS 'Detailed description';
COMMENT ON COLUMN feedbacks_v2.metadata IS 'JSONB metadata: url, userAgent, ip, screenshotUrl, email, deviceInfo';
COMMENT ON COLUMN feedbacks_v2.status IS 'Status: NEW, READ, ARCHIVED (soft delete)';

-- =============================================
-- INDEXES (Optimized for common queries - AC6)
-- =============================================

-- Widget indexes
CREATE INDEX idx_widgets_api_key ON widgets(api_key);
CREATE INDEX idx_widgets_user_id ON widgets(user_id);
CREATE INDEX idx_widgets_status ON widgets(status);
CREATE INDEX idx_widgets_user_status ON widgets(user_id, status) WHERE status = 'active';

-- Feedback indexes by widget (AC6)
CREATE INDEX idx_feedbacks_v2_widget_id ON feedbacks_v2(widget_id);
CREATE INDEX idx_feedbacks_v2_widget_type ON feedbacks_v2(widget_id, type);
CREATE INDEX idx_feedbacks_v2_widget_status ON feedbacks_v2(widget_id, status);
CREATE INDEX idx_feedbacks_v2_widget_created ON feedbacks_v2(widget_id, created_at DESC);

-- Feedback indexes by date (AC6)
CREATE INDEX idx_feedbacks_v2_created_at ON feedbacks_v2(created_at DESC);

-- Feedback indexes by status (AC6)
CREATE INDEX idx_feedbacks_v2_status ON feedbacks_v2(status);
CREATE INDEX idx_feedbacks_v2_status_new ON feedbacks_v2(status) WHERE status = 'NEW';

-- GIN index for metadata JSONB queries (AC3)
CREATE INDEX idx_feedbacks_v2_metadata_gin ON feedbacks_v2 USING GIN (metadata);

-- Composite indexes for common query patterns
CREATE INDEX idx_feedbacks_v2_widget_type_created ON feedbacks_v2(widget_id, type, created_at DESC);
CREATE INDEX idx_feedbacks_v2_widget_status_created ON feedbacks_v2(widget_id, status, created_at DESC);

-- Index for NPS score queries
CREATE INDEX idx_feedbacks_v2_nps_score ON feedbacks_v2(nps_score) WHERE type = 'NPS';

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_v2()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate API key for widgets
CREATE OR REPLACE FUNCTION generate_widget_api_key()
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN 'tf_' || encode(gen_random_bytes(30), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function: Validate NPS score constraint
CREATE OR REPLACE FUNCTION validate_nps_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'NPS' THEN
        IF NEW.nps_score IS NULL THEN
            RAISE EXCEPTION 'NPS feedback must have a score';
        END IF;
        IF NEW.nps_score < 0 OR NEW.nps_score > 10 THEN
            RAISE EXCEPTION 'NPS score must be between 0 and 10';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate NPS for a widget
CREATE OR REPLACE FUNCTION calculate_nps_v2(
    p_widget_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    detractors BIGINT,
    neutrals BIGINT,
    promoters BIGINT,
    total BIGINT,
    nps_score INTEGER
) AS $$
DECLARE
    v_detractors BIGINT;
    v_neutrals BIGINT;
    v_promoters BIGINT;
    v_total BIGINT;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE f.nps_score BETWEEN 0 AND 6),
        COUNT(*) FILTER (WHERE f.nps_score BETWEEN 7 AND 8),
        COUNT(*) FILTER (WHERE f.nps_score BETWEEN 9 AND 10),
        COUNT(*)
    INTO v_detractors, v_neutrals, v_promoters, v_total
    FROM feedbacks_v2 f
    WHERE f.widget_id = p_widget_id
    AND f.type = 'NPS'
    AND f.status != 'ARCHIVED'
    AND f.created_at >= NOW() - (p_days || ' days')::INTERVAL;
    
    RETURN QUERY SELECT 
        v_detractors,
        v_neutrals,
        v_promoters,
        v_total,
        CASE 
            WHEN v_total = 0 THEN 0
            ELSE ROUND(((v_promoters::NUMERIC / v_total) - (v_detractors::NUMERIC / v_total)) * 100)::INTEGER
        END;
END;
$$ LANGUAGE plpgsql;

-- Function: Soft delete feedback (set status to ARCHIVED)
CREATE OR REPLACE FUNCTION soft_delete_feedback(
    p_feedback_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE feedbacks_v2
    SET status = 'ARCHIVED',
        updated_at = NOW()
    WHERE id = p_feedback_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Soft delete widget (set status to deleted)
CREATE OR REPLACE FUNCTION soft_delete_widget(
    p_widget_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE widgets
    SET status = 'deleted',
        updated_at = NOW()
    WHERE id = p_widget_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get feedbacks with metadata filtering
CREATE OR REPLACE FUNCTION get_feedbacks_by_metadata(
    p_widget_id UUID,
    p_metadata_filter JSONB
)
RETURNS TABLE (
    id UUID,
    widget_id UUID,
    type feedback_type_v2,
    content TEXT,
    nps_score INTEGER,
    title VARCHAR(500),
    description TEXT,
    metadata JSONB,
    status feedback_status_v2,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT f.*
    FROM feedbacks_v2 f
    WHERE f.widget_id = p_widget_id
    AND f.metadata @> p_metadata_filter
    AND f.status != 'ARCHIVED'
    ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update timestamps
CREATE TRIGGER widgets_updated_at BEFORE UPDATE ON widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_v2();

CREATE TRIGGER feedbacks_v2_updated_at BEFORE UPDATE ON feedbacks_v2
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_v2();

-- Validate NPS score on insert/update
CREATE TRIGGER validate_nps_trigger BEFORE INSERT OR UPDATE ON feedbacks_v2
    FOR EACH ROW EXECUTE FUNCTION validate_nps_score();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on new tables
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks_v2 ENABLE ROW LEVEL SECURITY;

-- Widgets RLS policies
CREATE POLICY "Users can view own widgets" ON widgets
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = widgets.team_id AND tm.user_id = auth.uid())
    );

CREATE POLICY "Users can insert own widgets" ON widgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own widgets" ON widgets
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = widgets.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
    );

CREATE POLICY "Users can soft delete own widgets" ON widgets
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = widgets.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
    );

-- Feedbacks RLS policies
CREATE POLICY "Users can view feedbacks of their widgets" ON feedbacks_v2
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = feedbacks_v2.widget_id
            AND (w.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = w.team_id AND tm.user_id = auth.uid()))
        )
    );

CREATE POLICY "Widget API can insert feedbacks" ON feedbacks_v2
    FOR INSERT WITH CHECK (true); -- Validated via API key in Edge Function

CREATE POLICY "Users can update feedbacks of their widgets" ON feedbacks_v2
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = feedbacks_v2.widget_id
            AND (w.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = w.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')))
        )
    );

CREATE POLICY "Users can soft delete feedbacks of their widgets" ON feedbacks_v2
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM widgets w
            WHERE w.id = feedbacks_v2.widget_id
            AND (w.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = w.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')))
        )
    );

-- =============================================
-- VIEWS
-- =============================================

-- View: Active widgets with feedback counts
CREATE OR REPLACE VIEW widget_stats AS
SELECT 
    w.id as widget_id,
    w.name,
    w.status,
    COUNT(f.id) as total_feedbacks,
    COUNT(f.id) FILTER (WHERE f.created_at >= NOW() - INTERVAL '30 days') as feedbacks_30d,
    COUNT(f.id) FILTER (WHERE f.type = 'NPS') as nps_count,
    COUNT(f.id) FILTER (WHERE f.type = 'SUGGESTION') as suggestion_count,
    COUNT(f.id) FILTER (WHERE f.type = 'BUG') as bug_count,
    AVG(f.nps_score) FILTER (WHERE f.type = 'NPS') as avg_nps_score,
    COUNT(f.id) FILTER (WHERE f.status = 'NEW') as new_count,
    COUNT(f.id) FILTER (WHERE f.status = 'READ') as read_count
FROM widgets w
LEFT JOIN feedbacks_v2 f ON w.id = f.widget_id AND f.status != 'ARCHIVED'
WHERE w.status = 'active'
GROUP BY w.id, w.name, w.status;

COMMENT ON VIEW widget_stats IS 'Statistics per widget (excluding archived feedbacks and deleted widgets)';

-- View: Recent feedbacks with widget info
CREATE OR REPLACE VIEW recent_feedbacks AS
SELECT 
    f.*,
    w.name as widget_name,
    w.website_url
FROM feedbacks_v2 f
JOIN widgets w ON f.widget_id = w.id
WHERE f.status != 'ARCHIVED'
AND w.status = 'active'
ORDER BY f.created_at DESC;

COMMENT ON VIEW recent_feedbacks IS 'Recent active feedbacks with widget information';

-- =============================================
-- METADATA STRUCTURE DOCUMENTATION
-- =============================================
/*
The metadata JSONB field should contain:
{
    "url": "https://example.com/page",
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1",
    "screenshotUrl": "https://storage...",
    "email": "user@example.com",
    "deviceInfo": {
        "browser": "Chrome 120",
        "os": "Windows 10",
        "viewport": "1920x1080"
    }
}
*/

-- =============================================
-- ST-15 ACCEPTANCE CRITERIA VERIFICATION
-- =============================================
/*
AC1: ✅ Tabela feedbacks_v2 com campos: id, widgetId, type, content, metadata, status, createdAt, updatedAt
AC2: ✅ Suporte a tipos: NPS, SUGGESTION, BUG (feedback_type_v2 enum)
AC3: ✅ Campo JSONB metadata para dados flexíveis (url, userAgent, ip, screenshotUrl, email, deviceInfo)
AC4: ✅ Campos específicos por tipo: npsScore (0-10 constraint), title, description
AC5: ✅ Relacionamento com tabela widgets (foreign key widget_id)
AC6: ✅ Índices otimizados: por widget, por data, por status, GIN para metadata
AC7: ✅ Soft delete via status (NEW, READ, ARCHIVED)
RLS: ✅ Políticas configuradas para segurança
*/
