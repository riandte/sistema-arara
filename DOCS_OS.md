# Documentação do Módulo de Ordens de Serviço (OS)

Este documento detalha a implementação técnica e funcional do módulo de Ordens de Serviço (OS) do sistema ARARA.

## 1. Visão Geral

O módulo de OS é responsável pelo gerenciamento do ciclo de vida das ordens de serviço, desde a criação até a visualização e impressão. Ele foi desenvolvido utilizando **Next.js 16**, **Tailwind CSS 4** e **TypeScript**, focando em uma experiência de usuário moderna e responsiva.

## 2. Estrutura de Arquivos

A estrutura principal do módulo encontra-se em `src/app/os`:

- `src/app/os/page.tsx`: Página de listagem de OS (Dashboard do módulo).
- `src/app/os/nova/page.tsx`: Página de criação de nova OS (Formulário).
- `src/app/api/service-orders/route.ts`: API Route para processamento backend.
- `src/components/form/*`: Componentes reutilizáveis do formulário.

## 3. Funcionalidades Detalhadas

### 3.1. Listagem de OS (`/os`)
*Arquivo: `src/app/os/page.tsx`*

Atualmente, esta página serve como o ponto de entrada do módulo.
- **Header**: Navegação e botão de ação rápida "Nova OS".
- **Busca e Filtros**: Interface preparada para busca textual e filtros avançados (implementação visual pronta).
- **Estado Vazio**: Exibe uma mensagem amigável e botão de ação quando não há registros.

### 3.2. Criação de OS (`/os/nova`)
*Arquivo: `src/app/os/nova/page.tsx`*

Esta é a funcionalidade central implementada. O formulário é dividido em seções lógicas:

#### Seções do Formulário:
1.  **Dados do Cliente**:
    - Integração com `InputCliente` para busca automática via API externa (CPF/CNPJ).
    - Campos manuais: Nome, Telefone, Email.
2.  **Endereço**:
    - Componente `InputEndereco` para preenchimento padronizado.
3.  **Detalhes do Serviço**:
    - `SelectPrioridade`: Baixa, Média, Alta (com codificação de cores).
    - Data Prevista: Input nativo de data com estilo customizado.
    - `TextAreaServico`: Descrição detalhada do serviço.
    - Observações Adicionais.

#### Fluxo de Criação:
1.  Usuário preenche o formulário.
2.  Ao submeter, os dados são enviados para `/api/service-orders`.
3.  **Sucesso**: Um modal de confirmação é exibido (sem recarregar a página).
4.  **Ações Pós-Criação**:
    - **Imprimir PDF**: Gera um documento formatado via `window.print()` e `window.open()`.
    - **Editar**: Permite ajustes imediatos (mock).
    - **Fechar**: Retorna ao estado inicial ou redireciona.

### 3.3. Integração com API (`/api/service-orders`)
*Arquivo: `src/app/api/service-orders/route.ts`*

A rota API atua como um *proxy* ou controlador:
- **Modo Real**: Se as variáveis de ambiente (`LOCAPP_BASE_URL`, etc.) estiverem configuradas, ela repassa a requisição para a API externa do ERP Legado.
- **Modo Mock (Desenvolvimento)**: Se não houver configuração externa, ela armazena os dados em memória (array temporário) para permitir testes de interface sem backend real.

## 4. Componentes Reutilizáveis

Localizados em `src/components/form/`, padronizam a interface:

- **`InputCliente`**: Campo inteligente que busca dados de cliente ao digitar CPF/CNPJ.
- **`InputEndereco`**: Formatação e validação de endereço.
- **`SelectPrioridade`**: Dropdown estilizado para seleção de nível de urgência.
- **`TextAreaServico`**: Área de texto otimizada para descrições longas.

## 5. Estilização e UI/UX

O design segue a identidade visual "Dark Modern" do sistema:
- **Glassmorphism**: Uso de `bg-white/5` e `backdrop-blur` para painéis e modais.
- **Gradientes**: Fundo global e detalhes em botões.
- **Ícones**: Biblioteca `lucide-react` para iconografia consistente.
- **Feedback Visual**:
    - Estados de *loading* nos botões.
    - Mensagens de erro/sucesso com cores semânticas (Verde/Vermelho).
    - Animações suaves (`transition-all`, `animate-in`) nas interações.

## 6. Geração de PDF

A funcionalidade de impressão é executada inteiramente no cliente (Client-side):
- Cria uma nova janela do navegador.
- Injeta HTML/CSS específico para impressão (fundo branco, tipografia serifada/simples).
- Aciona o diálogo de impressão do sistema operacional.
- Garante que documentos físicos tenham layout profissional, independente do tema escuro da aplicação.
