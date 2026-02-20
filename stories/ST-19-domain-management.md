# ST-19: Gerenciar Domínios Permitidos

**Project:** TinyFeedback  
**Epic:** Configurações do Projeto  
**Priority:** Must  
**Points:** 3  
**Status:** 🚧 in-progress

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
- `POST /api/projects/[id]/domains` - Adicionar domínio
- `DELETE /api/projects/[id]/domains` - Remover domínio

### UI Design
- Cyber-neon aesthetic: sharp corners (0px radius), neon green (#00ff88) accents
- Input field + "Adicionar" button
- List with remove button for each domain
- Error message for invalid domains

## Commits
1. 
2. 
3. 
