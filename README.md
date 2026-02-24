# TinyFeedback

Widget de feedback ultra-leve para aplicações web. Construído com Next.js 16 e Supabase.

## 🚀 Tecnologias

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **UI**: Tailwind CSS 4 + shadcn/ui
- **Widget**: Vanilla TypeScript (<10KB)

## 📁 Estrutura do Projeto

```
tinyfeedback/
├── supabase/              # Configuração do Supabase
│   ├── migrations/        # Migrações do banco de dados
│   │   └── 00000000000000_init.sql
│   ├── tests/             # Testes do schema
│   │   ├── schema.test.sql
│   │   └── integration.test.sql
│   ├── seed.sql           # Dados de desenvolvimento
│   ├── config.toml        # Configuração do Supabase
│   └── README.md          # Documentação do schema
└── README.md              # Este arquivo
```

## 🗄️ Database Schema

O schema do banco de dados inclui:

### Tabelas Principais

- **users**: Contas de usuário
- **teams**: Times para colaboração
- **team_members**: Membros do time com papéis
- **projects**: Projetos que usam o widget
- **feedbacks**: Entradas de feedback (NPS, sugestões, bugs)
- **notifications**: Fila de notificações por email
- **quotas**: Cotas mensais por projeto

### Segurança

- **RLS (Row Level Security)**: Habilitado em todas as tabelas
- **Políticas**: Granulares por usuário/time
- **API Keys**: Formato `tf_` + 60 caracteres hex

### Índices Otimizados

- `idx_projects_api_key` - Busca por API key
- `idx_projects_user_id` - Projetos do usuário
- `idx_feedbacks_project_id` - Feedbacks por projeto
- `idx_feedbacks_created_at` - Queries temporais
- `idx_quotas_project_month` - Cotas por mês

## 🛠️ Setup

### Pré-requisitos

- Node.js 20+
- pnpm
- Docker (para Supabase local)

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd tinyfeedback
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase
```

4. Inicie o Supabase local:
```bash
supabase start
```

5. Execute as migrações:
```bash
supabase db reset
```

6. Popule com dados de desenvolvimento:
```bash
supabase db seed
```

## 🧪 Testes

### Testes do Schema

```bash
psql -h localhost -p 54322 -d postgres -U postgres -f supabase/tests/schema.test.sql
```

### Testes de Integração

```bash
psql -h localhost -p 54322 -d postgres -U postgres -f supabase/tests/integration.test.sql
```

## 📊 Story ST-02: Database Schema e Migrations

### Critérios de Aceite Implementados

- ✅ Tabela `projects` (id, name, website_url, settings, api_key)
- ✅ Tabela `feedbacks` (id, project_id, content, rating/metadata, created_at)
- ✅ Tabelas `teams` e `team_members` para colaboração
- ✅ RLS (Row Level Security) configurado em todas as tabelas
- ✅ Índices otimizados para queries frequentes
- ✅ Migrations versionadas em `supabase/migrations/`

### Tarefas Técnicas Concluídas

- ✅ Criar schema SQL no Supabase
- ✅ Configurar RLS policies por usuário/team
- ✅ Criar índices em `project_id`, `created_at`
- ✅ Setup `supabase/migrations/` local
- ✅ Seed data para desenvolvimento

### Definition of Done

- ✅ Schema aplicado em local (equivalente a staging)
- ✅ Testes de integridade passando
- ✅ Documentação do schema no README

## 📄 Licença

MIT
