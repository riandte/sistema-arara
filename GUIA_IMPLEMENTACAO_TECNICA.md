# Guia de Implementação Técnica: Módulo Pendências

Este documento traduz as regras de negócio definidas em `MODELAGEM_PENDENCIA.md`, `MODELAGEM_KANBAN.md` e `GOVERNANCA_E_MATURIDADE.md` para a arquitetura técnica do ARARA.

## 1. Mapeamento: Documentação → Código

| Conceito Documentado | Arquivo/Estrutura no Projeto | Observação |
| :--- | :--- | :--- |
| **Entidade Pendência** | `src/lib/types.ts` (Interface `Pendencia`) | Single Source of Truth para tipagem. |
| **Status e Enums** | `src/lib/types.ts` (Types `StatusPendencia`, `TipoPendencia`) | Use os tipos exportados, nunca strings mágicas. |
| **Histórico de Movimentação** | `src/lib/types.ts` (Interface `HistoricoMovimentacao`) | Estrutura para log de auditoria. |
| **Regras de Transição** | `src/lib/services/pendenciaService.ts` | A lógica de validação `canTransition(from, to)` deve residir aqui. |
| **Criação Automática (OS)** | `src/app/api/service-orders/route.ts` | O endpoint `POST` de OS deve chamar `PendenciaService.criar()`. |
| **Autorização (ACL)** | `src/lib/auth.ts` (ou utilitário similar) + API Routes | Validação de `userId` vs `criadoPor`/`responsavelId`. |
| **API Endpoints** | `src/app/api/pendencias/[id]/route.ts` | Implementação de `PATCH` (mover) e `GET` (listar). |

---

## 2. Responsabilidades por Camada

A arquitetura deve seguir estritamente a separação de interesses para evitar vazamento de regras para o frontend.

### A. Camada de API (Controllers)
*   **Local:** `src/app/api/**`
*   **Responsabilidade:**
    1.  Receber a requisição HTTP.
    2.  Identificar o usuário logado (Session/JWT).
    3.  Validar schema de entrada (Zod/Yup).
    4.  Chamar a Camada de Serviço.
    5.  Retornar Status HTTP correto (`200`, `400`, `403`, `404`).
*   **Proibido:** Conter lógica de "se status for X então Y".

### B. Camada de Serviço (Domain Logic)
*   **Local:** `src/lib/services/pendenciaService.ts`
*   **Responsabilidade:**
    1.  **Validar Regras de Negócio:** Verificar se a transição de status é permitida conforme `MODELAGEM_KANBAN.md`.
    2.  **Validar Permissões:** Verificar se o usuário tem direito de realizar a ação na pendência específica.
    3.  **Atomicidade:** Garantir que a atualização da Pendência e a inserção do Histórico ocorram juntas.
    4.  **Imutabilidade:** Garantir que campos proibidos não sejam alterados.
*   **Proibido:** Acessar diretamente `req` ou `res` do Next.js.

### C. Camada de Frontend (UI)
*   **Local:** `src/app/(private)/pendencias/**`
*   **Responsabilidade:**
    1.  Exibir dados conforme recebidos da API.
    2.  Renderizar colunas do Kanban baseadas nos Enums.
    3.  Feedback visual de erros.
*   **Proibido:** Conter regras de validação de segurança (ex: "esconder botão" não substitui validação na API).

---

## 3. Pontos Críticos de Validação (Tradução de Regras)

### 3.1 Validação de Transição de Status
No `PendenciaService.atualizarStatus(id, novoStatus, usuarioId, motivo)`:

```typescript
// Pseudo-código da lógica obrigatória
const transicoesPermitidas = {
  'PENDENTE': ['EM_ANDAMENTO', 'CANCELADO'],
  'EM_ANDAMENTO': ['PENDENTE', 'CONCLUIDO', 'CANCELADO'],
  'CONCLUIDO': ['EM_ANDAMENTO'], // Apenas Admin
  'CANCELADO': ['PENDENTE']      // Apenas Admin
};

if (!transicoesPermitidas[statusAtual].includes(novoStatus)) {
  throw new Error(`Transição inválida de ${statusAtual} para ${novoStatus}`);
}
```

### 3.2 Validação de Permissões (ACL)
Antes de executar qualquer update:

```typescript
const isCriador = pendencia.criadoPor === usuarioId;
const isResponsavel = pendencia.responsavelId === usuarioId;
const isAdmin = usuario.role === 'ADMIN';

if (novoStatus === 'CANCELADO' && !isCriador && !isAdmin) {
  throw new ForbiddenError('Apenas Criador ou Admin podem cancelar.');
}
```

---

## 4. Estratégia de Auditoria e Imutabilidade

### 4.1 Registro de Eventos
Toda operação de escrita na tabela/coleção `Pendencias` que altere o status **DEVE** inserir um registro em `HistoricoMovimentacao`.

*   **Não confiar no cliente:** A data (`dataMovimentacao`) deve ser gerada no servidor (`new Date().toISOString()`).
*   **Rastreabilidade:** O `usuarioId` deve vir do token de sessão validado, nunca do corpo da requisição.

### 4.2 Proteção de Campos Imutáveis
No método de update, filtrar explicitamente os campos que não podem ser tocados:

```typescript
// Exemplo de proteção
const dadosSeguros = {
  ...dadosRecebidos,
  id: undefined,          // Nunca altera ID
  criadoPor: undefined,   // Nunca altera criador
  dataCriacao: undefined, // Nunca altera data de criação
  origemId: undefined     // Nunca altera vínculo original
};
```

---

## 5. Checklist Técnico de Implementação

Use este checklist antes do Code Review.

### Segurança e Integridade
- [ ] **Auth:** Todos os endpoints de Pendência verificam se há usuário logado?
- [ ] **Role Check:** O serviço bloqueia usuários comuns de reabrirem tarefas concluídas?
- [ ] **Injection:** Inputs de texto (título/descrição/motivo) estão sanitizados?
- [ ] **ID Check:** O serviço valida se o ID da pendência existe antes de tentar atualizar?

### Consistência de Dados
- [ ] **Transição:** A matriz de transições (Modelagem Kanban) está implementada hardcoded ou via config no Service?
- [ ] **Enum:** O código usa `StatusPendencia` (TS Enum/Type) em vez de strings manuais?
- [ ] **Histórico:** É impossível mudar status sem criar registro de histórico (atomicidade)?

### Qualidade de Código
- [ ] **Separação:** A API Route apenas repassa dados para o Service?
- [ ] **Tratamento de Erro:** O Service lança erros tipados (ex: `DomainError`, `NotFoundError`) que a API captura e converte para HTTP Status correto?
- [ ] **Tipagem:** Não existe uso de `any` nas interfaces de Pendência?
