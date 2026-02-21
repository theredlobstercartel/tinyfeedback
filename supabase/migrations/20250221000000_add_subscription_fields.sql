-- Migration: Add subscription fields for Stripe integration
-- Story: ST-30 - Upgrade para Pro (Stripe)

-- Add subscription fields to bmad_projects table
ALTER TABLE bmad_projects ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE bmad_projects ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE bmad_projects ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE bmad_projects ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE bmad_projects ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN bmad_projects.stripe_customer_id IS 'Stripe Customer ID for billing';
COMMENT ON COLUMN bmad_projects.stripe_subscription_id IS 'Stripe Subscription ID';
COMMENT ON COLUMN bmad_projects.subscription_status IS 'Subscription status: active, canceled, past_due, etc.';
COMMENT ON COLUMN bmad_projects.subscription_period_start IS 'Current billing period start';
COMMENT ON COLUMN bmad_projects.subscription_period_end IS 'Current billing period end';

-- Create index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_bmad_projects_stripe_customer_id ON bmad_projects(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bmad_projects_stripe_subscription_id ON bmad_projects(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
