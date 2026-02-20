# ST-19: Gerenciar Domínios Permitidos

**Project:** TinyFeedback  
**Epic:** Configurações do Projeto  
**Priority:** Must  
**Points:** 3  
**Status:** ✅ review

## Story
Como founder, quero adicionar/remover domínios que podem usar meu widget.

## Acceptance Criteria

### AC-01: Adicionar domínio ✅
**Given** nas configurações  
**When** digita domínio e clica adicionar  
**Then** domínio é salvo na whitelist

### AC-02: Remover domínio ✅
**Given** lista de domínios  
**When** clica em remover  
**Then** domínio é removido

### AC-03: Validação ✅
**Given** domínio inválido  
**When** tenta adicionar  
**Then** mostra erro de validação

## Technical Tasks
- [x] Array allowed_domains no banco (já existe)
- [x] Função de validação de domínio com testes
- [x] API endpoint para gerenciar domínios
- [x] UI de gerenciamento na página de configurações
- [x] Validação de domínio no frontend

## Implementation Notes

### Database Schema
O campo `allowed_domains TEXT[] DEFAULT '{}'` já existe na tabela `projects`.

### Domain Validation Rules
- Deve ser um domínio válido (ex: example.com, sub.example.com)
- Não aceita URLs completas (sem http:// ou https://)
- Não aceita paths (sem /caminho)
- Não aceita portas (sem :8080)
- Domínios são armazenados em lowercase

### API Endpoints
- `GET /api/projects/[id]/domains` - Listar domínios
- `PATCH /api/projects/[id]/domains` - Adicionar/remover domínio
  - Body: `{ action: 'add' | 'remove', domain: string }`

### UI Design
- Cyber-neon aesthetic: sharp corners (0px radius), neon green (#00ff88) accents
- Input field + "Adicionar" button
- List with remove button for each domain (hover to show)
- Error message for invalid domains
- Empty state with helpful tips

## Test Coverage

### lib/utils/domain.test.ts (9 tests)
- ✅ Validação de domínios válidos
- ✅ Rejeição de URLs com protocolos
- ✅ Rejeição de URLs com paths
- ✅ Rejeição de domínios com portas
- ✅ Rejeição de domínios vazios
- ✅ Rejeição de caracteres inválidos
- ✅ Rejeição de domínios duplicados
- ✅ Normalização para lowercase
- ✅ Trim de whitespace

### app/api/projects/[id]/domains/route.test.ts (7 tests)
- ✅ Adicionar domínio válido
- ✅ Remover domínio
- ✅ Rejeitar domínio inválido
- ✅ Rejeitar domínio duplicado
- ✅ Rejeitar domínio vazio
- ✅ Rejeitar ação inválida
- ✅ Tratar parâmetro de domínio ausente

### components/settings/DomainManager.test.tsx (9 tests)
- ✅ Adicionar domínio clicando no botão
- ✅ Adicionar domínio pressionando Enter
- ✅ Mostrar botão de remover para cada domínio
- ✅ Chamar API ao remover domínio
- ✅ Mostrar erro para domínio inválido com protocolo
- ✅ Mostrar erro para domínio duplicado
- ✅ Mostrar estado vazio quando não há domínios
- ✅ Normalizar domínio para lowercase

## Commits
1. `92285ac` - ST-19: Add domain validation utility with TDD
2. `d518c17` - ST-19: Add project domains API endpoint
3. `6bf6d95` - ST-19: Add domain management UI component and settings page

## Files Changed
- `lib/utils/domain.ts` - Validação e normalização de domínios
- `lib/utils/domain.test.ts` - Testes de validação
- `app/api/projects/[id]/domains/route.ts` - API endpoint
- `app/api/projects/[id]/domains/route.test.ts` - Testes da API
- `components/settings/DomainManager.tsx` - Componente de UI
- `components/settings/DomainManager.test.tsx` - Testes do componente
- `components/settings/index.ts` - Exportações
- `app/settings/page.tsx` - Página de configurações
- `types/index.ts` - Tipos Project e UpdateProjectDomainsInput
- `vitest.config.ts` - Configuração do Vitest
- `vitest.setup.ts` - Setup de testes
- `package.json` - Dependências de teste
