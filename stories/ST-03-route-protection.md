# ST-03: Configurar Proteção de Rotas

**Epic:** Autenticação e Onboarding  
**Priority:** Must  
**Points:** 3  
**Status:** ready-for-dev

## Story Description
Como founder, quero que rotas protegidas exijam autenticação, para que meus dados estejam seguros.

## Acceptance Criteria

### AC-01: Redirecionamento
**Given** um usuário não logado  
**When** tenta acessar `/dashboard`  
**Then** é redirecionado para `/login`

### AC-02: Acesso permitido
**Given** um usuário logado  
**When** acessa `/dashboard`  
**Then** vê o conteúdo normalmente

### AC-03: Persistência de sessão
**Given** um usuário logado  
**When** fecha e reabre o browser  
**Then** continua logado (sessão persistida)

## Technical Tasks
- [ ] Criar middleware de autenticação
- [ ] Configurar rotas protegidas
- [ ] Implementar redirecionamento
- [ ] Testar fluxo completo

## Notes
- Usar middleware.ts do Next.js
- Integrar com Supabase Auth
- Proteger rotas: /dashboard, /settings, /projects/*
- Permitir rotas públicas: /login, /auth/callback, /, /api/*
