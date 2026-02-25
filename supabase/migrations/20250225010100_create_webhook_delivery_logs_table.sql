-- Migration: Create webhook_delivery_logs table for tracking webhook deliveries
-- Story: ST-11 - Webhooks e Integrações

-- Create webhook_delivery_logs table
CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- feedback.created, feedback.updated
  payload JSONB NOT NULL,
  status TEXT NOT NULL, -- pending, delivered, failed
  http_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  signature TEXT NOT NULL, -- HMAC-SHA256 signature used
  attempt_count INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE webhook_delivery_logs IS 'Logs of webhook delivery attempts';
COMMENT ON COLUMN webhook_delivery_logs.webhook_id IS 'Reference to the webhook configuration';
COMMENT ON COLUMN webhook_delivery_logs.event_type IS 'Event type that triggered the webhook';
COMMENT ON COLUMN webhook_delivery_logs.payload IS 'Payload sent to the webhook';
COMMENT ON COLUMN webhook_delivery_logs.status IS 'Delivery status: pending, delivered, failed';
COMMENT ON COLUMN webhook_delivery_logs.http_status_code IS 'HTTP status code from the response';
COMMENT ON COLUMN webhook_delivery_logs.response_body IS 'Response body from the webhook endpoint';
COMMENT ON COLUMN webhook_delivery_logs.error_message IS 'Error message if delivery failed';
COMMENT ON COLUMN webhook_delivery_logs.signature IS 'HMAC-SHA256 signature used for this delivery';
COMMENT ON COLUMN webhook_delivery_logs.attempt_count IS 'Number of delivery attempts made';
COMMENT ON COLUMN webhook_delivery_logs.max_attempts IS 'Maximum number of retry attempts';
COMMENT ON COLUMN webhook_delivery_logs.next_retry_at IS 'Timestamp for next retry attempt';
COMMENT ON COLUMN webhook_delivery_logs.delivered_at IS 'Timestamp when webhook was successfully delivered';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_webhook_id ON webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_status ON webhook_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_event_type ON webhook_delivery_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_created_at ON webhook_delivery_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_next_retry_at ON webhook_delivery_logs(next_retry_at) WHERE status = 'pending';

-- Enable RLS on the table
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to read their own project's webhook delivery logs
CREATE POLICY "Users can read their project webhook delivery logs"
  ON webhook_delivery_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks 
      JOIN bmad_projects ON bmad_projects.id = webhooks.project_id
      WHERE webhooks.id = webhook_delivery_logs.webhook_id 
      AND bmad_projects.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_delivery_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_webhook_delivery_logs_updated_at ON webhook_delivery_logs;
CREATE TRIGGER update_webhook_delivery_logs_updated_at
  BEFORE UPDATE ON webhook_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_delivery_logs_updated_at();
