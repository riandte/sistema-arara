# ARARA - Gestão de Chamados Internos

Sistema web moderno e integrado para gestão de chamados internos, desenvolvido sob medida para a **ARARA**. O sistema foca em eficiência, usabilidade e design moderno, integrando-se diretamente ao ERP Legado.

## 🚀 Funcionalidades

O sistema é composto por módulos integrados para otimizar o fluxo de trabalho:

### 📋 Gestão de Contratos (Novo)
Módulo completo para visualização e acompanhamento de contratos de locação.
- **Listagem Geral**: Visualização de todos os contratos com indicadores visuais de status (Ativo/Vigente).
- **Filtros Inteligentes**: Filtragem rápida por status (Ativos/Todos) e busca textual por número, cliente ou documento.
- **Detalhamento Completo**: Tela de detalhes exibindo:
  - Dados do cliente e períodos de vigência.
  - Valores financeiros (Total, Faturamento).
  - Endereço de entrega e obra.
  - **Itens do Contrato**: Lista detalhada de equipamentos, quantidades e valores.
  - Histórico de eventos e aditivos.

### 🛠️ Ordens de Serviço (OS)
Ferramenta para abertura e gestão de ordens de serviço.
- **Criação de OS**: Formulário intuitivo para abertura de novas ordens.
- **Vínculo com Contratos**: Seleção de contratos ativos diretamente na abertura da OS.
- **Integração de Clientes**: Busca automática de clientes via CPF/CNPJ (integrado à base de dados legada).
- **Numeração Personalizada**: Controle sequencial de OS por contrato (ex: 1234/1, 1234/2).
- **Geração de Documentos**: Visualização e impressão automática da OS em formato PDF.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído com as tecnologias mais recentes do mercado:

- **[Next.js 16](https://nextjs.org/)**: Framework React para produção, garantindo performance e SEO.
- **[Tailwind CSS 4](https://tailwindcss.com/)**: Estilização utilitária avançada para um design moderno e customizável.
- **[TypeScript](https://www.typescriptlang.org/)**: Superset JavaScript para maior segurança e manutenibilidade do código.
- **[Lucide React](https://lucide.dev/)**: Biblioteca de ícones moderna e leve.
- **Axios / Fetch API**: Para comunicação eficiente com APIs externas (Legado).

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (versão 18 ou superior)
- Gerenciador de pacotes (npm, yarn ou pnpm)

### Passo a passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/arara.git
   cd arara
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env.local` na raiz do projeto e configure as credenciais de acesso à API:

   ```env
   LOCAPP_BASE_URL=http://homolog.locapp.com.br/
   LOCAPP_CNPJ=SEU_CNPJ
   LOCAPP_SECRET=SEU_TOKEN_SECRET
   API_SECRET_KEY=sua-chave-interna-segura
   ```

4. **Execute o projeto**
   ```bash
   npm run dev
   ```
   O sistema estará acessível em `http://localhost:3000`.

## 👨‍💻 Desenvolvedor

Projeto desenvolvido por **Rian Duarte**.

[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/riandte/)

---
&copy; 2025 ARARA. Todos os direitos reservados.
