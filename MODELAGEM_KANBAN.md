# Modelo Funcional: Kanban de Pendências

Este documento define as regras funcionais, estados e transições do sistema Kanban para gestão de Pendências no ARARA.

## 1. Modelo de Status (Colunas do Kanban)

O Kanban é uma visualização direta do campo `status` da entidade Pendência. Não existem "colunas" separadas do status.

| Status / Coluna | Descrição Funcional | Tipo |
| :--- | :--- | :--- |
| **PENDENTE** | **(Backlog / A Fazer)**. Estado inicial padrão para novas pendências. Indica que o trabalho foi identificado mas ainda não começou. | Inicial |
| **EM_ANDAMENTO** | **(Doing / Executando)**. Indica que um responsável assumiu a tarefa e está trabalhando nela ativamente. | Intermediário |
| **CONCLUIDO** | **(Done / Feito)**. Indica que o trabalho foi entregue e finalizado com sucesso. | Final (Sucesso) |
| **CANCELADO** | **(Void / Cancelled)**. Indica que o trabalho foi abortado, rejeitado ou não é mais necessário. | Final (Falha) |

---

## 2. Matriz de Transições de Status

Define as mudanças de estado permitidas e proibidas para garantir a consistência do fluxo.

| De (Origem) | Para (Destino) | Permissão | Regra / Condição |
| :--- | :--- | :--- | :--- |
| **PENDENTE** | **EM_ANDAMENTO** | ✅ Permitido | **Obrigatório:** Atribuir um `responsavelId` (se ainda não houver). |
| **PENDENTE** | **CANCELADO** | ✅ Permitido | **Obrigatório:** Fornecer motivo/observação no histórico. |
| **PENDENTE** | **CONCLUIDO** | ❌ Proibido | Uma tarefa não pode ser concluída sem antes ser iniciada. |
| **EM_ANDAMENTO** | **CONCLUIDO** | ✅ Permitido | O usuário deve confirmar a conclusão. |
| **EM_ANDAMENTO** | **PENDENTE** | ✅ Permitido | Representa "devolver" ou "pausar" a tarefa. Remove-se o responsável (opcionalmente). |
| **EM_ANDAMENTO** | **CANCELADO** | ✅ Permitido | **Obrigatório:** Fornecer motivo/observação. |
| **CONCLUIDO** | **EM_ANDAMENTO** | ⚠️ Restrito | Apenas **Administradores** podem reabrir tarefas concluídas. |
| **CONCLUIDO** | **CANCELADO** | ❌ Proibido | Tarefa já foi entregue com sucesso. |
| **CANCELADO** | **PENDENTE** | ⚠️ Restrito | Apenas **Administradores** podem reativar tarefas canceladas. |
| **CANCELADO** | *Qualquer outro* | ❌ Proibido | Estado terminal definitivo (salvo reativação acima). |

---

## 3. Conceito de Kanban no Sistema

O Kanban no ARARA **NÃO** é uma entidade separada. Ele é puramente uma **projeção visual** (View) baseada no agrupamento de Pendências pelo campo `status`.

1.  **Colunas:** São fixas e mapeadas 1:1 com os valores do ENUM `StatusPendencia`.
2.  **Cartões:** São a representação visual da entidade `Pendencia`.
3.  **Movimentação:** "Arrastar um cartão" visualmente é, tecnicamente, apenas uma chamada de API `PATCH /pendencias/{id}` alterando o campo `status`.
4.  **Filtros:** O Kanban deve suportar filtros globais (ex: "Minhas Pendências", "Todas", "Por Prioridade"), mas a estrutura de colunas permanece imutável.

---

## 4. Histórico de Movimentações (Audit Log)

Toda alteração de status DEVE gerar um registro imutável na entidade `HistoricoMovimentacao`.

**Estrutura do Registro:**
- **Data/Hora:** Timestamp exato da mudança (ISO 8601).
- **Ator:** ID do usuário que realizou a ação.
- **De:** Status anterior.
- **Para:** Novo status.
- **Motivo:** Texto explicativo (Obrigatório para cancelamentos ou bloqueios, opcional para fluxo normal).

**Exemplo de Log:**
> `[2023-10-27 14:30] Usuário X moveu de PENDENTE para EM_ANDAMENTO.`

---

## 5. Regras de Autorização (ACL)

Quem pode mover o quê?

| Ação | Criador da Pendência | Responsável Atual | Outros Usuários | Administrador |
| :--- | :---: | :---: | :---: | :---: |
| Iniciar (Pendente -> Andamento) | ✅ | ✅ | ❌ | ✅ |
| Devolver (Andamento -> Pendente) | ✅ | ✅ | ❌ | ✅ |
| Concluir (Andamento -> Concluido) | ✅ | ✅ | ❌ | ✅ |
| Cancelar (Qualquer -> Cancelado) | ✅ | ❌ | ❌ | ✅ |
| Reabrir (Concluido -> Andamento) | ❌ | ❌ | ❌ | ✅ |
| Atribuir Responsável | ✅ | ✅ (a si mesmo) | ❌ | ✅ |

*Nota: "Outros Usuários" podem visualizar (Read-Only) se a pendência for pública, mas nunca mover.*

---

## 6. Regras de Consistência e Integridade

Para garantir que o sistema não entre em estado inválido via API ou manipulação direta:

1.  **Validação de Grafo:** A API de atualização (`PATCH`) deve validar explicitamente se a transição `statusAnterior` -> `statusNovo` é permitida pela tabela do item 2. Se não for, retornar `HTTP 400 Bad Request`.
2.  **Atomicidade:** A atualização do status e a criação do registro de histórico devem ocorrer na mesma transação de banco de dados (ou bloco lógico).
3.  **Imutabilidade de Finalizados:** Se uma pendência está `CONCLUIDO` ou `CANCELADO`, nenhuma outra propriedade (título, descrição, prioridade) pode ser editada, exceto pelo Administrador ao reabrir a tarefa.
4.  **Bloqueio de Exclusão:** Pendências que possuem histórico de movimentação ou que estão vinculadas a uma OS não podem ser excluídas fisicamente (Hard Delete). Devem ser apenas canceladas (Soft Delete lógico via status).
