-- =============================================
-- TINYFEEDBACK INITIAL SCHEMA
-- Migration: 00000000000000_init.sql
-- Description: Initial database schema with tables, RLS, functions, triggers
-- =============================================

-- =============================================
-- EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_plan AS ENUM ('free', 'pro');
CREATE TYPE feedback_type AS ENUM ('nps', 'suggestion', 'bug');
CREATE TYPE feedback_status AS ENUM ('new', 'analyzing', 'implemented', 'archived');
CREATE TYPE notification_type AS ENUM ('new_feedback', 'status_change', 'digest', 'quota_alert');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE bug_priority AS ENUM ('low', 'medium', 'high');

-- =============================================
-- TABLES
-- =============================================

-- ---------------------------------------------
-- Table: users
-- ---------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    avatar_url TEXT,
    plan user_plan NOT NULL DEFAULT 'free',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    email_preferences JSONB NOT NULL DEFAULT '{
        "new_feedback": true,
        "status_change": false,
        "daily_digest": false,
        "weekly_digest": true,
        "quota_alert": true
    }',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User accounts for dashboard access';
COMMENT ON COLUMN users.email_preferences IS 'JSON with notification preferences';

-- ---------------------------------------------
-- Table: teams
-- ---------------------------------------------
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE teams IS 'Teams for collaboration';

-- ---------------------------------------------
-- Table: team_members
-- ---------------------------------------------
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

COMMENT ON TABLE team_members IS 'Team membership with roles';

-- ---------------------------------------------
-- Table: projects
-- ---------------------------------------------
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    website_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    allowed_domains TEXT[] NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{
        "widget": {
            "position": "bottom-right",
            "primaryColor": "#3B82F6",
            "labels": {
                "nps": "Como você avalia nosso produto?",
                "suggestion": "Sugestão",
                "bug": "Reportar um problema"
            },
            "categories": ["Feature", "Improvement", "Other"]
        }
    }',
    plan_override user_plan,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE projects IS 'Projects that use the feedback widget';
COMMENT ON COLUMN projects.api_key IS 'Unique API key for widget/auth';
COMMENT ON COLUMN projects.allowed_domains IS 'CORS whitelist domains';

-- ---------------------------------------------
-- Table: feedbacks
-- ---------------------------------------------
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type feedback_type NOT NULL,
    
    -- Content varies by type (stored as JSONB)
    content JSONB NOT NULL,
    
    -- User identification (may be anonymous)
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    user_metadata JSONB,
    anonymous_id VARCHAR(255),
    
    -- Status workflow
    status feedback_status NOT NULL DEFAULT 'new',
    status_history JSONB NOT NULL DEFAULT '[]',
    
    -- Technical context
    technical_context JSONB,
    ip_address INET,
    
    -- Metadata
    priority bug_priority,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE feedbacks IS 'All feedback entries (NPS, suggestions, bugs)';
COMMENT ON COLUMN feedbacks.content IS 'Type-specific content structure';
COMMENT ON COLUMN feedbacks.status_history IS 'Array of {status, changed_by, changed_at, note}';
COMMENT ON COLUMN feedbacks.technical_context IS 'Browser, OS, viewport, URL, etc.';

-- ---------------------------------------------
-- Table: notifications
-- ---------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    status notification_status NOT NULL DEFAULT 'pending',
    metadata JSONB,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Email notification queue';

-- ---------------------------------------------
-- Table: quotas (for tracking monthly limits)
-- ---------------------------------------------
CREATE TABLE quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- First day of month
    feedback_count INTEGER NOT NULL DEFAULT 0,
    feedback_limit INTEGER NOT NULL DEFAULT 100, -- Free tier default
    grace_period_start TIMESTAMPTZ,
    grace_period_ended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(project_id, month)
);

COMMENT ON TABLE quotas IS 'Monthly feedback quotas per project';

-- =============================================
-- INDEXES (Optimized for frequent queries)
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Teams indexes
CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_teams_slug ON teams(slug);

-- Team members indexes
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(team_id, role);

-- Projects indexes
CREATE INDEX idx_projects_api_key ON projects(api_key);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_team_id ON projects(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_projects_active ON projects(user_id, is_active) WHERE is_active = TRUE;

-- Feedbacks indexes (optimized per story requirements)
CREATE INDEX idx_feedbacks_project_id ON feedbacks(project_id);
CREATE INDEX idx_feedbacks_project_type ON feedbacks(project_id, type);
CREATE INDEX idx_feedbacks_project_status ON feedbacks(project_id, status);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX idx_feedbacks_user_email ON feedbacks(user_email) WHERE user_email IS NOT NULL;
CREATE INDEX idx_feedbacks_project_created ON feedbacks(project_id, created_at DESC);
CREATE INDEX idx_feedbacks_anonymous ON feedbacks(anonymous_id) WHERE anonymous_id IS NOT NULL;

-- Notifications indexes
CREATE INDEX idx_notifications_project_id ON notifications(project_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'pending';
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_pending ON notifications(project_id, status, created_at) WHERE status = 'pending';

-- Quotas indexes
CREATE INDEX idx_quotas_project_month ON quotas(project_id, month);
CREATE INDEX idx_quotas_month ON quotas(month);

-- =============================================
-- FUNCTIONS
-- =============================================

-- ---------------------------------------------
-- Function: update_updated_at()
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- Function: generate_api_key()
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN 'tf_' || encode(gen_random_bytes(30), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- Function: check_and_update_quota()
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION check_and_update_quota(p_project_id UUID)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining INTEGER,
    status TEXT
) AS $$
DECLARE
    v_quota RECORD;
    v_effective_plan user_plan;
    v_limit INTEGER;
BEGIN
    -- Get effective plan
    SELECT COALESCE(p.plan_override, u.plan, 'free')
    INTO v_effective_plan
    FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = p_project_id;
    
    -- Set limit based on plan
    v_limit := CASE v_effective_plan 
        WHEN 'pro' THEN 999999 
        ELSE 100 
    END;
    
    -- Get or create quota record
    SELECT * INTO v_quota
    FROM quotas
    WHERE project_id = p_project_id 
    AND month = DATE_TRUNC('month', CURRENT_DATE);
    
    IF v_quota IS NULL THEN
        INSERT INTO quotas (project_id, month, feedback_limit)
        VALUES (p_project_id, DATE_TRUNC('month', CURRENT_DATE), v_limit)
        RETURNING * INTO v_quota;
    END IF;
    
    -- Check quota status
    IF v_effective_plan = 'pro' THEN
        RETURN QUERY SELECT TRUE, 999999, 'unlimited'::TEXT;
    ELSIF v_quota.grace_period_ended THEN
        RETURN QUERY SELECT FALSE, 0, 'exceeded'::TEXT;
    ELSIF v_quota.feedback_count >= v_quota.feedback_limit THEN
        -- Start grace period if not started
        IF v_quota.grace_period_start IS NULL THEN
            UPDATE quotas 
            SET grace_period_start = NOW()
            WHERE id = v_quota.id;
        END IF;
        RETURN QUERY SELECT TRUE, 0, 'grace_period'::TEXT;
    ELSE
        RETURN QUERY SELECT 
            TRUE, 
            (v_quota.feedback_limit - v_quota.feedback_count)::INTEGER,
            'ok'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- Function: auto_classify_bug_priority()
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION auto_classify_bug_priority()
RETURNS TRIGGER AS $$
DECLARE
    v_description TEXT;
    v_high_keywords TEXT[] := ARRAY['crash', 'quebrado', 'não funciona', 'erro crítico', 'indisponível', 'broken', 'not working', 'critical', 'error'];
    v_medium_keywords TEXT[] := ARRAY['lento', 'bug', 'erro', 'problema', 'slow', 'issue', 'performance'];
BEGIN
    IF NEW.type = 'bug' THEN
        v_description := LOWER(COALESCE(NEW.content->>'description', ''));
        
        IF v_description && v_high_keywords THEN
            NEW.priority := 'high';
        ELSIF v_description && v_medium_keywords THEN
            NEW.priority := 'medium';
        ELSE
            NEW.priority := 'low';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------
-- Function: calculate_nps()
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION calculate_nps(p_project_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    detractors INTEGER,
    neutrals INTEGER,
    promoters INTEGER,
    total INTEGER,
    nps_score INTEGER
) AS $$
DECLARE
    v_detractors INTEGER;
    v_neutrals INTEGER;
    v_promoters INTEGER;
    v_total INTEGER;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE (f.content->>'score')::int BETWEEN 0 AND 6),
        COUNT(*) FILTER (WHERE (f.content->>'score')::int BETWEEN 7 AND 8),
        COUNT(*) FILTER (WHERE (f.content->>'score')::int BETWEEN 9 AND 10),
        COUNT(*)
    INTO v_detractors, v_neutrals, v_promoters, v_total
    FROM feedbacks f
    WHERE f.project_id = p_project_id
    AND f.type = 'nps'
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

-- ---------------------------------------------
-- Function: increment_feedback_quota()
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION increment_feedback_quota()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quotas 
    SET feedback_count = feedback_count + 1,
        updated_at = NOW()
    WHERE project_id = NEW.project_id 
    AND month = DATE_TRUNC('month', CURRENT_DATE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update timestamps
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER feedbacks_updated_at BEFORE UPDATE ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER quotas_updated_at BEFORE UPDATE ON quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-classify bug priority
CREATE TRIGGER classify_bug_priority BEFORE INSERT ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION auto_classify_bug_priority();

-- Auto-increment quota on new feedback
CREATE TRIGGER increment_quota AFTER INSERT ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION increment_feedback_quota();

-- =============================================
-- VIEWS
-- =============================================

-- ---------------------------------------------
-- View: current_quotas
-- ---------------------------------------------
CREATE OR REPLACE VIEW current_quotas AS
SELECT 
    q.id,
    q.project_id,
    q.month,
    q.feedback_count,
    q.feedback_limit,
    CASE 
        WHEN q.grace_period_ended THEN 'exceeded'
        WHEN q.feedback_count >= q.feedback_limit THEN 'grace_period'
        WHEN q.feedback_count >= q.feedback_limit * 0.8 THEN 'warning'
        ELSE 'ok'
    END as quota_status,
    q.grace_period_start,
    q.grace_period_ended,
    CASE 
        WHEN p.plan_override IS NOT NULL THEN p.plan_override
        WHEN u.plan = 'pro' THEN 'pro'::user_plan
        ELSE 'free'::user_plan
    END as effective_plan
FROM quotas q
JOIN projects p ON q.project_id = p.id
JOIN users u ON p.user_id = u.id
WHERE q.month = DATE_TRUNC('month', CURRENT_DATE);

COMMENT ON VIEW current_quotas IS 'Current month quotas with status';

-- ---------------------------------------------
-- View: project_stats
-- ---------------------------------------------
CREATE OR REPLACE VIEW project_stats AS
SELECT 
    p.id as project_id,
    COUNT(f.id) as total_feedbacks,
    COUNT(f.id) FILTER (WHERE f.created_at >= NOW() - INTERVAL '30 days') as feedbacks_30d,
    COUNT(f.id) FILTER (WHERE f.type = 'nps') as nps_count,
    COUNT(f.id) FILTER (WHERE f.type = 'suggestion') as suggestion_count,
    COUNT(f.id) FILTER (WHERE f.type = 'bug') as bug_count,
    AVG((f.content->>'score')::int) FILTER (WHERE f.type = 'nps') as avg_nps_score,
    COUNT(f.id) FILTER (WHERE f.status = 'new') as new_count,
    COUNT(f.id) FILTER (WHERE f.status = 'analyzing') as analyzing_count
FROM projects p
LEFT JOIN feedbacks f ON p.id = f.project_id
GROUP BY p.id;

COMMENT ON VIEW project_stats IS 'Aggregated statistics per project';

-- ---------------------------------------------
-- View: team_projects
-- ---------------------------------------------
CREATE OR REPLACE VIEW team_projects AS
SELECT 
    p.*,
    t.name as team_name,
    t.slug as team_slug,
    COUNT(DISTINCT tm.user_id) as team_member_count
FROM projects p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN team_members tm ON t.id = tm.team_id
WHERE p.team_id IS NOT NULL
GROUP BY p.id, t.name, t.slug;

COMMENT ON VIEW team_projects IS 'Projects with team information';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotas ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- Users policies
-- ---------------------------------------------
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ---------------------------------------------
-- Teams policies
-- ---------------------------------------------
CREATE POLICY "Team owners and members can view teams" ON teams
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = id AND tm.user_id = auth.uid())
    );

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update teams" ON teams
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete teams" ON teams
    FOR DELETE USING (owner_id = auth.uid());

-- ---------------------------------------------
-- Team members policies
-- ---------------------------------------------
CREATE POLICY "Team members can view team membership" ON team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams t 
            WHERE t.id = team_members.team_id 
            AND (t.owner_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = auth.uid()))
        )
    );

CREATE POLICY "Team owners and admins can add members" ON team_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams t 
            WHERE t.id = team_members.team_id 
            AND (t.owner_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')))
        )
    );

CREATE POLICY "Team owners and admins can update members" ON team_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams t 
            WHERE t.id = team_members.team_id 
            AND (t.owner_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')))
        )
    );

CREATE POLICY "Team owners can delete members" ON team_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams t 
            WHERE t.id = team_members.team_id 
            AND t.owner_id = auth.uid()
        )
    );

-- ---------------------------------------------
-- Projects policies
-- ---------------------------------------------
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = projects.team_id AND tm.user_id = auth.uid())
    );

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = projects.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin'))
    );

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- Feedbacks policies
-- ---------------------------------------------
CREATE POLICY "Users can view feedbacks of their projects" ON feedbacks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = feedbacks.project_id 
            AND (p.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
        )
    );

CREATE POLICY "Widget can insert feedbacks" ON feedbacks
    FOR INSERT WITH CHECK (true); -- Validated via API key in Edge Function

CREATE POLICY "Users can update feedbacks of their projects" ON feedbacks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = feedbacks.project_id 
            AND (p.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')))
        )
    );

-- ---------------------------------------------
-- Notifications policies
-- ---------------------------------------------
CREATE POLICY "Users can view notifications of their projects" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = notifications.project_id 
            AND (p.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
        )
    );

-- ---------------------------------------------
-- Quotas policies
-- ---------------------------------------------
CREATE POLICY "Users can view quotas of their projects" ON quotas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = quotas.project_id 
            AND (p.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
        )
    );
