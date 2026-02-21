-- Migration: Add monthly feedback counter for Free plan
-- Story: ST-29 - Contador de Feedbacks no Plano Free

-- Add monthly feedback counter fields to bmad_projects table
ALTER TABLE bmad_projects ADD COLUMN IF NOT EXISTS monthly_feedbacks_count INTEGER DEFAULT 0;
ALTER TABLE bmad_projects ADD COLUMN IF NOT EXISTS monthly_feedbacks_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN bmad_projects.monthly_feedbacks_count IS 'Number of feedbacks received in current month (for Free plan quota)';
COMMENT ON COLUMN bmad_projects.monthly_feedbacks_reset_at IS 'Timestamp when monthly counter was last reset';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_bmad_projects_monthly_reset ON bmad_projects(monthly_feedbacks_reset_at);

-- Create function to reset monthly counter automatically
CREATE OR REPLACE FUNCTION reset_monthly_feedback_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset counter if it's a new month
  IF NEW.monthly_feedbacks_reset_at IS NULL OR 
     DATE_TRUNC('month', NEW.monthly_feedbacks_reset_at) < DATE_TRUNC('month', NOW()) THEN
    NEW.monthly_feedbacks_count := 0;
    NEW.monthly_feedbacks_reset_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-reset on update
DROP TRIGGER IF EXISTS trg_reset_monthly_counter ON bmad_projects;
CREATE TRIGGER trg_reset_monthly_counter
  BEFORE UPDATE ON bmad_projects
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_feedback_counter();
