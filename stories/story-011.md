# Story: [ST-11] Criar Layout do Dashboard

## Metadata
- **Epic:** Dashboard do Founder
- **Prioridade:** Must
- **Pontos:** 5
- **Status:** in_progress
- **Issue:** #15

## Descrição
Como founder logado, quero ver uma interface limpa e organizada, para que eu possa navegar facilmente entre as funcionalidades do sistema.

## Critérios de Aceitação (Given/When/Then)

### AC-01: Sidebar de navegação
**Given** um usuário logado
**When** acessa o dashboard
**Then** vê uma sidebar com links: Dashboard, Analytics, Settings
**And** o link ativo está destacado

### AC-02: Header
**Given** qualquer página do dashboard
**When** o usuário olha o topo
**Then** vê o logo do projeto
**And** um dropdown de perfil (logout)

### AC-03: Container principal
**Given** qualquer página
**When** o conteúdo é renderizado
**Then** ele fica dentro de um container centralizado
**And** respeita o max-width do design system

### AC-04: Layout responsivo
**Given** um usuário em mobile
**When** acessa o dashboard
**Then** a sidebar vira menu hamburger
**And** o layout se adapta à tela

## Tarefas Técnicas

- [ ] Criar layout base do dashboard (com sidebar)
- [ ] Implementar sidebar com navegação
- [ ] Criar componente de header
- [ ] Configurar rotas protegidas
- [ ] Implementar responsividade
- [ ] Adicionar hover/active states

## Notas Técnicas
- Usar Next.js App Router
- Tailwind CSS para responsividade
- shadcn/ui para componentes base
- Seguir UX Design Spec (cyber-neon)
- Cor primária: #00ff88 (neon green)
- Background: #000000 (black)
- Sidebar width: 250px desktop, drawer mobile

## Dependências
- ST-01: Autenticação (para rotas protegidas) ✅
- ST-03: Proteção de Rotas ✅

## Definition of Done
- [ ] Layout implementado
- [ ] Responsivo testado
- [ ] Navegação funcional
- [ ] Commits feitos
- [ ] Issue fechada
