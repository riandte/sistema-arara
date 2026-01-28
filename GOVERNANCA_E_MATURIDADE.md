# Governança, Maturidade e Consolidação do Sistema (Fase 4)

Este documento consolida as regras finais, padrões e checklists para garantir a estabilidade e previsibilidade do módulo de Pendências do ARARA.

---

## 1. Resumo Consolidado do Sistema de Pendências

O sistema ARARA evoluiu de um gerenciador de OS para um sistema orientado a **Pendências**. A Pendência é a unidade atômica de trabalho.

*   **Núcleo:** Entidade `Pendencia` (Interface TypeScript definida).
*   **Fluxo:** Baseado em estados (Kanban) com 4 status: `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDO`, `CANCELADO`.
*   **Origem:** Pode nascer de uma OS (Trigger Automático 1:1) ou ser criada manualmente (Avulsa).
*   **Integridade:** Histórico de movimentação imutável e validação estrita de transições de status.

---

## 2. Regras Finais de Governança

Definição clara de "Quem faz o quê" e limites de poder.

### 2.1 Matriz de Responsabilidade (RACI Simplificado)

| Ação | Criador (Solicitante) | Responsável (Executor) | Administrador | Sistema (Automação) |
| :--- | :---: | :---: | :---: | :---: |
| **Criar Pendência** | ✅ (Manual) | ❌ | ✅ | ✅ (Via OS) |
| **Atribuir Responsável** | ✅ | ✅ (Self-assign) | ✅ (Forçar) | ❌ |
| **Iniciar Execução** | ❌ | ✅ | ✅ | ❌ |
| **Concluir Tarefa** | ❌ | ✅ | ✅ | ❌ |
| **Cancelar Tarefa** | ✅ | ❌ | ✅ | ❌ |
| **Reabrir/Reativar** | ❌ | ❌ | ✅ (Exclusivo) | ❌ |
| **Visualizar Histórico** | ✅ | ✅ | ✅ | N/A |

### 2.2 Decisões Não-Automatizáveis
*   O sistema **NUNCA** deve decidir sozinho que uma tarefa está "Concluída". A conclusão exige validação humana.
*   O sistema **NUNCA** deve excluir fisicamente (Hard Delete) uma pendência que já tenha histórico.
*   O sistema **NUNCA** deve alterar a prioridade de uma pendência baseada em "tempo de fila" sem intervenção humana.

---

## 3. Padrões de Consistência do Sistema

Para garantir que o código e a API se comportem de forma previsível.

### 3.1 Nomenclatura e Tipagem
*   **Status:** Sempre UPPERCASE (`PENDENTE`, `CONCLUIDO`).
*   **Datas:** Sempre ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
*   **IDs:** Sempre UUID v4.

### 3.2 Comportamento em Erros (API)
*   **Transição Inválida:** Retornar `400 Bad Request` com mensagem: *"Transição de status não permitida: {de} -> {para}"*.
*   **Ação Não Autorizada:** Retornar `403 Forbidden` (Usuário logado mas sem permissão específica).
*   **Recurso Não Encontrado:** Retornar `404 Not Found` (ID inexistente).

### 3.3 Regra de Ouro da Integridade
> "Uma Pendência nascida de uma OS carrega o DNA da OS para sempre, mas a morte da OS não mata o histórico da Pendência."
*   Se a OS for excluída, a Pendência deve ser CANCELADA (não excluída), preservando o registro de que "houve uma demanda".

---

## 4. Eventos Importantes do Domínio

Eventos que devem ser monitorados e podem disparar side-effects (logs, notificações futuras, webhooks).

1.  `PENDENCIA_CRIADA`: Disparado na criação (Manual ou via OS).
2.  `RESPONSAVEL_ATRIBUIDO`: Quando `responsavelId` muda de null para valor.
3.  `STATUS_ALTERADO`: Qualquer mudança de status. Payload inclui `{ anterior, novo, motivo }`.
4.  `PENDENCIA_CONCLUIDA`: Subconjunto de Status Alterado, focado em métricas de sucesso.
5.  `PENDENCIA_CANCELADA`: Subconjunto de Status Alterado, focado em perda/descarte.

---

## 5. Regras de Auditoria e Rastreabilidade

### 5.1 O que deve ser registrado (Imutável)
*   Quem criou a tarefa.
*   Data exata da criação.
*   Todas as trocas de status (Quem, Quando, De, Para).
*   Todas as trocas de responsável.

### 5.2 Privacidade e Visibilidade
*   **Histórico Completo:** Visível para Administradores, Criador e Responsável Atual.
*   **Campos Sensíveis:** Se houver dados sensíveis na descrição, apenas Admin e Responsável devem ver (Future-proof).

---

## 6. Checklist Final de Maturidade (Ready for Production)

Antes de considerar o módulo "Pronto", verifique:

### 🛡️ Segurança
- [ ] Todas as rotas de escrita (`POST`, `PATCH`, `DELETE`) exigem autenticação?
- [ ] O ID do usuário logado é validado contra o `criadoPor` ou `responsavelId` nas operações restritas?
- [ ] Inputs de texto (título, descrição) são sanitizados contra XSS/Injection?

### 💾 Integridade de Dados
- [ ] IDs são garantidos como UUIDs válidos?
- [ ] Não existem pendências "orfãs" de status (status inválido ou null)?
- [ ] Toda pendência tipo 'OS' tem um `origemId` preenchido?

### ⚙️ Comportamento
- [ ] A criação de OS gera infalivelmente uma Pendência?
- [ ] Tentar mover de 'PENDENTE' para 'CONCLUIDO' falha consistentemente?
- [ ] Tentar cancelar sem motivo falha consistentemente?

### 🚀 Escalabilidade (Conceitual)
- [ ] O modelo suporta 1 milhão de pendências? (Sim, estrutura indexável por ID e Status).
- [ ] O modelo suporta novos tipos de pendência? (Sim, ENUM `TipoPendencia` extensível).
- [ ] O modelo suporta múltiplos fluxos? (Sim, lógica de transição pode ser parametrizada por Tipo no futuro).
