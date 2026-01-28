# Estratégia de Migração e Dados em Produção

Este documento define o fluxo seguro para gerenciar o esquema do banco de dados e a massa de dados inicial no ambiente de produção do **ARARA — Gestão de Chamados Internos**.

## 1. Fluxo de Migração (Schema)

Em produção, **NUNCA** utilize `prisma migrate dev`. Este comando pode resetar o banco de dados.

### Procedimento Padrão de Deploy
O comando seguro para aplicar alterações de esquema pendentes é:

```bash
npm run migrate:deploy
# ou diretamente:
# npx prisma migrate deploy
```

Este comando:
1. Lê o arquivo `database/schema.prisma`.
2. Verifica a tabela `_prisma_migrations` no banco de dados.
3. Aplica apenas as migrações que ainda não foram aplicadas.
4. **NÃO** gera novos arquivos de migração.
5. **NÃO** reseta o banco de dados.

### Fluxo de Desenvolvimento -> Produção
1. **Dev**: Realize alterações no `database/schema.prisma`.
2. **Dev**: Gere a migração: `npx prisma migrate dev --name nome_da_mudanca`.
3. **Dev**: Comite a nova pasta `database/migrations/YYYYMMDDHHMMSS_nome_da_mudanca`.
4. **CI/CD ou Deploy**: No ambiente de produção, após baixar o código, execute `npm run migrate:deploy`.

## 2. Estratégia de Seeding (Dados Iniciais)

O seed popula o banco com dados essenciais (Papéis, Permissões, Setores, Usuário Admin Inicial).

### Regras de Execução
- **Automático**: O seed **NÃO** deve ser executado automaticamente no pipeline de deploy padrão para evitar sobrescrita de dados sensíveis ou duplicação indesejada, embora o script seja idempotente (use `upsert`).
- **Manual**: Deve ser executado manualmente na primeira instalação ou quando houver necessidade explícita de atualizar tabelas de domínio (ex: novas permissões do sistema).

### Como Rodar o Seed em Produção
```bash
npm run db:seed
```

O script `database/seed.ts` foi configurado para ser idempotente:
- Cria/Atualiza Permissões e Roles do sistema.
- Cria/Atualiza Setores padrão.
- Cria o usuário `admin` apenas se não existir (senha padrão deve ser alterada imediatamente).

## 3. Rollback de Migração

O Prisma não possui um comando nativo simples de `rollback` (como `migrate down`) que reverta automaticamente o esquema e os dados.

### Procedimento de Emergência (Down Migration)
Se uma migração quebrar a produção, a estratégia recomendada é "Roll Forward" (criar uma nova migração corrigindo o problema). Se o rollback for imperativo:

1. **Identifique a migração problemática** via `npx prisma migrate status`.
2. **Reverta manualmente no banco**:
   - Conecte-se ao banco de dados diretamente.
   - Execute o script SQL inverso (você deve criar este script manualmente baseando-se no que a migração fez).
   - Delete o registro da migração problemática na tabela `_prisma_migrations`:
     ```sql
     DELETE FROM "_prisma_migrations" WHERE migration_name = 'YYYYMMDDHHMMSS_nome_da_problematic_migration';
     ```
3. **Localmente**: Reverta as alterações no `schema.prisma` e delete o arquivo de migração problemático.

## 4. Reset Total (Apenas em caso de catástrofe/setup inicial)
**PERIGO**: Isso apaga TODOS os dados.
```bash
npx prisma migrate reset
```
*Jamais execute isso em um banco de produção com dados reais de clientes/chamados.*
