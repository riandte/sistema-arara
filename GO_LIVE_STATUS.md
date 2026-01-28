# Checklist Go-Live Single-Tenant (Validado)

Este documento registra o status de validação para o Go-Live do sistema ARARA em modo Single-Tenant.

## 1. Banco de Dados (PostgreSQL)

- [x] **Schema**: Tabelas críticas (`User`, `ServiceOrder`, `Pendencia`, `AuditEvent`) validadas no `schema.prisma`.
- [x] **Migrations**: Migração inicial `init` aplicada com sucesso.
- [x] **Seed**: Script `seed.ts` executado com sucesso, populando usuários, roles, setores e cargos.
- [x] **Backup**: Script de backup criado em `scripts/backup-db.ts`.

## 2. Backend & Serviços

- [x] **Configuração**: Variáveis de ambiente (`.env`) e validador (`env.ts`) verificados.
- [x] **Conexão**: Validação de conexão via `smoke-test`.
- [x] **RBAC**: Permissões básicas populadas via seed.
- [x] **Fluxo de Negócio**: Teste automatizado de criação de OS -> Geração de Pendência executado com sucesso (`scripts/smoke-test.ts`).
- [x] **Integração LocApp**: Mock configurado para ambiente de desenvolvimento, pronto para produção (validação de ENV).
- [x] **Auditoria**: Logs de auditoria persistindo no banco de dados (`AuditEvent`).

## 3. Frontend

- [x] **Build**: Build de produção (`npm run build`) concluído sem erros.
- [ ] **Testes Manuais**: (Pendente validação visual final em ambiente de homologação/produção).

## 4. Scripts de Operação

### Smoke Test (Validação Pós-Deploy)
Executa verificações de conexão, integridade de dados e fluxo crítico de negócio.
```bash
npx tsx -r dotenv/config scripts/smoke-test.ts
```

### Backup do Banco
Gera um dump SQL do banco de dados atual na pasta `backups/`. Requer `pg_dump` instalado no path.
```bash
npx tsx -r dotenv/config scripts/backup-db.ts
```

## Próximos Passos (Pós-Go-Live)

1. Monitorar logs de aplicação para erros de runtime.
2. Agendar execução periódica do script de backup.
3. Iniciar plano de transição para Multi-Tenant (conforme roadmap).
