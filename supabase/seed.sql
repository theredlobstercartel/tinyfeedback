-- Seed data for TinyFeedback v2 development
-- Story: ST-02 - Database Schema e Migrations

-- Note: This seed file should be run after migrations
-- It creates sample data for local development

-- ============================================
-- Seed function (to be called manually or in dev scripts)
-- ============================================

-- Function to create seed data
CREATE OR REPLACE FUNCTION seed_development_data()
RETURNS void AS $$
DECLARE
  test_user_id UUID;
  demo_project_id UUID;
  demo_team_id UUID;
BEGIN
  -- Note: This function requires an authenticated user to exist
  -- In development, create a test user first via Supabase Auth
  
  -- Get the first user (for development purposes)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No auth.users found. Please create a user first via Supabase Auth.';
    RETURN;
  END IF;

  -- ============================================
  -- Create Demo Team
  -- ============================================
  INSERT INTO teams (
    name, 
    slug, 
    description, 
    owner_id,
    subscription_plan,
    max_projects,
    max_members
  ) VALUES (
    'Demo Team',
    'demo-team',
    'A demo team for testing team features',
    test_user_id,
    'free',
    5,
    3
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO demo_team_id;

  -- Add owner as team member
  IF demo_team_id IS NOT NULL THEN
    INSERT INTO team_members (
      team_id,
      user_id,
      email,
      role,
      status,
      invited_by,
      joined_at
    )
    SELECT 
      demo_team_id,
      test_user_id,
      email,
      'owner',
      'active',
      test_user_id,
      NOW()
    FROM auth.users
    WHERE id = test_user_id
    ON CONFLICT (team_id, user_id) DO NOTHING;
  END IF;

  -- ============================================
  -- Create Demo Project
  -- ============================================
  INSERT INTO bmad_projects (
    name,
    slug,
    description,
    api_key,
    user_id,
    widget_color,
    widget_position,
    widget_text,
    allowed_domains,
    plan,
    max_feedbacks
  ) VALUES (
    'Demo Project',
    'demo-project',
    'A demo project for testing the feedback widget',
    'demo_api_key_' || encode(gen_random_bytes(16), 'hex'),
    test_user_id,
    '#3B82F6',
    'bottom-right',
    'Send Feedback',
    ARRAY['http://localhost:3000', 'http://localhost:5173'],
    'free',
    100
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO demo_project_id;

  -- ============================================
  -- Create Sample Feedbacks (if project was created)
  -- ============================================
  IF demo_project_id IS NOT NULL THEN
    -- NPS feedbacks
    INSERT INTO bmad_feedbacks (
      project_id,
      type,
      nps_score,
      content,
      user_email,
      page_url,
      user_agent,
      status,
      workflow_status
    ) VALUES 
      (demo_project_id, 'nps', 9, 'Great product! Really love the simplicity.', 'user1@example.com', 'http://localhost:3000/dashboard', 'Mozilla/5.0', 'new', 'new'),
      (demo_project_id, 'nps', 10, 'Amazing tool, exactly what I needed!', 'user2@example.com', 'http://localhost:3000/pricing', 'Mozilla/5.0', 'read', 'in_analysis'),
      (demo_project_id, 'nps', 7, 'Good but could use more features', 'user3@example.com', 'http://localhost:3000/features', 'Mozilla/5.0', 'read', 'new'),
      (demo_project_id, 'nps', 3, 'Not satisfied with the current offering', 'user4@example.com', 'http://localhost:3000/', 'Mozilla/5.0', 'responded', 'implemented'),
      (demo_project_id, 'nps', 8, 'Very helpful for our team', 'user5@example.com', 'http://localhost:3000/dashboard', 'Mozilla/5.0', 'new', 'new');

    -- Suggestion feedbacks
    INSERT INTO bmad_feedbacks (
      project_id,
      type,
      title,
      content,
      user_email,
      page_url,
      status,
      workflow_status
    ) VALUES 
      (demo_project_id, 'suggestion', 'Dark mode support', 'Would love to have a dark mode option for the widget', 'suggester@example.com', 'http://localhost:3000/settings', 'read', 'in_analysis'),
      (demo_project_id, 'suggestion', 'Export to CSV', 'Ability to export feedback data to CSV format', 'data@example.com', 'http://localhost:3000/analytics', 'new', 'new'),
      (demo_project_id, 'suggestion', 'Slack integration', 'Integration with Slack for real-time notifications', 'slack@example.com', 'http://localhost:3000/integrations', 'responded', 'implemented');

    -- Bug feedbacks
    INSERT INTO bmad_feedbacks (
      project_id,
      type,
      title,
      content,
      user_email,
      page_url,
      status,
      workflow_status,
      internal_notes
    ) VALUES 
      (demo_project_id, 'bug', 'Widget not loading', 'The widget shows a blank screen on Safari mobile', 'bugreporter@example.com', 'http://localhost:3000/', 'read', 'in_analysis', 'Need to check Safari compatibility'),
      (demo_project_id, 'bug', 'Screenshot capture fails', 'Screenshot capture doesn\'t work on Firefox', 'firefox@example.com', 'http://localhost:3000/demo', 'new', 'new', NULL),
      (demo_project_id, 'bug', 'Email notifications delayed', 'Sometimes email notifications arrive hours late', 'delayed@example.com', 'http://localhost:3000/settings', 'responded', 'implemented', 'Fixed in v2.1');

    RAISE NOTICE 'Created demo data: 1 project, 11 feedbacks';
  ELSE
    RAISE NOTICE 'Demo project already exists or was not created';
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Helper function to clear seed data (for clean slate testing)
CREATE OR REPLACE FUNCTION clear_seed_data()
RETURNS void AS $$
BEGIN
  -- Delete in correct order to avoid FK constraints
  DELETE FROM bmad_feedbacks WHERE project_id IN (
    SELECT id FROM bmad_projects WHERE slug = 'demo-project'
  );
  
  DELETE FROM team_members WHERE team_id IN (
    SELECT id FROM teams WHERE slug = 'demo-team'
  );
  
  DELETE FROM bmad_projects WHERE slug = 'demo-project';
  DELETE FROM teams WHERE slug = 'demo-team';
  
  RAISE NOTICE 'Cleared demo data';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION seed_development_data() IS 'Creates sample data for development. Requires at least one auth.users to exist.';
COMMENT ON FUNCTION clear_seed_data() IS 'Removes all demo data created by seed_development_data()';
