-- Migration: Create projects table with api_key field
-- Story: ST-17 - Criar Projeto com API Key

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    widget_color VARCHAR(7) DEFAULT '#00ff88',
    widget_position VARCHAR(20) DEFAULT 'bottom-right',
    widget_text VARCHAR(100) DEFAULT 'Feedback',
    allowed_domains TEXT[] DEFAULT '{}',
    plan VARCHAR(20) DEFAULT 'free',
    feedbacks_count INTEGER DEFAULT 0,
    max_feedbacks INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on api_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key);

-- Create index on user_id for faster user project lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- Add comments for documentation
COMMENT ON TABLE projects IS 'Projects that use the TinyFeedback widget';
COMMENT ON COLUMN projects.api_key IS 'Unique API key for widget integration (format: tf_live_xxxxxx)';
COMMENT ON COLUMN projects.slug IS 'URL-friendly project name';
COMMENT ON COLUMN projects.allowed_domains IS 'List of domains allowed to use the widget';

-- Enable RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own projects
CREATE POLICY IF NOT EXISTS "Users can view own projects" 
    ON projects FOR SELECT 
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own projects
CREATE POLICY IF NOT EXISTS "Users can create own projects" 
    ON projects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own projects
CREATE POLICY IF NOT EXISTS "Users can update own projects" 
    ON projects FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own projects
CREATE POLICY IF NOT EXISTS "Users can delete own projects" 
    ON projects FOR DELETE 
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
