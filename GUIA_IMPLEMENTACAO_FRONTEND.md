# Guia de Implementação Frontend - ARARA

Este documento define a implementação da interface visual do Kanban para o módulo de Pendências do ARARA. A UI deve ser uma **camada burra** que reflete o estado do servidor e propõe mudanças, sem conter regras de negócio.

## 1. Visão Geral da UI do Kanban

O Kanban é a visualização principal para a gestão operacional das Pendências.

*   **Layout:**
    *   **Header:** Título, Filtros Globais (Responsável, Prioridade, Tipo) e Botão "Nova Pendência".
    *   **Board:** Área de scroll horizontal contendo as colunas fixas.
*   **Colunas:**
    *   Mapeamento estrito do enum `StatusPendencia`.
    *   Ordem Visual: `PENDENTE` → `EM_ANDAMENTO` → `CONCLUIDO` → `CANCELADO`.
    *   Cada coluna exibe um contador de itens.
*   **Card (Pendência):**
    *   Visualização compacta da entidade.
    *   Indicadores visuais para Prioridade (cores) e Tipo (ícones/badges).

## 2. Estrutura de Componentes (Next.js / React)

A organização deve separar responsabilidades de layout e lógica.

```
src/components/kanban/
├── KanbanBoard.tsx       # (Client) Gerencia estado local, DragContext e chamadas de API.
├── KanbanColumn.tsx      # (Visual) Renderiza o container da coluna e lista de cards.
├── KanbanCard.tsx        # (Visual) Renderiza o item arrastável com os dados.
└── KanbanFilters.tsx     # (Client) Inputs para filtrar o estado local/remoto.
```

*   **KanbanBoard:** É o "Smart Component". Possui o `useQuery` (ou `useEffect`) para buscar dados e o handler `onDragEnd`.
*   **KanbanColumn/Card:** São "Dumb Components". Recebem dados via props e emitem eventos (ex: `onClick`).

## 3. Contrato de Dados Consumidos

A UI deve consumir a entidade `Pendencia` definida no backend, utilizando apenas os campos necessários para renderização.

### Campos Essenciais para o Card:
*   `id`: Identificador único (para chave React e chamadas API).
*   `titulo`: Texto principal.
*   `tipo`: Para ícone/badge (`OS`, `ADMINISTRATIVO`, etc).
*   `prioridade`: Para cor da borda ou tag (`ALTA` = Vermelho, etc).
*   `status`: Para determinar a coluna inicial.
*   `responsavelId`: Avatar ou iniciais do responsável.
*   `dataPrevisao`: Exibir se estiver próximo ou atrasado.
*   `origemTipo/origemId`: Link para a OS (se houver).

### Dados de Controle (Frontend Only):
*   `isDragging`: Estado visual durante o arrasto.
*   `isUpdating`: Estado visual de "loading" durante a chamada API.

**🚫 PROIBIDO:** Manipular `dataCriacao`, `criadoPor` ou `historico` diretamente no objeto do card.

## 4. Fluxos de Interação e Comportamento

### 4.1 Movimentação (Drag & Drop)
1.  **Ação:** Usuário arrasta card de `PENDENTE` para `EM_ANDAMENTO`.
2.  **UI (Otimista):** Move o card visualmente imediatamente.
3.  **API:** Dispara `PATCH /api/pendencias/{id}` com `{ status: 'EM_ANDAMENTO' }`.
4.  **Sucesso:** Mantém o card na nova coluna. Atualiza dados retornados (ex: `dataAtualizacao`).
5.  **Erro (400/403):**
    *   Exibe Toast de erro com a mensagem do backend (ex: "Falta responsável").
    *   **Reverte** o movimento visualmente (volta para a coluna original).

### 4.2 Feedback de Permissão
*   Se a API retornar erro de permissão, a UI apenas notifica.
*   *Opcional (Melhoria UX):* Se o usuário logado não tiver permissão de escrita, desabilitar o Drag & Drop (`draggable={false}`) baseando-se em uma prop `canEdit` passada pelo Pai.

### 4.3 Tratamento de Erros
*   **400 Bad Request:** Regra de negócio violada (ex: transição proibida). -> Exibir mensagem amigável.
*   **403 Forbidden:** Sem permissão. -> "Você não tem permissão para mover esta pendência."
*   **422 Unprocessable Entity:** Falta de dados (ex: motivo obrigatório). -> Abrir modal solicitando o dado faltante.

## 5. Limites da UI (O que NÃO pertence ao Frontend)

Para garantir a segurança e consistência definida na Fase 4:

1.  **A UI NÃO valida Matriz de Transição:** O frontend não deve ter um `if (status === 'PENDENTE' && target === 'CONCLUIDO') return false;`. Deixe a API rejeitar. Isso evita duplicidade de regras e desatualização.
2.  **A UI NÃO define "Concluído":** A UI apenas solicita a mudança de status. Se houver side-effects (enviar email, fechar OS), é o backend quem faz.
3.  **A UI NÃO filtra dados de segurança:** Não confie que "esconder o card" é segurança. A API deve filtrar o que o usuário não pode ver.

## 6. Padrões de Implementação no Next.js

### Checklist de Implementação Frontend:

- [ ] **State Management:** Usar React Query (TanStack Query) ou SWR para gerenciar o estado do board (cache, revalidation, optimistic updates).
- [ ] **Componentização:** `KanbanCard` deve ser memoizado (`React.memo`) para evitar re-render desnecessário de todo o board ao mover um item.
- **Hooks:**
    - Criar `usePendencias()` para encapsular o fetch.
    - Criar `usePendenciaMutations()` para encapsular o `PATCH` e a lógica de reversão (rollback).
- **Acessibilidade:** Garantir que o Drag & Drop seja acessível via teclado (se a lib permitir) ou fornecer menu de contexto "Mover para..." como alternativa.
- **Feedback:** Implementar componentes de `Toast` para erros e `Skeleton` para loading inicial.

### Exemplo de Chamada API (Pattern):

```typescript
// usePendenciaMutations.ts
const moveCard = async (id: string, novoStatus: StatusPendencia) => {
  // 1. Snapshot do estado anterior
  const previousBoard = queryClient.getQueryData(['pendencias']);
  
  // 2. Update Otimista
  queryClient.setQueryData(['pendencias'], (old) => moverNoCache(old, id, novoStatus));
  
  try {
    // 3. Chamada Real
    await api.patch(`/pendencias/${id}`, { status: novoStatus });
  } catch (error) {
    // 4. Rollback em caso de erro
    queryClient.setQueryData(['pendencias'], previousBoard);
    toast.error(error.response?.data?.message || 'Erro ao mover card');
  }
};
```
