-- Projetos/SaaS do usuário
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Widgets de feedback
CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  widget_key TEXT UNIQUE NOT NULL,
  
  -- Configurações
  primary_color TEXT DEFAULT '#3b82f6',
  position TEXT DEFAULT 'bottom-right',
  trigger_type TEXT DEFAULT 'button',
  
  -- Features habilitadas
  enable_nps BOOLEAN DEFAULT true,
  enable_suggestions BOOLEAN DEFAULT true,
  enable_bugs BOOLEAN DEFAULT true,
  
  -- Customização
  title TEXT DEFAULT 'Queremos seu feedback!',
  subtitle TEXT,
  thank_you_message TEXT DEFAULT 'Obrigado pelo feedback!',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feedbacks recebidos
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  
  -- Dados do feedback
  type TEXT NOT NULL CHECK (type IN ('nps', 'suggestion', 'bug')),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  content TEXT NOT NULL,
  
  -- Contexto
  user_email TEXT,
  user_id TEXT,
  page_url TEXT,
  user_agent TEXT,
  screenshot_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_widget_id ON feedbacks(widget_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_widgets_project_id ON widgets(project_id);
CREATE INDEX IF NOT EXISTS idx_widgets_key ON widgets(widget_key);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Projects: usuário só pode ver/editar seus próprios projetos
CREATE POLICY IF NOT EXISTS "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Widgets: usuário só pode ver/editar widgets de seus projetos
CREATE POLICY IF NOT EXISTS "Users can manage project widgets" ON widgets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = widgets.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Feedbacks: usuário só pode ver feedbacks de seus widgets
CREATE POLICY IF NOT EXISTS "Users can view widget feedbacks" ON feedbacks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM widgets 
      JOIN projects ON widgets.project_id = projects.id
      WHERE widgets.id = feedbacks.widget_id 
      AND projects.user_id = auth.uid()
    )
  );
