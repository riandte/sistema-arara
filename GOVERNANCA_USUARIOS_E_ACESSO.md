# Governança de Usuários e Acesso

Este documento define as regras de governança, segurança e auditoria para o controle de acesso no ARARA.

## 1. Matriz de Capacidades por Papel

Detalha o que cada papel pode fazer, complementando a modelagem técnica.

### 1.1 ADMIN (Administrador do Sistema)
*   **Pode:** Gerenciar usuários, atribuir papéis, visualizar todos os dados, cancelar qualquer pendência, reabrir pendências concluídas.
*   **Não Pode:** Alterar registros de auditoria (Histórico), agir como outro usuário (Impersonation) sem log explícito.

### 1.2 OPERADOR (Equipe Operacional/Técnica)
*   **Pode:** Criar OS, criar Pendências, assumir responsabilidade (`responsavelId`), mover cards no Kanban, concluir tarefas.
*   **Não Pode:** Gerenciar usuários, cancelar pendências de outros (salvo se for responsável), ver dados financeiros sensíveis (se houver).

### 1.3 USUARIO (Solicitante/Básico)
*   **Pode:** Criar Pendências (Solicitações), visualizar suas próprias pendências, cancelar suas próprias pendências (se ainda em `PENDENTE`).
*   **Não Pode:** Ver pendências de outros setores, mover cards livremente, concluir tarefas.

### 1.4 SISTEMA (Automação)
*   **Pode:** Criar Pendências via gatilhos (ex: Nova OS), ler dados para validação.
*   **Não Pode:** Realizar ações via login interativo (interface web). Acesso restrito a API Keys/Internal Calls.

---

## 2. Regras de Escalonamento e Gestão de Papéis

1.  **Soberania do Admin:** Apenas usuários com papel `ADMIN` podem criar novos usuários ou alterar os papéis de um usuário existente.
2.  **Auto-Gestão Proibida:** Um `ADMIN` não pode remover seu próprio papel de `ADMIN` (para evitar lockout), nem alterar seus próprios privilégios para burlar auditoria.
3.  **Segregação de Funções:** A concessão do papel `ADMIN` deve ser aprovada por um processo externo (ex: solicitação formal) e registrada.

---

## 3. Auditoria e Rastreabilidade

O sistema deve registrar eventos críticos de segurança com imutabilidade.

### 3.1 Eventos Obrigatórios de Auditoria
Todo log deve conter: `Timestamp`, `ActorID`, `Action`, `TargetID`, `OldValue`, `NewValue`, `IP/Origin`.

1.  `USUARIO_CRIADO`: Quem criou o novo usuário.
2.  `USUARIO_BLOQUEADO/DESBLOQUEADO`: Alteração de status `ativo`.
3.  `PAPEL_ATRIBUIDO`: Adição de role a um usuário (ex: `USUARIO` -> `OPERADOR`).
4.  `PAPEL_REMOVIDO`: Remoção de role.
5.  `LOGIN_FALHA`: Tentativas sucessivas de login com senha errada (para detecção de Brute Force).

### 3.2 Campos Imutáveis
*   **Log de Auditoria:** Jamais pode ser editado ou excluído via sistema, mesmo por Admins. Apenas acesso direto ao banco (DBA) pode limpar logs antigos (Rotação de Logs).

---

## 4. Segurança e Sessão

1.  **Expiração:** Sessões de usuário devem ter timeout absoluto (ex: 8h) e idle timeout (ex: 30min).
2.  **Revogação:** A alteração de papéis ou bloqueio de um usuário deve invalidar seus tokens/sessões ativas imediatamente (ou no próximo check de validação).
3.  **Visibilidade:** Mensagens de erro de login devem ser genéricas ("Usuário ou senha inválidos") para não revelar existência de contas.
