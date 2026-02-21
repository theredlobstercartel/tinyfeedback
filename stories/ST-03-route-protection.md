# ST-03: Configurar Proteção de Rotas

**Epic:** Autenticação e Onboarding  
**Priority:** Must  
**Points:** 3  
**Status:** ✅ Done

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
- [x] Criar middleware de autenticação
- [x] Configurar rotas protegidas
- [x] Implementar redirecionamento
- [x] Testar fluxo completo

## Implementation Summary

### Files Modified
- `lib/supabase/middleware.ts` - Added route protection logic
- `lib/supabase/middleware.test.ts` - Tests for route protection

### Features Implemented
1. **Protected Routes**: /dashboard, /settings, /projects/*
2. **Public Routes**: /login, /auth/callback, /, /api/*
3. **Redirection**: Unauthenticated users redirected to /login
4. **Session Persistence**: Using Supabase Auth session
5. **Reverse Redirection**: Authenticated users redirected from /login to /dashboard

### Commits
- `6f13600` - feat(ST-03): add route protection for /settings and /projects

## Notes
- Usar middleware.ts do Next.js
- Integrar com Supabase Auth
- Proteger rotas: /dashboard, /settings, /projects/*
- Permitir rotas públicas: /login, /auth/callback, /, /api/*
