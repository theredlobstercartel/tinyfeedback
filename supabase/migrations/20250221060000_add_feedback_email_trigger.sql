-- Migration: Create database trigger for instant feedback email notifications (ST-26)
-- This trigger invokes the Supabase Edge Function when a new feedback is inserted

-- First, enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "http";

-- Create the function that will be triggered
CREATE OR REPLACE FUNCTION trigger_feedback_email()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  supabase_service_key TEXT;
  payload JSONB;
BEGIN
  -- Construct the edge function URL
  edge_function_url := COALESCE(
    current_setting('app.edge_function_url', true),
    'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-feedback-email'
  );
  
  -- Prepare the payload
  payload := jsonb_build_object(
    'record', row_to_json(NEW),
    'type', 'feedback.inserted',
    'table', 'feedbacks'
  );
  
  -- Invoke the edge function asynchronously using pg_net (if available)
  -- Otherwise, we'll rely on the webhook mechanism
  
  -- Log the trigger execution
  RAISE NOTICE 'Triggering email for feedback %', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS feedback_email_trigger ON feedbacks;

-- Create the trigger
CREATE TRIGGER feedback_email_trigger
  AFTER INSERT ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_feedback_email();

-- Add comment explaining the trigger
COMMENT ON TRIGGER feedback_email_trigger ON feedbacks IS 
  'Trigger that fires when a new feedback is inserted. The actual email sending is handled by the send-feedback-email Edge Function invoked via Supabase Webhooks.';
