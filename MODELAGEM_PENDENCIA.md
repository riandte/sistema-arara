# Definição Estrutural: Entidade Pendência

## 1. Descrição Conceitual
A **Pendência** é a entidade nuclear do sistema ARARA. Ela representa uma **Unidade de Trabalho Atômica** que deve ser realizada, acompanhada e concluída. Diferente da Ordem de Serviço (que é um documento contratual/formal), a Pendência é operacional e dinâmica.

Ela serve como contêiner genérico para qualquer tarefa no sistema, abstraindo a origem da demanda (seja ela uma OS, uma solicitação interna ou uma tarefa financeira).

## 2. Modelo de Dados (Interface Tipada)

```typescript
export interface Pendencia {
  // Identificação Única
  id: string;              // UUID v4
  
  // Dados Descritivos
  titulo: string;          // Obrigatório. Resumo da tarefa.
  descricao?: string;      // Opcional. Detalhamento técnico.
  
  // Classificação e Estado
  tipo: TipoPendencia;     // Obrigatório. Define o fluxo de trabalho.
  status: StatusPendencia; // Obrigatório. Estado atual no Kanban.
  prioridade: PrioridadePendencia; // Obrigatório. Nível de urgência.
  
  // Vínculos de Origem
  origemTipo: 'OS' | 'MANUAL'; // Obrigatório. Rastreabilidade.
  origemId?: string;       // Opcional. ID da entidade externa (ex: ID da OS).
  
  // Auditoria de Atores
  criadoPor: string;       // Obrigatório. ID do usuário ou 'sistema'.
  responsavelId?: string;  // Opcional. Quem está executando a tarefa.
  
  // Auditoria Temporal (Datas ISO 8601)
  dataCriacao: string;     // Obrigatório. Imutável.
  dataAtualizacao?: string;// Opcional. Última edição.
  dataConclusao?: string;  // Opcional. Preenchido ao finalizar.
  dataPrevisao?: string;   // Opcional. SLA ou Deadline.
  
  // Metadados
  tags?: string[];         // Opcional. Auxiliar para filtros.
}
```

## 3. ENUMs e Estados Válidos

### Status da Pendência
*Base para o fluxo Kanban.*
- `PENDENTE`: Tarefa criada, aguardando triagem ou início. (Backlog)
- `EM_ANDAMENTO`: Tarefa atribuída e sendo executada. (WIP)
- `CONCLUIDO`: Tarefa finalizada com sucesso. (Done)
- `CANCELADO`: Tarefa descartada ou invalidada.

### Tipos de Pendência
- `OS`: Tarefa gerada automaticamente a partir de uma Ordem de Serviço.
- `ADMINISTRATIVO`: Tarefas internas (ex: Compras, RH).
- `FINANCEIRO`: Tarefas de cobrança ou pagamento.
- `OUTRO`: Tarefas gerais não categorizadas.

### Prioridade
- `BAIXA`: Pode aguardar.
- `MEDIA`: Fluxo padrão.
- `ALTA`: Requer atenção imediata.

## 4. Regras de Negócio Imutáveis

1.  **Imutabilidade da Criação**: O campo `dataCriacao` e `criadoPor` JAMAIS podem ser alterados após a persistência inicial.
2.  **Unicidade do ID**: Cada Pendência deve ter um UUID v4 único globalmente.
3.  **Vínculo Obrigatório com OS**: Se `origemTipo` for 'OS', o campo `origemId` torna-se OBRIGATÓRIO e deve corresponder a uma OS válida.
4.  **Atribuição de Responsabilidade**: Apenas usuários com permissão de gestão ou o próprio criador podem definir o `responsavelId`.
5.  **Finalização**: Uma pendência só pode receber status `CONCLUIDO` se houver um `responsavelId` atribuído (ninguém conclui tarefa "sem dono").
6.  **Edição Restrita**: Pendências com status `CONCLUIDO` ou `CANCELADO` tornam-se "Read-Only" para dados descritivos (título/descrição), permitindo apenas reabertura (mudança de status) por administradores.

## 5. Relação Formal: Pendência x Ordem de Serviço

A relação é definida como **1:1 Direcional (OS -> Pendência)** no momento da criação, mas conceitualmente desacoplada.

- **Criação**: `ON CREATE OrdemServico -> TRIGGER Create Pendencia`
    - Toda vez que uma OS é persistida, o sistema cria imediatamente uma Pendência.
    - `Pendencia.origemId` = `OrdemServico.id`
    - `Pendencia.tipo` = `'OS'`
- **Independência**:
    - A exclusão de uma Pendência NÃO deve excluir a OS (preservação do histórico contratual).
    - A exclusão de uma OS (se permitida) DEVE cancelar a Pendência associada.
    - Pendências do tipo `MANUAL` não possuem vínculo com tabela de OS.
