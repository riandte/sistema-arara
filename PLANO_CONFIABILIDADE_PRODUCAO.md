# Plano de Confiabilidade e Prontidão para Produção (Fase 6)

Este documento define a estratégia final para garantir a robustez, segurança e estabilidade do sistema ARARA em ambiente de produção.

---

## 1. Cenários de Falha Reais e Análise de Risco

| ID | Cenário | Impacto | Probabilidade | Severidade |
| :--- | :--- | :--- | :--- | :--- |
| **CF-01** | **Race Condition:** Dois usuários (A e B) tentam mover a mesma pendência simultaneamente para colunas diferentes. | Estado final inconsistente ou perda de um dos movimentos. | Média | Alta |
| **CF-02** | **Bypass de UI:** Usuário inspeciona o elemento e habilita botão desabilitado ou chama a API diretamente (Curl/Postman). | Execução de ação não autorizada. | Baixa | Crítica |
| **CF-03** | **Estado Órfão:** Falha no meio de uma transação (ex: cria pendência mas falha ao criar histórico). | Perda de rastreabilidade (Auditoria corrompida). | Baixa | Alta |
| **CF-04** | **Payload Malicioso:** Envio de campos extras no JSON (ex: `{ "status": "CONCLUIDO", "criadoPor": "admin" }`) tentando sobrescrever auditoria. | Elevação de privilégio ou fraude. | Baixa | Crítica |
| **CF-05** | **Network Flap:** UI mostra sucesso (otimista) mas requisição cai por instabilidade de rede. | Desalinhamento entre o que o usuário vê e a realidade. | Alta | Média |

---

## 2. Estratégias de Tratamento e Mitigação

### Para CF-01 (Conflito Simultâneo)
*   **Estratégia:** Optimistic Concurrency Control (OCC) via versionamento (opcional) ou "Last Write Wins" com validação de estado prévio.
*   **Implementação:** O endpoint `PATCH` deve aceitar o `statusAnterior` esperado. Se o status no banco já mudou, rejeitar com `409 Conflict`.
    *   *Payload:* `{ "novoStatus": "CONCLUIDO", "statusAtualEsperado": "PENDENTE" }`
    *   *Query:* `UPDATE ... WHERE id = X AND status = 'PENDENTE'`

### Para CF-02 e CF-04 (Segurança)
*   **Estratégia:** Zero Trust no Backend.
*   **Implementação:** Ignorar qualquer validação vinda do frontend. O backend recalcula todas as permissões baseadas no Token JWT e no estado atual do banco.
*   **Sanitização:** Utilizar DTOs estritos (Zod) que removem silenciosamente campos não permitidos (`strip()`) ou rejeitam a requisição.

### Para CF-03 (Consistência)
*   **Estratégia:** Transações ACID.
*   **Implementação:** Usar `prisma.$transaction([])` (ou equivalente) para garantir que `Pendencia.update` e `Historico.create` ocorram juntos ou nenhum ocorra.

### Para CF-05 (UX/Network)
*   **Estratégia:** Rollback Automático na UI.
*   **Implementação:** O hook de mutação (React Query) deve capturar o erro, exibir Toast e forçar um `refetch` ou reverter o cache para o estado anterior.

---

## 3. Regras de Defesa do Backend

O backend é a última linha de defesa e deve agir de forma paranóica.

1.  **Validação de Schema (Input):**
    *   Rejeitar strings vazias onde não permitido.
    *   Validar formatos (UUID, ISO Date, Email).
    *   Rejeitar enums desconhecidos.

2.  **Imutabilidade Forçada:**
    *   No update, remover explicitamente: `id`, `dataCriacao`, `criadoPor`, `origemId`, `origemTipo`.
    *   Estes campos só são definidos no `INSERT`.

3.  **Idempotência Lógica:**
    *   Tentar mover de "PENDENTE" para "PENDENTE" deve retornar `200 OK` (sem mudança) ou `304 Not Modified`, mas nunca erro e nunca criar histórico duplicado inútil.

4.  **Proteção de Integridade Referencial:**
    *   Ao criar Pendência tipo 'OS', verificar se a OS com `origemId` realmente existe. Se não, `400 Bad Request`.

---

## 4. Diretrizes de Logging e Monitoramento

O sistema deve gerar logs estruturados (JSON) para fácil ingestão.

### O que LOGAR (Nível INFO/WARN/ERROR)
*   **INFO:** Transições de status bem-sucedidas (`Pendencia {id} movida de {A} para {B} por {user}`).
*   **WARN:** Tentativas de transição inválida (Regra de Negócio). Ajuda a detectar bugs de frontend ou usuários confusos.
*   **WARN:** Tentativas de acesso negado (`403`). Ajuda a detectar tentativas de invasão.
*   **ERROR:** Falhas de sistema (Banco fora, Timeout, Crash). Incluir Stack Trace.

### O que NUNCA LOGAR
*   Senhas ou Hashes.
*   Tokens JWT completos.
*   Dados Pessoais Sensíveis (PII) em logs de erro (ex: CPF, Endereço completo no corpo do JSON). Use mascaramento se necessário.

---

## 5. Checklist Final de Prontidão para Produção

### 🛡️ Segurança
- [ ] Autenticação obrigatória em TODAS as rotas de API (exceto login/public).
- [ ] Autorização baseada em Resource Ownership (Posso editar ESTA pendência?).
- [ ] Sanitização de HTML/Script em campos de texto livre (Descrição/Observação).
- [ ] Rate Limiting básico configurado (no Next.js ou Infra) para evitar DoS.

### 💾 Integridade e Dados
- [ ] Transações atômicas implementadas para Status + Histórico.
- [ ] Backups de banco de dados configurados e testados.
- [ ] Seeds de dados iniciais (Admin user, Configs) prontos e idempotentes.

### 👁️ Observabilidade
- [ ] Logs centralizados ou acessíveis.
- [ ] Tratamento global de erros (Error Boundary no Front, Global Handler no Back).
- [ ] Health Check endpoint (`/api/health`) retornando status do banco.

### 🔧 Manutenibilidade
- [ ] Variáveis de ambiente (`.env`) segregadas (Dev vs Prod).
- [ ] Segredos (Chaves de API, Salts) fora do código fonte.
- [ ] Código livre de `console.log` de debug.

### 🚦 Recuperação
- [ ] Estratégia de "Restart" definida (pm2, docker, vercel).
- [ ] Plano de Rollback caso o deploy quebre a produção.
