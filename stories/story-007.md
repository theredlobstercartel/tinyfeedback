# Story: [ST-07] Implementar Modal de Sugestão

## Metadata
- **Epic:** Widget de Coleta de Feedback
- **Prioridade:** Must
- **Pontos:** 3
- **Status:** ready-for-dev
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
- [ ] Criar formulário de sugestão
- [ ] Validar título obrigatório
- [ ] Integrar com API

## Definition of Done
- [ ] Formulário funcionando
- [ ] Dados salvos corretamente
- [ ] Commits feitos
- [ ] Issue fechada
