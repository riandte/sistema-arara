# Checklist de Go-Live (Produção)

Este documento deve ser validado antes de cada deploy em produção do **ARARA — Gestão de Chamados Internos**.

## 1. Ambiente e Segurança
- [ ] **Variáveis de Ambiente**:
  - [ ] `DATABASE_URL` aponta para o banco de produção (PostgreSQL).
  - [ ] `JWT_SECRET_KEY` tem no mínimo 32 caracteres e é diferente de dev.
  - [ ] `LOCAPP_BASE_URL` está configurada para a API real (não mock).
  - [ ] `LOCAPP_CNPJ` e `LOCAPP_SECRET` estão configurados.
  - [ ] `NODE_ENV` está definido como `production`.
- [ ] **Banco de Dados**:
  - [ ] Migrações aplicadas (`npm run migrate:deploy`).
  - [ ] Seed executado manualmente se necessário (apenas na instalação inicial).
  - [ ] Backup do banco configurado e testado.

## 2. Build e Deploy
- [ ] **Build**:
  - [ ] `npm run build` executado com sucesso sem erros.
  - [ ] Nenhuma dependência de desenvolvimento (`devDependencies`) necessária para rodar o app.
- [ ] **Start**:
  - [ ] Aplicação inicia com `npm run start`.
  - [ ] Logs não apresentam erros na inicialização.

## 3. Validação Funcional (Smoke Test)
- [ ] **Health Check**:
  - [ ] Acessar `/api/health` e receber `{"status":"ok",...}`.
- [ ] **Autenticação**:
  - [ ] Login com usuário admin funciona.
  - [ ] Logout funciona.
  - [ ] Acesso a rota protegida sem token redireciona para login.
- [ ] **Integração Externa (LocApp)**:
  - [ ] Pesquisa de clientes retorna dados reais da API.
  - [ ] **IMPORTANTE**: O fallback para dados mockados (`clientes_postman.json`) está desativado em produção (código verificado).

## 4. Observabilidade
- [ ] **Logs**:
  - [ ] Logs estão sendo gerados em formato JSON (estruturado).
  - [ ] Nenhuma senha ou dado sensível vazando nos logs.
  - [ ] Stack traces de erros não são expostos ao cliente (navegador).

## 5. Auditoria Final
- [ ] **Limpeza**:
  - [ ] Nenhum console.log de debug esquecido no código crítico.
  - [ ] Nenhuma rota de teste exposta (`/api/test`, etc).
- [ ] **Senha Admin**:
  - [ ] A senha do usuário `admin` inicial foi alterada imediatamente após o seed.

---
**Aprovado por:** _________________________
**Data:** ___/___/______
