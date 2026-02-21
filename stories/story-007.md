# Story: [ST-07] Implementar Modal de Sugestão

## Metadata
- **Epic:** Widget de Coleta de Feedback
- **Prioridade:** Must
- **Pontos:** 3
- **Status:** ✅ Done
- **Issue:** #11

## Descrição
Como usuário, quero enviar sugestões de features, para ajudar a melhorar o produto.

## Critérios de Aceitação

### AC-01: Formulário de sugestão
**Given** usuário selecionou "Sugestão"
**When** o modal abre
**Then** vê campos: Título (obrigatório) e Descrição (opcional)

### AC-02: Enviar sugestão
**Given** formulário preenchido
**When** clica em "Enviar Sugestão"
**Then** salva no banco com type='suggestion'

## Tarefas Técnicas
- [x] Criar formulário de sugestão
- [x] Validar título obrigatório
- [x] Integrar com API

## Implementation Summary

### Files Created
- `widget/src/modals/SuggestionModal.ts` - Suggestion modal component
- `widget/src/modals/SuggestionModal.test.ts` - Tests for the modal

### Features Implemented
1. **Form Fields**: Título (required) and Descrição (optional)
2. **Form Validation**: Title is validated before submission
3. **API Integration**: POST to `/api/widget/feedback` with type='suggestion'
4. **Success State**: Thank you message shown after submit
5. **Error Handling**: Error messages for validation and API failures
6. **Limit Handling**: Shows warning when approaching feedback limit

### Commits
- `d0f78a1` - feat(ST-07): implement suggestion modal with form validation and tests
- `a0c7fce` - feat(ST-07): implement suggestion modal with title and description fields

### Definition of Done
- [x] Formulário funcionando
- [x] Dados salvos corretamente
- [x] Commits feitos
- [x] Issue fechada
