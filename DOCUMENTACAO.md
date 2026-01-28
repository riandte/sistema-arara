# Documentação Técnica - Sistema ARARA

## 1. Visão Geral

O **ARARA** é uma aplicação web moderna desenvolvida para modernizar a gestão operacional da ARARA. 

**Mudança Arquitetural (v2):** O sistema agora é centrado na entidade **Pendência** (Unidade de Trabalho), substituindo a Ordem de Serviço (OS) como núcleo. A OS passa a ser apenas um dos possíveis gatilhos para a criação de uma Pendência.

### Principais Características
- **Pendência-Centric**: Gestão unificada de tarefas (Operacionais, Administrativas, Financeiras).
- **Interface Moderna**: Design "Dark Modern" com glassmorphism e Kanban Board.
- **Autenticação Segura**: Proteção de rotas via Middleware e JWT.
- **Integração Híbrida**: Capacidade de operar integrado ao ERP Legado ou em modo Mock.
- **Impressão Client-Side**: Geração de documentos PDF formatados diretamente no navegador.

---

## 2. Entidades Principais

### 2.1. Pendência (Núcleo)
Representa qualquer unidade de trabalho no sistema.
- **Tipos**: OS, ADMINISTRATIVO, FINANCEIRO, OUTRO.
- **Status**: PENDENTE, EM_ANDAMENTO, CONCLUIDO, CANCELADO.
- **Prioridade**: BAIXA, MEDIA, ALTA.
- **Vínculos**: Pode estar vinculada a uma OS (`origemId`, `origemTipo='OS'`) ou ser avulsa.

### 2.2. Ordem de Serviço (OS)
Documento formal de solicitação de serviço.
- **Comportamento**: Ao criar uma OS, o sistema gera automaticamente uma **Pendência** vinculada (relação 1:1).
- **Objetivo**: A OS serve como contrato/formalização, enquanto a Pendência gerencia a execução.

---

## 3. Arquitetura e Estrutura de Pastas

O projeto segue a convenção do Next.js App Router:

```
src/
├── app/
│   ├── (public)/          # Rotas públicas (Login)
│   ├── (private)/         # Rotas protegidas
│   │   ├── layout.tsx     # AppShell (Sidebar, Header)
│   │   ├── pendencias/    # [NOVO] Gestão de Pendências (Kanban)
│   │   └── os/            # Módulo de Ordens de Serviço
│   ├── api/               # API Routes (Backend-for-Frontend)
│   │   ├── auth/          # Login/Logout
│   │   ├── locapp/        # Proxy para API externa
│   │   ├── pendencias/    # [NOVO] API de Pendências
│   │   └── service-orders/# API de OS
├── components/            # Componentes React
├── lib/                   # Lógica de negócio
│   ├── services/          # [NOVO] Serviços de domínio (PendenciaService)
│   └── locapp/            # Integração legado
└── data/                  # [NOVO] Armazenamento local (Mock DB JSON)
```

---

## 4. Fluxos e Processos

### 4.1. Gestão de Pendências
- **Visualização (`/pendencias`)**: Quadro Kanban separado por status (A Fazer, Em Andamento, Concluído).
- **Criação Manual**: Permite criar tarefas avulsas sem vínculo com OS.
- **Atualização**: Mudança de status e prioridade (via API).

### 4.2. Fluxo de OS -> Pendência
1.  Usuário cria OS em `/os/nova`.
2.  Backend (`api/service-orders`) salva a OS.
3.  **Automação**: O backend invoca `PendenciaService` e cria uma Pendência do tipo `OS`, copiando dados relevantes (Cliente, Prioridade, Descrição).
4.  A nova tarefa aparece imediatamente no quadro de Pendências.

### 4.3. Integração com ERP Legado
Centralizada em `src/lib/locapp`. Utiliza dados mockados (`clientes_postman.json`) se a API externa não estiver configurada.

---

## 5. Modelos de Dados (Types)

Definidos em `src/lib/types.ts`:

```typescript
interface Pendencia {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: 'OS' | 'ADMINISTRATIVO' | 'FINANCEIRO' | 'OUTRO';
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
  origemId?: string; // Ex: ID da OS
  origemTipo?: 'OS' | 'MANUAL';
  // ...
}
```

---

## 6. Guia de Desenvolvimento

### Instalação e Execução
```bash
npm install
npm run dev
# Acessar http://localhost:3000
```

### Armazenamento de Dados (Mock)
Os dados de pendências são persistidos em `data/pendencias.json` para facilitar o desenvolvimento sem banco de dados real neste estágio.
