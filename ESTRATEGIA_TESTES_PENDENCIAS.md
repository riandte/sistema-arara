# Estratégia de Testes e Qualidade: Módulo Pendências

Este documento define a estratégia de QA (Quality Assurance) para garantir que o módulo de Pendências do ARARA seja robusto, seguro e à prova de regressões.

A premissa fundamental é: **O Backend é a única fonte de verdade.** Portanto, o foco massivo dos testes estará na validação das regras de negócio, segurança e integridade no servidor.

---

## 1. Pirâmide de Testes e Escopo

### 1.1 Testes Unitários (Service Layer)
*   **Foco:** Lógica de negócio pura, isolada de banco de dados e HTTP.
*   **O que testar:**
    *   Matriz de transição de status (`canTransition`).
    *   Regras de permissão (`canEdit`, `canView`).
    *   Cálculos de datas ou prioridades (se houver).
*   **Cobertura Alvo:** 100% das regras de negócio e caminhos lógicos (Branches).

### 1.2 Testes de Integração (API + Banco)
*   **Foco:** Fluxo completo da requisição até a persistência.
*   **O que testar:**
    *   Endpoints `POST`, `PATCH`, `GET`.
    *   Validação de Schema (Zod/Yup).
    *   Transações de banco de dados (Atomicidade Pendência + Histórico).
    *   Comportamento real com banco (Constraints, Foreign Keys).
*   **Cobertura Alvo:** Todos os endpoints críticos e cenários de erro HTTP (`400`, `403`, `404`).

### 1.3 Testes de Segurança (Security/ACL)
*   **Foco:** Tentativas de bypass e violação de acesso.
*   **O que testar:**
    *   Usuário tentando alterar pendência de outro (sem permissão).
    *   Tentativa de injeção de campos proibidos (`criadoPor`, `id`).
    *   Acesso a endpoints sem token de autenticação.

### 1.4 Testes de Frontend (O que NÃO testar)
*   **NÃO TESTAR:** Regras de negócio (ex: "Se status é X, botão Y aparece"). Isso é frágil e duplica lógica.
*   **TESTAR:**
    *   Renderização correta dos dados recebidos.
    *   Disparo correto das chamadas de API.
    *   Feedback visual de sucesso/erro (Toasts, Rollback otimista).
    *   Acessibilidade básica.

---

## 2. Matriz de Casos Críticos (Test Cases)

Estes cenários são obrigatórios e devem constar na suíte de testes automatizados.

### 2.1 Transições de Status (State Machine)
| Caso | De | Para | Ator | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **TC-ST-01** | PENDENTE | EM_ANDAMENTO | Responsável | ✅ Sucesso + Histórico criado |
| **TC-ST-02** | PENDENTE | CONCLUIDO | Qualquer | ❌ Erro 400 (Pular etapa) |
| **TC-ST-03** | CONCLUIDO | EM_ANDAMENTO | Admin | ✅ Sucesso (Reabertura) |
| **TC-ST-04** | CONCLUIDO | EM_ANDAMENTO | User Comum | ❌ Erro 403 (Permissão) |
| **TC-ST-05** | CANCELADO | PENDENTE | User Comum | ❌ Erro 403 (Permissão) |

### 2.2 Imutabilidade e Integridade
| Caso | Ação | Payload/Tentativa | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **TC-INT-01** | Update | `{ "id": "novo-id" }` | ❌ Ignorado ou Erro 400 (ID imutável) |
| **TC-INT-02** | Update | `{ "criadoPor": "admin" }` | ❌ Ignorado (Campo protegido) |
| **TC-INT-03** | Update | `{ "status": "INVALIDO" }` | ❌ Erro 400 (Enum validation) |
| **TC-INT-04** | Create (OS) | `{ "origemId": "9999" }` (Inexistente) | ❌ Erro 400 (Integridade Referencial) |

### 2.3 Concorrência (Race Conditions)
| Caso | Cenário | Resultado Esperado |
| :--- | :--- | :--- |
| **TC-CON-01** | Dois requests simultâneos para mudar status da mesma pendência. | Apenas UM passa, o outro recebe `409 Conflict` ou falha na validação de estado anterior. Histórico consistente (sem duplicação). |

---

## 3. Padrões de Organização e Nomenclatura

### 3.1 Estrutura de Pastas
```
__tests__/
├── unit/
│   └── services/
│       └── pendenciaService.test.ts  # Testes de regras puras
├── integration/
│   └── api/
│       └── pendencias/
│           ├── create.test.ts        # POST /api/pendencias
│           ├── update.test.ts        # PATCH /api/pendencias/[id]
│           └── list.test.ts          # GET /api/pendencias
└── e2e/ (Opcional futuro)
```

### 3.2 Convenção de Nomes (Describe/It)
Utilizar o padrão **"Given-When-Then"** ou descritivo claro.

*   `describe('PendenciaService.atualizarStatus')`
    *   `it('should allow transition from PENDENTE to EM_ANDAMENTO when user is assigned')`
    *   `it('should throw ForbiddenError when non-admin tries to reopen CONCLUIDO task')`
    *   `it('should throw ValidationError if transition is invalid')`

### 3.3 Fixtures e Mock Data
*   Nunca usar dados aleatórios sem seed (para reprodutibilidade).
*   Criar factories: `createMockPendencia({ status: 'PENDENTE' })`.
*   Usar UUIDs fixos em testes para facilitar debugging (ex: `00000000-0000-0000-0000-000000000001`).

---

## 4. Checklist "Definition of Done" (DoD)

Um PR (Pull Request) ou Deploy só pode ser aprovado se cumprir estes requisitos:

### 4.1 Pré-Merge (CI Pipeline)
- [ ] **Lint & Type Check:** Zero erros de ESLint e TypeScript.
- [ ] **Unit Tests:** 100% de sucesso.
- [ ] **Integration Tests:** 100% de sucesso em banco de teste (in-memory ou container efêmero).
- [ ] **Cobertura:** Mínimo de 80% de cobertura de linhas no `Service` e `API`.

### 4.2 Bloqueadores de Produção
- [ ] Falha em qualquer teste da **Matriz de Casos Críticos**.
- [ ] Existência de `console.log` ou código de debug.
- [ ] Vulnerabilidades conhecidas em dependências (`npm audit`).
- [ ] Ausência de migrações de banco necessárias para a nova versão.

### 4.3 Auditoria de Código
- [ ] O código de teste valida *explicitamente* o side-effect (ex: "Verificar se o registro foi criado no Histórico") e não apenas o status HTTP 200.
