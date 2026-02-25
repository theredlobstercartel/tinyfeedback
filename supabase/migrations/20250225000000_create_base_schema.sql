-- Migration: Create initial database schema for TinyFeedback v2
-- Story: ST-02 - Database Schema e Migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: bmad_projects
-- ============================================
CREATE TABLE IF NOT EXISTS bmad_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Widget appearance
  widget_color TEXT DEFAULT '#0F172A',
  widget_position TEXT DEFAULT 'bottom-right',
  widget_text TEXT DEFAULT 'Feedback',
  
  -- Security
  allowed_domains TEXT[] DEFAULT '{}',
  
  -- Plan & Limits
  plan TEXT DEFAULT 'free',
  feedbacks_count INTEGER DEFAULT 0,
  max_feedbacks INTEGER DEFAULT 100,
  
  -- Monthly counter for Free plan (ST-29)
  monthly_feedbacks_count INTEGER DEFAULT 0,
  monthly_feedbacks_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Stripe subscription fields (ST-30)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_period_start TIMESTAMP WITH TIME ZONE,
  subscription_period_end TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE bmad_projects IS 'Projects that use the TinyFeedback widget';
COMMENT ON COLUMN bmad_projects.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN bmad_projects.api_key IS 'Secret key for widget authentication';
COMMENT ON COLUMN bmad_projects.plan IS 'Subscription plan: free, pro';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bmad_projects_user_id ON bmad_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_bmad_projects_slug ON bmad_projects(slug);
CREATE INDEX IF NOT EXISTS idx_bmad_projects_created_at ON bmad_projects(created_at);
CREATE INDEX IF NOT EXISTS idx_bmad_projects_api_key ON bmad_projects(api_key);

-- Enable RLS
ALTER TABLE bmad_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bmad_projects
CREATE POLICY "Users can read own projects"
  ON bmad_projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create projects"
  ON bmad_projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON bmad_projects FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON bmad_projects FOR DELETE
  USING (user_id = auth.uid());

-- Public read policy for widget (only necessary fields)
CREATE POLICY "Public can read project by API key"
  ON bmad_projects FOR SELECT
  USING (true); -- API key validation happens at application level

-- ============================================
-- Table: bmad_feedbacks
-- ============================================
CREATE TABLE IF NOT EXISTS bmad_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES bmad_projects(id) ON DELETE CASCADE,
  
  -- Feedback content
  type TEXT NOT NULL CHECK (type IN ('nps', 'suggestion', 'bug')),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  title TEXT,
  content TEXT NOT NULL,
  
  -- User info (optional)
  user_email TEXT,
  user_id TEXT, -- External user ID from the client app
  
  -- Context
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,
  
  -- Status & Workflow
  status TEXT DEFAULT 'new',
  workflow_status TEXT DEFAULT 'new' CHECK (workflow_status IN ('new', 'in_analysis', 'implemented')),
  internal_notes TEXT,
  
  -- Response
  response_sent BOOLEAN DEFAULT false,
  response_content TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE bmad_feedbacks IS 'Feedback submissions from widget users';
COMMENT ON COLUMN bmad_feedbacks.type IS 'Type of feedback: nps, suggestion, bug';
COMMENT ON COLUMN bmad_feedbacks.workflow_status IS 'Internal workflow status';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bmad_feedbacks_project_id ON bmad_feedbacks(project_id);
CREATE INDEX IF NOT EXISTS idx_bmad_feedbacks_created_at ON bmad_feedbacks(created_at);
CREATE INDEX IF NOT EXISTS idx_bmad_feedbacks_type ON bmad_feedbacks(type);
CREATE INDEX IF NOT EXISTS idx_bmad_feedbacks_status ON bmad_feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_bmad_feedbacks_workflow_status ON bmad_feedbacks(workflow_status);
CREATE INDEX IF NOT EXISTS idx_bmad_feedbacks_project_id_created_at ON bmad_feedbacks(project_id, created_at DESC);

-- Enable RLS
ALTER TABLE bmad_feedbacks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bmad_feedbacks
CREATE POLICY "Users can read feedbacks of their projects"
  ON bmad_feedbacks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bmad_projects 
      WHERE bmad_projects.id = bmad_feedbacks.project_id 
      AND bmad_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can create feedbacks"
  ON bmad_feedbacks FOR INSERT
  WITH CHECK (true); -- API key validation happens at application level

CREATE POLICY "Users can update feedbacks of their projects"
  ON bmad_feedbacks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bmad_projects 
      WHERE bmad_projects.id = bmad_feedbacks.project_id 
      AND bmad_projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bmad_projects 
      WHERE bmad_projects.id = bmad_feedbacks.project_id 
      AND bmad_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete feedbacks of their projects"
  ON bmad_feedbacks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bmad_projects 
      WHERE bmad_projects.id = bmad_feedbacks.project_id 
      AND bmad_projects.user_id = auth.uid()
    )
  );

-- ============================================
-- Table: teams
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Billing (team-level subscription)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_plan TEXT DEFAULT 'free',
  
  -- Limits
  max_projects INTEGER DEFAULT 5,
  max_members INTEGER DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE teams IS 'Teams for collaborative project management';
COMMENT ON COLUMN teams.slug IS 'URL-friendly unique identifier for the team';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Users can read teams they own or are members of"
  ON teams FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update their teams"
  ON teams FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams"
  ON teams FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- Table: team_members
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate memberships
  UNIQUE(team_id, user_id)
);

-- Add comments
COMMENT ON TABLE team_members IS 'Members of teams with their roles';
COMMENT ON COLUMN team_members.role IS 'Role in team: owner, admin, member';
COMMENT ON COLUMN team_members.status IS 'Invitation status: pending, active, inactive';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_created_at ON team_members(created_at);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
CREATE POLICY "Users can read members of their teams"
  ON team_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members AS tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can manage members"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members AS tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_members AS tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- Triggers for updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
DROP TRIGGER IF EXISTS update_bmad_projects_updated_at ON bmad_projects;
CREATE TRIGGER update_bmad_projects_updated_at
  BEFORE UPDATE ON bmad_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bmad_feedbacks_updated_at ON bmad_feedbacks;
CREATE TRIGGER update_bmad_feedbacks_updated_at
  BEFORE UPDATE ON bmad_feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to auto-increment feedbacks_count
-- ============================================
CREATE OR REPLACE FUNCTION increment_feedbacks_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bmad_projects 
  SET feedbacks_count = feedbacks_count + 1,
      monthly_feedbacks_count = monthly_feedbacks_count + 1
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_feedbacks_count ON bmad_feedbacks;
CREATE TRIGGER trg_increment_feedbacks_count
  AFTER INSERT ON bmad_feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION increment_feedbacks_count();

-- ============================================
-- Function to auto-decrement feedbacks_count on delete
-- ============================================
CREATE OR REPLACE FUNCTION decrement_feedbacks_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bmad_projects 
  SET feedbacks_count = GREATEST(0, feedbacks_count - 1)
  WHERE id = OLD.project_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decrement_feedbacks_count ON bmad_feedbacks;
CREATE TRIGGER trg_decrement_feedbacks_count
  AFTER DELETE ON bmad_feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION decrement_feedbacks_count();
