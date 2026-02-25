-- Migration: Create database trigger for webhook notifications (ST-11)
-- This trigger invokes the process-webhook Edge Function when feedback is created or updated

-- Create the function that will be triggered on feedback insert
CREATE OR REPLACE FUNCTION trigger_feedback_created_webhook()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  payload JSONB;
BEGIN
  -- Fetch project details
  SELECT id, name, slug INTO project_record
  FROM bmad_projects
  WHERE id = NEW.project_id;

  -- Prepare the payload
  payload := jsonb_build_object(
    'event', 'feedback.created',
    'project_id', NEW.project_id,
    'data', jsonb_build_object(
      'id', NEW.id,
      'project_id', NEW.project_id,
      'project_name', project_record.name,
      'type', NEW.type,
      'nps_score', NEW.nps_score,
      'title', NEW.title,
      'content', NEW.content,
      'screenshot_url', NEW.screenshot_url,
      'user_email', NEW.user_email,
      'user_id', NEW.user_id,
      'page_url', NEW.page_url,
      'user_agent', NEW.user_agent,
      'status', NEW.status,
      'workflow_status', NEW.workflow_status,
      'internal_notes', NEW.internal_notes,
      'response_sent', NEW.response_sent,
      'response_content', NEW.response_content,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    )
  );

  -- Invoke the edge function via pg_net extension (if available)
  -- This is an asynchronous operation that won't block the feedback insert
  BEGIN
    PERFORM net.http_post(
      url := COALESCE(
        current_setting('app.edge_function_url', true),
        'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/process-webhook'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body := payload
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the feedback insert
    RAISE NOTICE 'Failed to invoke webhook function: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS feedback_created_webhook_trigger ON feedbacks;

-- Create the trigger
CREATE TRIGGER feedback_created_webhook_trigger
  AFTER INSERT ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_feedback_created_webhook();

-- Add comment explaining the trigger
COMMENT ON TRIGGER feedback_created_webhook_trigger ON feedbacks IS 
  'Trigger that fires when a new feedback is inserted. Invokes the process-webhook Edge Function to notify configured webhooks.';

-- Create the function that will be triggered on feedback update
CREATE OR REPLACE FUNCTION trigger_feedback_updated_webhook()
RETURNS TRIGGER AS $$
DECLARE
  project_record RECORD;
  payload JSONB;
BEGIN
  -- Only trigger if relevant fields changed
  IF OLD.status IS DISTINCT FROM NEW.status OR 
     OLD.workflow_status IS DISTINCT FROM NEW.workflow_status OR
     OLD.response_sent IS DISTINCT FROM NEW.response_sent THEN
    
    -- Fetch project details
    SELECT id, name, slug INTO project_record
    FROM bmad_projects
    WHERE id = NEW.project_id;

    -- Prepare the payload
    payload := jsonb_build_object(
      'event', 'feedback.updated',
      'project_id', NEW.project_id,
      'data', jsonb_build_object(
        'id', NEW.id,
        'project_id', NEW.project_id,
        'project_name', project_record.name,
        'type', NEW.type,
        'nps_score', NEW.nps_score,
        'title', NEW.title,
        'content', NEW.content,
        'screenshot_url', NEW.screenshot_url,
        'user_email', NEW.user_email,
        'user_id', NEW.user_id,
        'page_url', NEW.page_url,
        'user_agent', NEW.user_agent,
        'status', NEW.status,
        'workflow_status', NEW.workflow_status,
        'internal_notes', NEW.internal_notes,
        'response_sent', NEW.response_sent,
        'response_content', NEW.response_content,
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at,
        -- Include old values for comparison
        'previous_status', OLD.status,
        'previous_workflow_status', OLD.workflow_status
      )
    );

    -- Invoke the edge function via pg_net extension (if available)
    BEGIN
      PERFORM net.http_post(
        url := COALESCE(
          current_setting('app.edge_function_url', true),
          'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/process-webhook'
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := payload
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the feedback update
      RAISE NOTICE 'Failed to invoke webhook function: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS feedback_updated_webhook_trigger ON feedbacks;

-- Create the trigger
CREATE TRIGGER feedback_updated_webhook_trigger
  AFTER UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_feedback_updated_webhook();

-- Add comment explaining the trigger
COMMENT ON TRIGGER feedback_updated_webhook_trigger ON feedbacks IS 
  'Trigger that fires when a feedback is updated. Invokes the process-webhook Edge Function to notify configured webhooks about status changes.';
