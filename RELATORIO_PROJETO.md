# Relatório Técnico - Sistema ARARA
**Data:** 22/01/2026
**Status:** MVP (Protótipo Funcional Avançado)
**Stack:** Next.js 13+ (App Router), TypeScript, Tailwind CSS

---

## 1. Funcionalidades Implementadas (Pronto) ✅

### Módulo Administrativo (Configurações)
- [x] **Gestão de Usuários:** CRUD completo com vínculo obrigatório a Cargo e Setor.
- [x] **Gestão de Cargos:** Definição de níveis de acesso e escopo (Individual/Setorial).
- [x] **Gestão de Setores:** Organização departamental.
- [x] **Gestão de Funcionários:** Sincronização automática entre Login (User) e RH (Funcionario).

### Segurança & Acesso
- [x] **Autenticação:** Login customizado com JWT.
- [x] **Autorização (RBAC):** Proteção de rotas e componentes baseada em Papéis (Roles).
- [x] **Middleware:** Proteção de rotas privadas via Next.js Middleware.

### Módulo de Pendências (Tarefas)
- [x] **Criação Inteligente:** Filtros dinâmicos de responsáveis baseados no setor selecionado.
- [x] **Listagem e Filtros:** Busca por termo, datas, status, prioridade, setor e responsável.
- [x] **Listas Unificadas:** Todos os selects puxam dados dinâmicos do cadastro principal.
- [x] **Edição/Status:** Fluxo básico de alteração de status e conclusão.

### Módulo de Ordem de Serviço (OS)
- [x] **Integração Legado:** Proxy/Cliente para buscar dados de Clientes e Contratos em API externa.
- [x] **Criação de OS:** Formulário específico para abertura de demandas de clientes.

---

## 2. Pontos Críticos para Deploy (Falta Fazer) 🚧

Estes itens são **obrigatórios** antes de colocar o sistema em produção real.

### A. Persistência de Dados (Banco de Dados)
**Problema:** O sistema atual usa `MockStores` que salvam em arquivos JSON locais (`/data/*.json`).
**Risco:** Em hospedagens modernas (Vercel, Netlify, AWS Lambda), o sistema de arquivos é temporário. **Todos os dados serão perdidos** a cada deploy ou reinício.
**Abordagem Recomendada:**
1. Instalar **Prisma ORM**.
2. Definir schema do banco (PostgreSQL ou MySQL).
3. Criar serviços reais (`DbUserStore`, `DbPendenciaStore`) substituindo os Mocks.
4. Migrar os dados atuais dos JSONs para o banco (Seed).

### B. Segurança de Autenticação
**Problema:** As senhas não estão criptografadas e há senhas mestras de teste no código.
**Abordagem Recomendada:**
1. Implementar **bcrypt** para hash de senhas.
2. Remover lógicas de `pass === '123456'` dos arquivos de login.
3. Configurar variáveis de ambiente (`.env`) seguras para produção.

---

## 3. Sugestões de Melhoria (Roadmap) 🚀

### Curto Prazo (Melhoria de UX)
- **Kanban Board:** Visualização de colunas para as pendências.
- **Upload de Arquivos:** Permitir anexar fotos/PDFs nas Pendências e OS.
- **Histórico/Log:** Timeline de quem alterou o que na tarefa.

### Médio Prazo (Funcionalidade)
- **Notificações:** Alertas por e-mail ou push quando uma tarefa é atribuída.
- **Dashboard Gerencial:** Gráficos de performance por setor.
- **Versão Mobile PWA:** Melhorar a experiência para técnicos de campo.

---

## 4. Plano de Ação Imediato

1. Configurar **Prisma ORM** e conectar a um banco de dados local para desenvolvimento.
2. Substituir o `UserService` e `PendenciaService` para ler/gravar no banco real.
3. Testar o fluxo completo (Criação -> Salvamento -> Leitura).
4. Preparar script de deploy.
