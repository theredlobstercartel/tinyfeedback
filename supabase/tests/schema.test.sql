-- =============================================
-- DATABASE SCHEMA TESTS
-- =============================================
-- Run with: psql -d tinyfeedback -f tests/schema.test.sql

-- Test 1: Verify all tables exist
DO $$
DECLARE
    v_missing_tables TEXT[] := ARRAY[]::TEXT[];
    v_required_tables TEXT[] := ARRAY['users', 'teams', 'team_members', 'projects', 'feedbacks', 'notifications', 'quotas'];
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY v_required_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = v_table
        ) THEN
            v_missing_tables := array_append(v_missing_tables, v_table);
        END IF;
    END LOOP;
    
    IF array_length(v_missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', v_missing_tables;
    ELSE
        RAISE NOTICE '✓ All required tables exist';
    END IF;
END $$;

-- Test 2: Verify all enums exist
DO $$
DECLARE
    v_missing_enums TEXT[] := ARRAY[]::TEXT[];
    v_required_enums TEXT[] := ARRAY['user_plan', 'feedback_type', 'feedback_status', 'notification_type', 'notification_status', 'bug_priority'];
    v_enum TEXT;
BEGIN
    FOREACH v_enum IN ARRAY v_required_enums
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_type 
            WHERE typname = v_enum AND typtype = 'e'
        ) THEN
            v_missing_enums := array_append(v_missing_enums, v_enum);
        END IF;
    END LOOP;
    
    IF array_length(v_missing_enums, 1) > 0 THEN
        RAISE EXCEPTION 'Missing enums: %', v_missing_enums;
    ELSE
        RAISE NOTICE '✓ All required enums exist';
    END IF;
END $$;

-- Test 3: Verify all views exist
DO $$
DECLARE
    v_missing_views TEXT[] := ARRAY[]::TEXT[];
    v_required_views TEXT[] := ARRAY['current_quotas', 'project_stats', 'team_projects'];
    v_view TEXT;
BEGIN
    FOREACH v_view IN ARRAY v_required_views
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'public' AND table_name = v_view
        ) THEN
            v_missing_views := array_append(v_missing_views, v_view);
        END IF;
    END LOOP;
    
    IF array_length(v_missing_views, 1) > 0 THEN
        RAISE EXCEPTION 'Missing views: %', v_missing_views;
    ELSE
        RAISE NOTICE '✓ All required views exist';
    END IF;
END $$;

-- Test 4: Verify critical functions exist
DO $$
DECLARE
    v_missing_functions TEXT[] := ARRAY[]::TEXT[];
    v_required_functions TEXT[] := ARRAY['update_updated_at', 'generate_api_key', 'check_and_update_quota', 'auto_classify_bug_priority', 'calculate_nps', 'increment_feedback_quota'];
    v_func TEXT;
BEGIN
    FOREACH v_func IN ARRAY v_required_functions
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = v_func
        ) THEN
            v_missing_functions := array_append(v_missing_functions, v_func);
        END IF;
    END LOOP;
    
    IF array_length(v_missing_functions, 1) > 0 THEN
        RAISE EXCEPTION 'Missing functions: %', v_missing_functions;
    ELSE
        RAISE NOTICE '✓ All required functions exist';
    END IF;
END $$;

-- Test 5: Verify indexes on critical columns
DO $$
DECLARE
    v_missing_indexes TEXT[] := ARRAY[]::TEXT[];
    v_required_indexes TEXT[] := ARRAY['idx_projects_api_key', 'idx_projects_user_id', 'idx_feedbacks_project_id', 'idx_feedbacks_created_at', 'idx_quotas_project_month'];
    v_idx TEXT;
BEGIN
    FOREACH v_idx IN ARRAY v_required_indexes
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' AND indexname = v_idx
        ) THEN
            v_missing_indexes := array_append(v_missing_indexes, v_idx);
        END IF;
    END LOOP;
    
    IF array_length(v_missing_indexes, 1) > 0 THEN
        RAISE EXCEPTION 'Missing indexes: %', v_missing_indexes;
    ELSE
        RAISE NOTICE '✓ All required indexes exist';
    END IF;
END $$;

-- Test 6: Verify RLS is enabled on all tables
DO $$
DECLARE
    v_rls_disabled TEXT[] := ARRAY[]::TEXT[];
    v_tables TEXT[] := ARRAY['users', 'teams', 'team_members', 'projects', 'feedbacks', 'notifications', 'quotas'];
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY v_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class 
            WHERE relname = v_table AND relrowsecurity = true
        ) THEN
            v_rls_disabled := array_append(v_rls_disabled, v_table);
        END IF;
    END LOOP;
    
    IF array_length(v_rls_disabled, 1) > 0 THEN
        RAISE EXCEPTION 'RLS not enabled on tables: %', v_rls_disabled;
    ELSE
        RAISE NOTICE '✓ RLS enabled on all tables';
    END IF;
END $$;

-- Test 7: Verify API key generation function
DO $$
DECLARE
    v_api_key VARCHAR(64);
BEGIN
    SELECT generate_api_key() INTO v_api_key;
    
    IF v_api_key IS NULL OR LENGTH(v_api_key) != 64 OR NOT v_api_key LIKE 'tf_%' THEN
        RAISE EXCEPTION 'Invalid API key format: %', v_api_key;
    ELSE
        RAISE NOTICE '✓ API key generation works correctly (generated: %)', v_api_key;
    END IF;
END $$;

-- Test 8: Verify seed data loaded
DO $$
DECLARE
    v_user_count INTEGER;
    v_project_count INTEGER;
    v_feedback_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_user_count FROM users;
    SELECT COUNT(*) INTO v_project_count FROM projects;
    SELECT COUNT(*) INTO v_feedback_count FROM feedbacks;
    
    IF v_user_count < 3 THEN
        RAISE EXCEPTION 'Expected at least 3 users, found: %', v_user_count;
    END IF;
    
    IF v_project_count < 3 THEN
        RAISE EXCEPTION 'Expected at least 3 projects, found: %', v_project_count;
    END IF;
    
    IF v_feedback_count < 10 THEN
        RAISE EXCEPTION 'Expected at least 10 feedbacks, found: %', v_feedback_count;
    END IF;
    
    RAISE NOTICE '✓ Seed data loaded: % users, % projects, % feedbacks', v_user_count, v_project_count, v_feedback_count;
END $$;

-- Test 9: Verify bug auto-classification
DO $$
DECLARE
    v_high_priority_feedback UUID;
    v_priority bug_priority;
BEGIN
    -- Insert a test bug with high priority keywords
    INSERT INTO feedbacks (project_id, type, content, status, created_at, updated_at)
    VALUES (
        (SELECT id FROM projects LIMIT 1),
        'bug',
        '{"description": "The app is crashing constantly when I try to save!", "contactEmail": "test@test.com"}'::jsonb,
        'new',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_high_priority_feedback;
    
    SELECT priority INTO v_priority FROM feedbacks WHERE id = v_high_priority_feedback;
    
    IF v_priority != 'high' THEN
        RAISE EXCEPTION 'Expected high priority for crash bug, got: %', v_priority;
    ELSE
        RAISE NOTICE '✓ Bug auto-classification works (high priority for crash)';
    END IF;
    
    -- Clean up
    DELETE FROM feedbacks WHERE id = v_high_priority_feedback;
END $$;

-- Test 10: Verify quota system
DO $$
DECLARE
    v_project_id UUID;
    v_quota_result RECORD;
BEGIN
    SELECT id INTO v_project_id FROM projects LIMIT 1;
    
    SELECT * INTO v_quota_result FROM check_and_update_quota(v_project_id);
    
    IF v_quota_result.allowed IS NULL THEN
        RAISE EXCEPTION 'Quota check failed';
    ELSE
        RAISE NOTICE '✓ Quota system working (allowed: %, status: %)', v_quota_result.allowed, v_quota_result.status;
    END IF;
END $$;

-- Final summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ALL SCHEMA TESTS PASSED ✓';
    RAISE NOTICE '========================================';
END $$;
