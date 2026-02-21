-- Migration: Add workflow_status field to feedbacks table
-- Story: ST-14 - Atualizar Status do Feedback

-- Add workflow_status column with check constraint for allowed values
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'new';

-- Add comment for documentation
COMMENT ON COLUMN feedbacks.workflow_status IS 'Workflow status: new (Novo), in_analysis (Em Análise), implemented (Implementado)';

-- Create index for better performance when filtering by workflow status
CREATE INDEX IF NOT EXISTS idx_feedbacks_workflow_status ON feedbacks(workflow_status);

-- Update existing feedbacks to have workflow_status matching their current status
UPDATE feedbacks SET workflow_status = 'new' WHERE workflow_status IS NULL;
