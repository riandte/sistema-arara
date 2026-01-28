# Modelagem Conceitual: Usuários, Papéis e Permissões (RBAC)

Este documento define o modelo estrutural de controle de acesso (Role-Based Access Control) para o sistema ARARA.

## 1. Entidades Principais

### 1.1 Usuário (`Usuario`)
Representa um ator humano ou sistêmico que interage com a plataforma.

*   **Identificação:** `id` (UUID), `email` (Unique), `login` (Unique).
*   **Autenticação:** `senhaHash` (Bcrypt), `ativo` (Boolean).
*   **Associação:** Possui uma lista de `roles` (Papéis).
*   **Dados:** `nome`, `departamento` (Opcional).

### 1.2 Papel (`Role`)
Representa um conjunto de responsabilidades e funções dentro do sistema. É a entidade que agrupa permissões.

*   **Identificação:** `id` (String Enum), `nome` (Legível), `descricao`.
*   **Natureza:**
    *   **ADMIN:** Acesso irrestrito a configurações e gestão.
    *   **OPERADOR:** Foco em execução operacional (OS, Pendências).
    *   **USUARIO:** Acesso básico, focado em visualização ou solicitações simples.
    *   **SISTEMA:** Papel exclusivo para automações (ex: criação automática de OS).

### 1.3 Permissão (`Permission`)
Representa uma capacidade atômica de realizar uma ação em um recurso.

*   **Formato:** `RECURSO:ACAO` (ex: `PENDENCIA:CRIAR`, `PENDENCIA:CONCLUIR`).
*   **Associação:** Vinculada exclusivamente a Papéis, nunca diretamente a usuários.

---

## 2. Regras Estruturais Obrigatórias

1.  **Multi-Role:** Um usuário pode ter múltiplos papéis (ex: um Gerente pode ser `OPERADOR` e `GESTOR_FINANCEIRO`). A permissão final é a **união** das permissões de todos os seus papéis.
2.  **Imutabilidade de Definição:** A lista de permissões de um Papel (Role) é definida estaticamente no código ou banco de dados e não deve ser alterada em runtime sem um processo formal de deploy ou auditoria.
3.  **Indireção:** Usuários **NUNCA** recebem permissões diretas. Se um usuário precisa de uma permissão especial, deve-se criar ou atribuir um Papel que contenha essa permissão.
4.  **Princípio do Privilégio Mínimo (Least Privilege):** Usuários devem receber apenas os papéis estritamente necessários para suas funções.
5.  **Negação por Padrão (Deny by Default):** Se uma permissão não foi explicitamente concedida através de um papel, o acesso é negado.

---

## 3. Matriz Inicial de Papéis e Permissões

| Permissão (Scope) | ADMIN | OPERADOR | USUARIO | SISTEMA |
| :--- | :---: | :---: | :---: | :---: |
| `PENDENCIA:LER_TODAS` | ✅ | ✅ | ❌ (Apenas próprias) | ✅ |
| `PENDENCIA:CRIAR` | ✅ | ✅ | ✅ | ✅ |
| `PENDENCIA:EDITAR` | ✅ | ✅ | ❌ | ❌ |
| `PENDENCIA:MOVER` | ✅ | ✅ | ❌ | ❌ |
| `PENDENCIA:CONCLUIR` | ✅ | ✅ | ❌ | ❌ |
| `PENDENCIA:CANCELAR` | ✅ | ❌ | ✅ (Apenas próprias) | ❌ |
| `USUARIO:GERENCIAR` | ✅ | ❌ | ❌ | ❌ |
| `OS:CRIAR` | ✅ | ✅ | ❌ | ❌ |

---

## 4. Representação de Dados (Interface Typescript)

```typescript
export type RoleName = 'ADMIN' | 'OPERADOR' | 'USUARIO' | 'SISTEMA';

export type PermissionString = 
  | 'PENDENCIA:LER_TODAS'
  | 'PENDENCIA:CRIAR'
  | 'PENDENCIA:EDITAR'
  | 'PENDENCIA:MOVER'
  | 'PENDENCIA:CONCLUIR'
  | 'PENDENCIA:CANCELAR'
  | 'USUARIO:GERENCIAR'
  | 'OS:CRIAR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  roles: RoleName[];
  ativo: boolean;
}
```
