-- =============================================
-- SEED DATA FOR DEVELOPMENT
-- =============================================

-- =============================================
-- EXTENSIONS (ensure they exist)
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- SEED USERS
-- =============================================

-- Insert test users (password would be set via Supabase Auth)
INSERT INTO users (id, email, name, avatar_url, plan, stripe_customer_id, email_preferences, created_at, updated_at)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'demo@tinyfeedback.dev', 'Demo User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', 'free', NULL, '{"new_feedback": true, "status_change": false, "daily_digest": false, "weekly_digest": true, "quota_alert": true}', NOW() - INTERVAL '30 days', NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'pro@tinyfeedback.dev', 'Pro User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro', 'pro', 'cus_test_pro_user', '{"new_feedback": true, "status_change": true, "daily_digest": false, "weekly_digest": true, "quota_alert": true}', NOW() - INTERVAL '60 days', NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'team@tinyfeedback.dev', 'Team Owner', 'https://api.dicebear.com/7.x/avataaars/svg?seed=team', 'pro', 'cus_test_team_owner', '{"new_feedback": true, "status_change": false, "daily_digest": true, "weekly_digest": true, "quota_alert": true}', NOW() - INTERVAL '45 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SEED TEAMS
-- =============================================

INSERT INTO teams (id, name, slug, owner_id, settings, created_at, updated_at)
VALUES 
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Engineering Team', 'engineering', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '{"notifications": {"slack_webhook": null}, "default_categories": ["Bug", "Feature", "Improvement"]}', NOW() - INTERVAL '45 days', NOW()),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Product Team', 'product', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '{"notifications": {"slack_webhook": null}, "default_categories": ["UX", "Performance", "Bug"]}', NOW() - INTERVAL '30 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SEED TEAM MEMBERS
-- =============================================

INSERT INTO team_members (id, team_id, user_id, role, joined_at, created_at, updated_at)
VALUES 
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'owner', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NOW()),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'member', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW()),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'owner', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW()),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'admin', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SEED PROJECTS
-- =============================================

INSERT INTO projects (id, user_id, team_id, name, website_url, api_key, allowed_domains, settings, is_active, created_at, updated_at)
VALUES 
    -- Free tier personal projects
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'Personal Blog', 'https://demo-blog.tinyfeedback.dev', 'tf_' || encode(gen_random_bytes(30), 'hex'), ARRAY['demo-blog.tinyfeedback.dev', 'localhost'], '{"widget": {"position": "bottom-right", "primaryColor": "#3B82F6", "labels": {"nps": "Como você avalia nosso blog?", "suggestion": "Sugestão", "bug": "Reportar um problema"}, "categories": ["Conteúdo", "Design", "Performance"]}}', TRUE, NOW() - INTERVAL '25 days', NOW()),
    
    -- Pro tier personal projects
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NULL, 'SaaS Dashboard', 'https://dashboard.example.com', 'tf_' || encode(gen_random_bytes(30), 'hex'), ARRAY['dashboard.example.com', 'app.example.com', 'localhost'], '{"widget": {"position": "bottom-left", "primaryColor": "#10B981", "labels": {"nps": "How likely are you to recommend us?", "suggestion": "Feature Request", "bug": "Report Bug"}, "categories": ["Feature", "Bug", "UX", "Performance"]}}', TRUE, NOW() - INTERVAL '50 days', NOW()),
    
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a43', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NULL, 'Landing Page', 'https://landing.example.com', 'tf_' || encode(gen_random_bytes(30), 'hex'), ARRAY['landing.example.com', 'www.example.com'], '{"widget": {"position": "bottom-right", "primaryColor": "#8B5CF6", "labels": {"nps": "What do you think of our product?", "suggestion": "Suggestion", "bug": "Found an issue?"}, "categories": ["General", "Pricing", "Features"]}}', TRUE, NOW() - INTERVAL '30 days', NOW()),
    
    -- Team projects
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Internal Tools', 'https://internal.company.com', 'tf_' || encode(gen_random_bytes(30), 'hex'), ARRAY['internal.company.com', 'tools.company.com', 'localhost'], '{"widget": {"position": "bottom-right", "primaryColor": "#F59E0B", "labels": {"nps": "Rate your experience", "suggestion": "Improvement", "bug": "Bug Report"}, "categories": ["Bug", "Feature", "Performance", "Security"]}}', TRUE, NOW() - INTERVAL '40 days', NOW()),
    
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a45', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Product Analytics', 'https://analytics.company.com', 'tf_' || encode(gen_random_bytes(30), 'hex'), ARRAY['analytics.company.com'], '{"widget": {"position": "top-right", "primaryColor": "#EC4899", "labels": {"nps": "How satisfied are you?", "suggestion": "Feature Idea", "bug": "Report Issue"}, "categories": ["Visualization", "Data", "Performance", "Bug"]}}', TRUE, NOW() - INTERVAL '25 days', NOW()),
    
    -- Inactive project
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a46', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NULL, 'Old Project', 'https://old.tinyfeedback.dev', 'tf_' || encode(gen_random_bytes(30), 'hex'), ARRAY['old.tinyfeedback.dev'], '{"widget": {"position": "bottom-right", "primaryColor": "#6B7280", "labels": {"nps": "Rate us", "suggestion": "Suggestion", "bug": "Bug"}, "categories": ["General"]}}', FALSE, NOW() - INTERVAL '90 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SEED FEEDBACKS
-- =============================================

-- Helper to get project IDs
DO $$
DECLARE
    v_blog_project UUID := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41';
    v_saas_project UUID := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42';
    v_landing_project UUID := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a43';
    v_internal_project UUID := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
    v_analytics_project UUID := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a45';
BEGIN

-- NPS Feedbacks for Blog Project
INSERT INTO feedbacks (id, project_id, type, content, user_id, user_email, user_name, user_metadata, status, status_history, technical_context, ip_address, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), v_blog_project, 'nps', '{"score": 9, "comment": "Great content! Love the articles."}'::jsonb, 'user_001', 'reader1@example.com', 'John Doe', '{"browser": "Chrome", "os": "macOS"}', 'implemented', '[{"status": "new", "changed_by": "system", "changed_at": "' || NOW() - INTERVAL '20 days' || '"}, {"status": "analyzing", "changed_by": "' || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' || '", "changed_at": "' || NOW() - INTERVAL '18 days' || '"}, {"status": "implemented", "changed_by": "' || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' || '", "changed_at": "' || NOW() - INTERVAL '10 days' || '", "note": "Thanked user via email"}]'::jsonb, '{"browser": "Chrome 120", "os": "macOS 14", "viewport": "1920x1080", "url": "/blog/post-1"}'::jsonb, '192.168.1.100'::inet, NOW() - INTERVAL '20 days', NOW()),
    (uuid_generate_v4(), v_blog_project, 'nps', '{"score": 10, "comment": "Best tech blog ever!"}'::jsonb, 'user_002', 'reader2@example.com', 'Jane Smith', '{"browser": "Firefox", "os": "Windows"}', 'new', '[{"status": "new", "changed_by": "system", "changed_at": "' || NOW() - INTERVAL '5 days' || '"}]'::jsonb, '{"browser": "Firefox 121", "os": "Windows 11", "viewport": "2560x1440", "url": "/blog/post-2"}'::jsonb, '192.168.1.101'::inet, NOW() - INTERVAL '5 days', NOW()),
    (uuid_generate_v4(), v_blog_project, 'nps', '{"score": 7, "comment": "Good but could be better"}'::jsonb, NULL, NULL, NULL, NULL, 'analyzing', '[{"status": "new", "changed_by": "system", "changed_at": "' || NOW() - INTERVAL '3 days' || '"}, {"status": "analyzing", "changed_by": "' || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' || '", "changed_at": "' || NOW() - INTERVAL '1 day' || '", "note": "Looking into improving content"}]'::jsonb, '{"browser": "Safari", "os": "iOS", "viewport": "390x844", "url": "/blog/post-3"}'::jsonb, '192.168.1.102'::inet, NOW() - INTERVAL '3 days', NOW()),
    (uuid_generate_v4(), v_blog_project, 'nps', '{"score": 3, "comment": "Hard to navigate"}'::jsonb, 'user_003', NULL, NULL, '{"browser": "Chrome", "os": "Android"}', 'new', '[{"status": "new", "changed_by": "system", "changed_at": "' || NOW() - INTERVAL '1 day' || '"}]'::jsonb, '{"browser": "Chrome Mobile", "os": "Android 14", "viewport": "412x915", "url": "/blog"}'::jsonb, '192.168.1.103'::inet, NOW() - INTERVAL '1 day', NOW()),
    (uuid_generate_v4(), v_blog_project, 'nps', '{"score": 8, "comment": "Nice design"}'::jsonb, NULL, NULL, NULL, NULL, 'new', '[{"status": "new", "changed_by": "system", "changed_at": "' || NOW() - INTERVAL '12 hours' || '"}]'::jsonb, '{"browser": "Edge", "os": "Windows", "viewport": "1366x768", "url": "/blog/about"}'::jsonb, '192.168.1.104'::inet, NOW() - INTERVAL '12 hours', NOW());

-- Suggestion Feedbacks for SaaS Dashboard
INSERT INTO feedbacks (id, project_id, type, content, user_id, user_email, user_name, user_metadata, status, technical_context, ip_address, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), v_saas_project, 'suggestion', '{"title": "Dark mode support", "description": "Would love to have a dark mode option for the dashboard. It would be easier on the eyes during night shifts.", "category": "Feature"}'::jsonb, 'saas_user_001', 'customer1@company.com', 'Mike Johnson', '{"company": "TechCorp", "plan": "enterprise"}', 'implemented', '{"browser": "Chrome 120", "os": "macOS 14.2", "viewport": "2560x1440", "url": "/dashboard/settings"}'::jsonb, '10.0.0.50'::inet, NOW() - INTERVAL '45 days', NOW()),
    (uuid_generate_v4(), v_saas_project, 'suggestion', '{"title": "Export to CSV", "description": "Need the ability to export reports to CSV format for Excel analysis.", "category": "Feature"}'::jsonb, 'saas_user_002', 'analyst@bigcorp.com', 'Sarah Wilson', '{"department": "Analytics"}', 'analyzing', '{"browser": "Firefox 121", "os": "Windows 11", "viewport": "1920x1080", "url": "/dashboard/reports"}'::jsonb, '10.0.0.51'::inet, NOW() - INTERVAL '10 days', NOW()),
    (uuid_generate_v4(), v_saas_project, 'suggestion', '{"title": "Mobile app", "description": "A mobile app would be great for checking metrics on the go.", "category": "Feature"}'::jsonb, NULL, NULL, NULL, NULL, 'new', '{"browser": "Safari Mobile", "os": "iOS 17", "viewport": "390x844", "url": "/dashboard"}'::jsonb, '10.0.0.52'::inet, NOW() - INTERVAL '2 days', NOW()),
    (uuid_generate_v4(), v_saas_project, 'suggestion', '{"title": "Better filtering", "description": "Add more advanced filtering options to the data tables.", "category": "Improvement"}'::jsonb, 'saas_user_003', 'dev@startup.io', 'Alex Chen', '{"role": "developer"}', 'new', '{"browser": "Chrome 119", "os": "Linux", "viewport": "3440x1440", "url": "/dashboard/data"}'::jsonb, '10.0.0.53'::inet, NOW() - INTERVAL '1 day', NOW());

-- Bug Reports for Landing Page
INSERT INTO feedbacks (id, project_id, type, content, user_id, user_email, user_name, status, priority, technical_context, ip_address, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), v_landing_project, 'bug', '{"description": "The pricing page crashes when I click on the Enterprise plan button.", "contactEmail": "test@user.com", "includeTechnicalInfo": true}'::jsonb, 'landing_user_001', 'test@user.com', 'Tom Brown', 'analyzing', 'high', '{"browser": "Chrome 118", "os": "Windows 10", "viewport": "1920x1080", "url": "/pricing", "console_errors": ["Uncaught TypeError: Cannot read property"]}'::jsonb, '172.16.0.10'::inet, NOW() - INTERVAL '7 days', NOW()),
    (uuid_generate_v4(), v_landing_project, 'bug', '{"description": "Images are not loading on the features page. Getting 404 errors.", "contactEmail": null, "includeTechnicalInfo": true}'::jsonb, NULL, NULL, NULL, 'new', 'medium', '{"browser": "Firefox 120", "os": "macOS 13", "viewport": "1440x900", "url": "/features", "console_errors": ["Failed to load resource: 404"]}'::jsonb, '172.16.0.11'::inet, NOW() - INTERVAL '3 days', NOW()),
    (uuid_generate_v4(), v_landing_project, 'bug', '{"description": "Form submission is very slow, takes about 10 seconds.", "contactEmail": "slow@form.com", "includeTechnicalInfo": true}'::jsonb, 'landing_user_002', 'slow@form.com', 'Lisa Davis', 'implemented', 'medium', '{"browser": "Safari 17", "os": "macOS 14", "viewport": "1680x1050", "url": "/contact", "network_info": "Slow 3G"}'::jsonb, '172.16.0.12'::inet, NOW() - INTERVAL '14 days', NOW()),
    (uuid_generate_v4(), v_landing_project, 'bug', '{"description": "Typo in the footer - 'suscribe' instead of 'subscribe'", "contactEmail": null, "includeTechnicalInfo": false}'::jsonb, NULL, NULL, NULL, 'implemented', 'low', '{"browser": "Edge 120", "os": "Windows 11", "viewport": "1920x1080", "url": "/"}'::jsonb, '172.16.0.13'::inet, NOW() - INTERVAL '5 days', NOW()),
    (uuid_generate_v4(), v_landing_project, 'bug', '{"description": "The site is completely broken on Internet Explorer 11.", "contactEmail": "legacy@company.com", "includeTechnicalInfo": true}'::jsonb, 'landing_user_003', 'legacy@company.com', 'Old School Dev', 'archived', 'low', '{"browser": "IE 11", "os": "Windows 7", "viewport": "1366x768", "url": "/", "console_errors": ["SCRIPT5007: Unable to get property"]}'::jsonb, '172.16.0.14'::inet, NOW() - INTERVAL '30 days', NOW());

-- More NPS for Analytics Project (to show variety)
INSERT INTO feedbacks (id, project_id, type, content, user_id, user_email, user_name, status, technical_context, ip_address, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), v_analytics_project, 'nps', '{"score": 10, "comment": "Incredible insights! Changed how we make decisions."}'::jsonb, 'analytics_user_001', 'ceo@dataco.com', 'Robert CEO', 'implemented', '{"browser": "Chrome 120", "os": "macOS 14", "viewport": "3024x1964", "url": "/analytics/reports"}'::jsonb, '192.168.10.1'::inet, NOW() - INTERVAL '15 days', NOW()),
    (uuid_generate_v4(), v_analytics_project, 'nps', '{"score": 9, "comment": "Very powerful tool, though learning curve is steep."}'::jsonb, 'analytics_user_002', 'pm@product.io', 'Emily PM', 'new', '{"browser": "Safari", "os": "macOS", "viewport": "2560x1440", "url": "/analytics/dashboard"}'::jsonb, '192.168.10.2'::inet, NOW() - INTERVAL '8 days', NOW()),
    (uuid_generate_v4(), v_analytics_project, 'nps', '{"score": 6, "comment": "Good features but expensive for small teams."}'::jsonb, NULL, NULL, NULL, 'analyzing', '{"browser": "Firefox", "os": "Ubuntu", "viewport": "1920x1080", "url": "/analytics/pricing"}'::jsonb, '192.168.10.3'::inet, NOW() - INTERVAL '4 days', NOW()),
    (uuid_generate_v4(), v_analytics_project, 'nps', '{"score": 2, "comment": "Data sync is constantly failing. Very frustrating."}'::jsonb, 'analytics_user_003', 'frustrated@user.com', 'Angry Customer', 'analyzing', '{"browser": "Chrome 119", "os": "Windows 10", "viewport": "1366x768", "url": "/analytics/sync"}'::jsonb, '192.168.10.4'::inet, NOW() - INTERVAL '2 days', NOW());

-- More suggestions for Internal Tools
INSERT INTO feedbacks (id, project_id, type, content, user_id, user_email, user_name, status, technical_context, ip_address, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), v_internal_project, 'suggestion', '{"title": "Integrate with Slack", "description": "Would be great to get notifications in Slack when builds complete.", "category": "Feature"}'::jsonb, 'internal_001', 'dev1@company.com', 'Developer One', 'new', '{"browser": "Chrome", "os": "macOS", "viewport": "2560x1440", "url": "/tools/ci-cd"}'::jsonb, '10.0.1.10'::inet, NOW() - INTERVAL '6 days', NOW()),
    (uuid_generate_v4(), v_internal_project, 'suggestion', '{"title": "Better error messages", "description": "Current error messages are cryptic and hard to understand.", "category": "Improvement"}'::jsonb, 'internal_002', 'dev2@company.com', 'Developer Two', 'analyzing', '{"browser": "Firefox", "os": "Linux", "viewport": "1920x1080", "url": "/tools/deploy"}'::jsonb, '10.0.1.11'::inet, NOW() - INTERVAL '3 days', NOW()),
    (uuid_generate_v4(), v_internal_project, 'bug', '{"description": "The deployment button doesn't work - critical issue!", "contactEmail": "urgent@company.com", "includeTechnicalInfo": true}'::jsonb, 'internal_003', 'urgent@company.com', 'DevOps Lead', 'new', 'high', '{"browser": "Chrome 120", "os": "macOS", "viewport": "3440x1440", "url": "/tools/deploy", "console_errors": ["TypeError: Cannot read properties of undefined"]}'::jsonb, '10.0.1.12'::inet, NOW() - INTERVAL '1 day', NOW());

END $$;

-- =============================================
-- SEED QUOTAS
-- =============================================

-- Create quota records for projects
INSERT INTO quotas (id, project_id, month, feedback_count, feedback_limit, grace_period_start, grace_period_ended, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    p.id,
    DATE_TRUNC('month', CURRENT_DATE),
    (SELECT COUNT(*) FROM feedbacks f WHERE f.project_id = p.id AND f.created_at >= DATE_TRUNC('month', CURRENT_DATE)),
    CASE 
        WHEN u.plan = 'pro' OR p.plan_override = 'pro' THEN 999999
        ELSE 100
    END,
    NULL,
    FALSE,
    NOW(),
    NOW()
FROM projects p
JOIN users u ON p.user_id = u.id
ON CONFLICT (project_id, month) DO UPDATE SET
    feedback_count = EXCLUDED.feedback_count,
    updated_at = NOW();

-- Add some historical quota data
INSERT INTO quotas (id, project_id, month, feedback_count, feedback_limit, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    p.id,
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
    FLOOR(RANDOM() * 80 + 10)::INTEGER, -- Random between 10-90
    100,
    NOW() - INTERVAL '1 month',
    NOW() - INTERVAL '1 month'
FROM projects p
WHERE p.is_active = TRUE
ON CONFLICT (project_id, month) DO NOTHING;

-- =============================================
-- SEED NOTIFICATIONS
-- =============================================

INSERT INTO notifications (id, project_id, type, recipient, status, metadata, sent_at, created_at)
SELECT 
    uuid_generate_v4(),
    p.id,
    'new_feedback',
    u.email,
    'sent',
    '{"feedback_count": 1, "feedback_type": "nps"}'::jsonb,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
FROM projects p
JOIN users u ON p.user_id = u.id
WHERE p.is_active = TRUE
LIMIT 5;

-- Add some pending notifications
INSERT INTO notifications (id, project_id, type, recipient, status, metadata, created_at)
SELECT 
    uuid_generate_v4(),
    p.id,
    'quota_alert',
    u.email,
    'pending',
    '{"quota_status": "warning", "usage_percent": 85}'::jsonb,
    NOW() - INTERVAL '2 hours'
FROM projects p
JOIN users u ON p.user_id = u.id
WHERE p.is_active = TRUE
LIMIT 2;
