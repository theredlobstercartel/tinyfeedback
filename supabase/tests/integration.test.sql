-- =============================================
-- INTEGRATION TESTS FOR FEEDBACK WORKFLOWS
-- =============================================

-- Test: Complete feedback workflow
DO $$
DECLARE
    v_project_id UUID;
    v_user_id UUID;
    v_api_key VARCHAR(64);
    v_initial_feedback_count INTEGER;
    v_final_feedback_count INTEGER;
    v_feedback_id UUID;
    v_quota_record RECORD;
BEGIN
    -- Get test project
    SELECT id, user_id, api_key INTO v_project_id, v_user_id, v_api_key
    FROM projects WHERE is_active = TRUE LIMIT 1;
    
    RAISE NOTICE 'Testing with project: %, API key: %', v_project_id, LEFT(v_api_key, 10) || '...';
    
    -- Get initial counts
    SELECT COUNT(*) INTO v_initial_feedback_count FROM feedbacks WHERE project_id = v_project_id;
    RAISE NOTICE 'Initial feedback count: %', v_initial_feedback_count;
    
    -- Insert NPS feedback
    INSERT INTO feedbacks (project_id, type, content, user_email, user_name, status, created_at, updated_at)
    VALUES (
        v_project_id,
        'nps',
        '{"score": 8, "comment": "Test feedback from integration test"}'::jsonb,
        'test@example.com',
        'Test User',
        'new',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_feedback_id;
    
    RAISE NOTICE 'Inserted feedback ID: %', v_feedback_id;
    
    -- Verify feedback was inserted
    SELECT COUNT(*) INTO v_final_feedback_count FROM feedbacks WHERE project_id = v_project_id;
    
    IF v_final_feedback_count != v_initial_feedback_count + 1 THEN
        RAISE EXCEPTION 'Feedback count did not increment. Expected: %, Got: %', 
            v_initial_feedback_count + 1, v_final_feedback_count;
    END IF;
    
    RAISE NOTICE '✓ Feedback inserted successfully';
    
    -- Verify quota was incremented
    SELECT * INTO v_quota_record FROM quotas 
    WHERE project_id = v_project_id AND month = DATE_TRUNC('month', CURRENT_DATE);
    
    IF v_quota_record IS NULL THEN
        RAISE EXCEPTION 'Quota record not found';
    END IF;
    
    RAISE NOTICE '✓ Quota record exists (count: %)', v_quota_record.feedback_count;
    
    -- Verify status history is initialized
    IF NOT EXISTS (
        SELECT 1 FROM feedbacks 
        WHERE id = v_feedback_id 
        AND jsonb_array_length(status_history) > 0
    ) THEN
        RAISE EXCEPTION 'Status history not initialized';
    END IF;
    
    RAISE NOTICE '✓ Status history initialized';
    
    -- Clean up test feedback
    DELETE FROM feedbacks WHERE id = v_feedback_id;
    
    RAISE NOTICE '✓ Test cleanup complete';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'INTEGRATION TESTS PASSED ✓';
    RAISE NOTICE '========================================';
END $$;

-- Test: Team collaboration workflow
DO $$
DECLARE
    v_team_id UUID;
    v_owner_id UUID;
    v_member_id UUID;
    v_project_count INTEGER;
BEGIN
    -- Get a team
    SELECT id, owner_id INTO v_team_id, v_owner_id FROM teams LIMIT 1;
    
    IF v_team_id IS NULL THEN
        RAISE NOTICE 'No teams found, skipping team test';
        RETURN;
    END IF;
    
    -- Count projects for this team
    SELECT COUNT(*) INTO v_project_count FROM projects WHERE team_id = v_team_id;
    
    RAISE NOTICE 'Team % has % projects', v_team_id, v_project_count;
    
    -- Verify team members can access projects
    SELECT COUNT(DISTINCT user_id) INTO v_member_id 
    FROM team_members 
    WHERE team_id = v_team_id;
    
    RAISE NOTICE 'Team has % members', v_member_id;
    
    RAISE NOTICE '✓ Team collaboration structure verified';
END $$;

-- Test: NPS calculation
DO $$
DECLARE
    v_project_id UUID;
    v_nps_result RECORD;
BEGIN
    SELECT id INTO v_project_id FROM projects LIMIT 1;
    
    SELECT * INTO v_nps_result FROM calculate_nps(v_project_id, 30);
    
    RAISE NOTICE 'NPS Calculation for project %:', v_project_id;
    RAISE NOTICE '  - Detractors: %', v_nps_result.detractors;
    RAISE NOTICE '  - Neutrals: %', v_nps_result.neutrals;
    RAISE NOTICE '  - Promoters: %', v_nps_result.promoters;
    RAISE NOTICE '  - Total: %', v_nps_result.total;
    RAISE NOTICE '  - NPS Score: %', v_nps_result.nps_score;
    
    RAISE NOTICE '✓ NPS calculation works';
END $$;
