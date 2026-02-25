-- =============================================
-- WEBHOOKS MIGRATION
-- Migration: 00000000000001_webhooks.sql
-- Description: Webhooks configuration, delivery logs, and processing
-- STORY: ST-11 - Webhooks e Integrações
-- =============================================

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE webhook_event_type AS ENUM ('feedback.created', 'feedback.updated');
CREATE TYPE webhook_status AS ENUM ('active', 'inactive', 'disabled');
CREATE TYPE webhook_delivery_status AS ENUM ('pending', 'delivered', 'failed', 'retrying');
CREATE TYPE webhook_template_type AS ENUM ('default', 'slack', 'discord');

-- =============================================
-- TABLE: webhooks
-- Stores webhook configurations per project
-- =============================================
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Configuration
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret TEXT NOT NULL, -- HMAC signing secret
    status webhook_status NOT NULL DEFAULT 'active',
    
    -- Event subscriptions
    events webhook_event_type[] NOT NULL DEFAULT ARRAY['feedback.created']::webhook_event_type[],
    
    -- Template configuration
    template webhook_template_type NOT NULL DEFAULT 'default',
    custom_headers JSONB DEFAULT '{}', -- Additional headers to send
    
    -- Retry configuration
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_count INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    description TEXT,
    last_triggered_at TIMESTAMPTZ,
    last_delivery_status webhook_delivery_status,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE webhooks IS 'Webhook configurations for real-time notifications';
COMMENT ON COLUMN webhooks.secret IS 'HMAC-SHA256 signing secret (generate securely)';
COMMENT ON COLUMN webhooks.events IS 'Array of subscribed event types';
COMMENT ON COLUMN webhooks.template IS 'Payload template format';
COMMENT ON COLUMN webhooks.custom_headers IS 'Additional HTTP headers as JSON object';

-- =============================================
-- TABLE: webhook_deliveries
-- Logs all webhook delivery attempts
-- =============================================
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Event details
    event_type webhook_event_type NOT NULL,
    event_id UUID NOT NULL, -- Reference to the feedback that triggered this
    
    -- Request details
    payload JSONB NOT NULL,
    headers JSONB NOT NULL,
    signature TEXT NOT NULL, -- HMAC-SHA256 signature
    
    -- Response details
    status webhook_delivery_status NOT NULL DEFAULT 'pending',
    http_status_code INTEGER,
    response_body TEXT,
    response_headers JSONB,
    
    -- Timing
    request_started_at TIMESTAMPTZ,
    request_completed_at TIMESTAMPTZ,
    duration_ms INTEGER, -- Request duration in milliseconds
    
    -- Retry tracking
    attempt_number INTEGER NOT NULL DEFAULT 1,
    next_retry_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE webhook_deliveries IS 'Log of all webhook delivery attempts';
COMMENT ON COLUMN webhook_deliveries.payload IS 'The JSON payload sent';
COMMENT ON COLUMN webhook_deliveries.signature IS 'HMAC-SHA256 signature for verification';
COMMENT ON COLUMN webhook_deliveries.attempt_number IS 'Which retry attempt this was (1 = first)';

-- =============================================
-- INDEXES
-- =============================================

-- Webhooks indexes
CREATE INDEX idx_webhooks_project_id ON webhooks(project_id);
CREATE INDEX idx_webhooks_status ON webhooks(status) WHERE status = 'active';
CREATE INDEX idx_webhooks_project_status ON webhooks(project_id, status);

-- Webhook deliveries indexes
CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_project_id ON webhook_deliveries(project_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_event_id ON webhook_deliveries(event_id);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);
CREATE INDEX idx_webhook_deliveries_pending_retry ON webhook_deliveries(status, next_retry_at) 
    WHERE status = 'retrying';
CREATE INDEX idx_webhook_deliveries_retrying ON webhook_deliveries(status, attempt_number, next_retry_at)
    WHERE status IN ('pending', 'retrying');

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function: Generate secure webhook secret
CREATE OR REPLACE FUNCTION generate_webhook_secret()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate exponential backoff
-- Returns the next retry timestamp based on attempt number
CREATE OR REPLACE FUNCTION calculate_retry_backoff(
    p_attempt_number INTEGER,
    p_base_delay_seconds INTEGER DEFAULT 60,
    p_max_delay_seconds INTEGER DEFAULT 3600
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_delay_seconds INTEGER;
BEGIN
    -- Exponential backoff: 2^attempt * base_delay with jitter
    -- Attempt 1: ~60s, Attempt 2: ~120s, Attempt 3: ~240s, etc.
    v_delay_seconds := LEAST(
        p_base_delay_seconds * POWER(2, p_attempt_number - 1),
        p_max_delay_seconds
    );
    
    -- Add random jitter (±20%) to prevent thundering herd
    v_delay_seconds := v_delay_seconds * (0.8 + random() * 0.4);
    
    RETURN NOW() + (v_delay_seconds || ' seconds')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function: Sign webhook payload with HMAC-SHA256
CREATE OR REPLACE FUNCTION sign_webhook_payload(
    p_payload JSONB,
    p_secret TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_payload_text TEXT;
BEGIN
    -- Convert payload to canonical JSON string (sorted keys)
    v_payload_text := p_payload::TEXT;
    
    -- Return HMAC-SHA256 signature as hex
    RETURN encode(
        hmac(v_payload_text::bytea, p_secret::bytea, 'sha256'),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Update webhook updated_at
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Trigger webhook on feedback events
CREATE OR REPLACE FUNCTION trigger_webhooks_on_feedback()
RETURNS TRIGGER AS $$
DECLARE
    v_webhook RECORD;
    v_event_type webhook_event_type;
    v_payload JSONB;
    v_signature TEXT;
BEGIN
    -- Determine event type
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'feedback.created';
    ELSIF TG_OP = 'UPDATE' THEN
        v_event_type := 'feedback.updated';
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Get active webhooks for this project that subscribe to this event
    FOR v_webhook IN 
        SELECT w.* 
        FROM webhooks w
        WHERE w.project_id = COALESCE(NEW.project_id, OLD.project_id)
        AND w.status = 'active'
        AND v_event_type = ANY(w.events)
    LOOP
        -- Build payload based on template type
        v_payload := jsonb_build_object(
            'event', v_event_type,
            'timestamp', NOW()::TEXT,
            'webhook_id', v_webhook.id,
            'data', jsonb_build_object(
                'id', COALESCE(NEW.id, OLD.id),
                'project_id', COALESCE(NEW.project_id, OLD.project_id),
                'type', COALESCE(NEW.type, OLD.type),
                'content', COALESCE(NEW.content, OLD.content),
                'status', COALESCE(NEW.status, OLD.status),
                'user_email', COALESCE(NEW.user_email, OLD.user_email),
                'user_name', COALESCE(NEW.user_name, OLD.user_name),
                'created_at', COALESCE(NEW.created_at, OLD.created_at),
                'updated_at', COALESCE(NEW.updated_at, OLD.updated_at)
            )
        );
        
        -- Apply template transformation if needed
        IF v_webhook.template = 'slack' THEN
            v_payload := transform_to_slack_payload(v_payload);
        ELSIF v_webhook.template = 'discord' THEN
            v_payload := transform_to_discord_payload(v_payload);
        END IF;
        
        -- Generate signature
        v_signature := sign_webhook_payload(v_payload, v_webhook.secret);
        
        -- Create delivery record
        INSERT INTO webhook_deliveries (
            webhook_id,
            project_id,
            event_type,
            event_id,
            payload,
            headers,
            signature,
            status,
            attempt_number,
            next_retry_at
        ) VALUES (
            v_webhook.id,
            v_webhook.project_id,
            v_event_type,
            COALESCE(NEW.id, OLD.id),
            v_payload,
            jsonb_build_object(
                'Content-Type', 'application/json',
                'X-Webhook-ID', v_webhook.id::TEXT,
                'X-Event-Type', v_event_type,
                'X-Webhook-Signature', v_signature,
                'X-Webhook-Version', '1.0'
            ) || COALESCE(v_webhook.custom_headers, '{}'::JSONB),
            v_signature,
            'pending',
            1,
            NOW() -- Process immediately
        );
        
        -- Update webhook last_triggered_at
        UPDATE webhooks 
        SET last_triggered_at = NOW()
        WHERE id = v_webhook.id;
    END LOOP;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function: Transform payload to Slack format
CREATE OR REPLACE FUNCTION transform_to_slack_payload(
    p_payload JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_event_type TEXT;
    v_feedback_data JSONB;
    v_color TEXT;
    v_title TEXT;
    v_text TEXT;
BEGIN
    v_event_type := p_payload->>'event';
    v_feedback_data := p_payload->'data';
    
    -- Set color and title based on event type
    IF v_event_type = 'feedback.created' THEN
        v_color := '#36a64f'; -- Green
        v_title := '📝 Novo Feedback Recebido';
    ELSE
        v_color := '#f2c744'; -- Yellow
        v_title := '🔄 Feedback Atualizado';
    END IF;
    
    -- Build text based on feedback type
    CASE v_feedback_data->>'type'
        WHEN 'nps' THEN
            v_text := format(
                '*NPS Score:* %s/10\n*Comentário:* %s',
                COALESCE(v_feedback_data->'content'->>'score', 'N/A'),
                COALESCE(v_feedback_data->'content'->>'comment', 'Sem comentário')
            );
        WHEN 'suggestion' THEN
            v_text := format(
                '*Título:* %s\n*Descrição:* %s',
                COALESCE(v_feedback_data->'content'->>'title', 'Sem título'),
                COALESCE(v_feedback_data->'content'->>'description', 'Sem descrição')
            );
        WHEN 'bug' THEN
            v_text := format(
                '*Descrição:* %s\n*Prioridade:* %s',
                COALESCE(v_feedback_data->'content'->>'description', 'Sem descrição'),
                COALESCE(v_feedback_data->>'priority', 'N/A')
            );
        ELSE
            v_text := 'Ver detalhes no dashboard.';
    END CASE;
    
    RETURN jsonb_build_object(
        'text', v_title,
        'attachments', jsonb_build_array(
            jsonb_build_object(
                'color', v_color,
                'title', v_title,
                'text', v_text,
                'fields', jsonb_build_array(
                    jsonb_build_object('title', 'Tipo', 'value', v_feedback_data->>'type', 'short', true),
                    jsonb_build_object('title', 'Status', 'value', v_feedback_data->>'status', 'short', true),
                    jsonb_build_object('title', 'Usuário', 'value', COALESCE(v_feedback_data->>'user_name', 'Anônimo'), 'short', true),
                    jsonb_build_object('title', 'Email', 'value', COALESCE(v_feedback_data->>'user_email', 'N/A'), 'short', true)
                ),
                'footer', 'TinyFeedback',
                'ts', EXTRACT(EPOCH FROM NOW())::BIGINT
            )
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Transform payload to Discord format
CREATE OR REPLACE FUNCTION transform_to_discord_payload(
    p_payload JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_event_type TEXT;
    v_feedback_data JSONB;
    v_color INTEGER;
    v_title TEXT;
    v_description TEXT;
BEGIN
    v_event_type := p_payload->>'event';
    v_feedback_data := p_payload->'data';
    
    -- Set color and title based on event type (Discord uses integer colors)
    IF v_event_type = 'feedback.created' THEN
        v_color := 3066993; -- Green (#36a64f)
        v_title := '📝 Novo Feedback Recebido';
    ELSE
        v_color := 15844367; -- Yellow (#f2c744)
        v_title := '🔄 Feedback Atualizado';
    END IF;
    
    -- Build description based on feedback type
    CASE v_feedback_data->>'type'
        WHEN 'nps' THEN
            v_description := format(
                '**NPS Score:** %s/10\n**Comentário:** %s',
                COALESCE(v_feedback_data->'content'->>'score', 'N/A'),
                COALESCE(v_feedback_data->'content'->>'comment', 'Sem comentário')
            );
        WHEN 'suggestion' THEN
            v_description := format(
                '**Título:** %s\n**Descrição:** %s',
                COALESCE(v_feedback_data->'content'->>'title', 'Sem título'),
                COALESCE(v_feedback_data->'content'->>'description', 'Sem descrição')
            );
        WHEN 'bug' THEN
            v_description := format(
                '**Descrição:** %s\n**Prioridade:** %s',
                COALESCE(v_feedback_data->'content'->>'description', 'Sem descrição'),
                COALESCE(v_feedback_data->>'priority', 'N/A')
            );
        ELSE
            v_description := 'Ver detalhes no dashboard.';
    END CASE;
    
    RETURN jsonb_build_object(
        'embeds', jsonb_build_array(
            jsonb_build_object(
                'title', v_title,
                'description', v_description,
                'color', v_color,
                'fields', jsonb_build_array(
                    jsonb_build_object('name', 'Tipo', 'value', v_feedback_data->>'type', 'inline', true),
                    jsonb_build_object('name', 'Status', 'value', v_feedback_data->>'status', 'inline', true),
                    jsonb_build_object('name', 'Usuário', 'value', COALESCE(v_feedback_data->>'user_name', 'Anônimo'), 'inline', true),
                    jsonb_build_object('name', 'Email', 'value', COALESCE(v_feedback_data->>'user_email', 'N/A'), 'inline', true)
                ),
                'footer', jsonb_build_object('text', 'TinyFeedback'),
                'timestamp', NOW()::TEXT
            )
        )
    );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update timestamps on webhooks
CREATE TRIGGER webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_webhook_updated_at();

-- Trigger webhooks on feedback changes
CREATE TRIGGER feedback_webhook_trigger 
    AFTER INSERT OR UPDATE ON feedbacks
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_webhooks_on_feedback();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Webhooks RLS policies
CREATE POLICY "Users can view webhooks of their projects" ON webhooks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = webhooks.project_id 
            AND (p.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
        )
    );

CREATE POLICY "Users can create webhooks for their projects" ON webhooks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = webhooks.project_id 
            AND (p.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')))
        )
    );

CREATE POLICY "Users can update webhooks of their projects" ON webhooks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = webhooks.project_id 
            AND (p.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')))
        )
    );

CREATE POLICY "Users can delete webhooks of their projects" ON webhooks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = webhooks.project_id 
            AND (p.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')))
        )
    );

-- Webhook deliveries RLS policies
CREATE POLICY "Users can view webhook deliveries of their projects" ON webhook_deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = webhook_deliveries.project_id 
            AND (p.user_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = p.team_id AND tm.user_id = auth.uid()))
        )
    );

-- =============================================
-- RPC FUNCTIONS FOR WEBHOOK MANAGEMENT
-- =============================================

-- Function: Get pending webhook deliveries for processing
CREATE OR REPLACE FUNCTION get_pending_webhook_deliveries(
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    delivery_id UUID,
    webhook_id UUID,
    project_id UUID,
    url TEXT,
    secret TEXT,
    event_type webhook_event_type,
    payload JSONB,
    headers JSONB,
    attempt_number INTEGER,
    max_retries INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wd.id as delivery_id,
        wd.webhook_id,
        wd.project_id,
        w.url,
        w.secret,
        wd.event_type,
        wd.payload,
        wd.headers,
        wd.attempt_number,
        w.max_retries
    FROM webhook_deliveries wd
    JOIN webhooks w ON wd.webhook_id = w.id
    WHERE wd.status IN ('pending', 'retrying')
    AND (wd.next_retry_at IS NULL OR wd.next_retry_at <= NOW())
    AND w.status = 'active'
    AND wd.attempt_number <= w.max_retries
    ORDER BY wd.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update webhook delivery status
CREATE OR REPLACE FUNCTION update_webhook_delivery_status(
    p_delivery_id UUID,
    p_status webhook_delivery_status,
    p_http_status_code INTEGER DEFAULT NULL,
    p_response_body TEXT DEFAULT NULL,
    p_response_headers JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_webhook_id UUID;
    v_attempt_number INTEGER;
    v_max_retries INTEGER;
BEGIN
    -- Get current delivery info
    SELECT wd.webhook_id, wd.attempt_number, w.max_retries
    INTO v_webhook_id, v_attempt_number, v_max_retries
    FROM webhook_deliveries wd
    JOIN webhooks w ON wd.webhook_id = w.id
    WHERE wd.id = p_delivery_id;
    
    -- Update delivery record
    UPDATE webhook_deliveries
    SET 
        status = p_status,
        http_status_code = p_http_status_code,
        response_body = p_response_body,
        response_headers = p_response_headers,
        error_message = p_error_message,
        duration_ms = p_duration_ms,
        request_completed_at = NOW(),
        next_retry_at = CASE 
            WHEN p_status = 'failed' AND v_attempt_number < v_max_retries THEN
                calculate_retry_backoff(v_attempt_number + 1)
            ELSE NULL
        END
    WHERE id = p_delivery_id;
    
    -- Update webhook status based on result
    IF p_status = 'delivered' THEN
        UPDATE webhooks
        SET last_delivery_status = 'delivered',
            retry_count = 0
        WHERE id = v_webhook_id;
    ELSIF p_status = 'failed' AND v_attempt_number >= v_max_retries THEN
        UPDATE webhooks
        SET last_delivery_status = 'failed',
            retry_count = retry_count + 1
        WHERE id = v_webhook_id;
    ELSIF p_status = 'retrying' THEN
        UPDATE webhooks
        SET retry_count = retry_count + 1
        WHERE id = v_webhook_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Regenerate webhook secret
CREATE OR REPLACE FUNCTION regenerate_webhook_secret(
    p_webhook_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_new_secret TEXT;
BEGIN
    v_new_secret := generate_webhook_secret();
    
    UPDATE webhooks
    SET secret = v_new_secret,
        updated_at = NOW()
    WHERE id = p_webhook_id;
    
    RETURN v_new_secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get webhook delivery stats for a project
CREATE OR REPLACE FUNCTION get_webhook_stats(
    p_project_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_deliveries BIGINT,
    successful_deliveries BIGINT,
    failed_deliveries BIGINT,
    retrying_deliveries BIGINT,
    success_rate NUMERIC,
    avg_duration_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_deliveries,
        COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as successful_deliveries,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_deliveries,
        COUNT(*) FILTER (WHERE status = 'retrying')::BIGINT as retrying_deliveries,
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC / COUNT(*)) * 100, 2)
        END as success_rate,
        ROUND(AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL), 2) as avg_duration_ms
    FROM webhook_deliveries
    WHERE project_id = p_project_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_pending_webhook_deliveries IS 'Returns webhooks ready for delivery processing';
COMMENT ON FUNCTION update_webhook_delivery_status IS 'Updates the status of a webhook delivery attempt';
COMMENT ON FUNCTION regenerate_webhook_secret IS 'Generates a new secret for a webhook';
COMMENT ON FUNCTION get_webhook_stats IS 'Returns delivery statistics for a project';
