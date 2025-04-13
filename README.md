# HoroscopoZap - Análise Inteligente de Chats do WhatsApp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Descrição

HoroscopoZap é uma aplicação web robusta e moderna que permite aos usuários analisar seus chats do WhatsApp de forma detalhada e inteligente. Utilizando técnicas avançadas de Processamento de Linguagem Natural (NLP) e Inteligência Artificial (IA) com o Google Gemini, a aplicação extrai insights valiosos e apresenta visualizações ricas sobre os padrões de comunicação. Oferece também funcionalidades premium acessíveis através de pagamento integrado via Mercado Pago.

## Funcionalidades Principais

-   **Análise Detalhada de Chats:** Transforma dados brutos de chats do WhatsApp em informações estruturadas e insights acionáveis.
-   **NLP e IA Aplicadas:** Utiliza NLP para análise de sentimentos, identificação de padrões e extração de entidades. A IA do Google Gemini oferece análises contextuais avançadas e recursos premium.
-   **Visualizações Interativas:** Apresenta resultados através de gráficos dinâmicos, nuvens de emojis, heatmaps de atividade e outros componentes visuais intuitivos.
-   **Funcionalidades Premium:** Recursos avançados como análises preditivas, poemas personalizados, análise de estilo de escrita e identificação de "red flags" e "green flags".
-   **Pagamento Integrado:** Sistema de pagamento via Mercado Pago (Cartão de Crédito e Pix) para acesso às funcionalidades premium.
-   **Backend Serverless:** Arquitetura backend com Firebase Functions para escalabilidade, segurança e baixo custo.
-   **Persistência de Dados:** Utilização do Firestore para armazenamento eficiente e seguro dos dados de análise e informações de usuários premium.

## Tecnologias Utilizadas

**Frontend:**

-   **Framework/Library:** React 18
-   **Linguagem:** TypeScript
-   **Build Tool:** Vite
-   **Estilização:** Tailwind CSS
-   **Componentes UI:** Shadcn/UI (baseado em Radix UI)
-   **Roteamento:** React Router DOM v6
-   **Gerenciamento de Estado:** React Context API (`ChatAnalysisContext`)
-   **Visualização de Dados:** Recharts
-   **Animações:** Framer Motion
-   **Formulários:** React Hook Form com Zod para validação
-   **Notificações:** Sonner
-   **Pagamentos:** Mercado Pago SDK (Frontend)
-   **Outros:** date-fns, lucide-react, html2canvas, class-variance-authority, clsx, tailwind-merge

**Backend:**

-   **Plataforma:** Firebase Functions (Node.js v20)
-   **Linguagem:** TypeScript
-   **Banco de Dados:** Firestore (NoSQL)
-   **Autenticação/Infra:** Firebase Admin SDK
-   **IA:** Google Gemini API (`@google/generative-ai`)
-   **Pagamentos:** Mercado Pago API (via Firebase Functions)

**Infraestrutura:**

-   **Hosting:** Firebase Hosting
-   **Banco de Dados:** Firestore
-   **Backend:** Firebase Functions

## Arquitetura

O sistema segue uma arquitetura moderna baseada em React para o frontend e Firebase Functions para o backend serverless. O Firestore é utilizado como banco de dados NoSQL. A integração com serviços externos como Google Gemini (para IA) e Mercado Pago (para pagamentos) é feita principalmente através das Firebase Functions.

Para uma visão detalhada da arquitetura, fluxos de usuário, componentes e segurança, consulte o documento:
[**docs/ARQUITETURA_SISTEMA.md**](./docs/ARQUITETURA_SISTEMA.md)

## Configuração e Instalação

**Pré-requisitos:**

-   Node.js (versão 20 ou superior recomendada, conforme `functions/package.json`)
-   npm (geralmente vem com Node.js) ou Bun (opcional, `bun.lockb` presente)
-   Firebase CLI: `npm install -g firebase-tools`
-   Conta Firebase e Projeto Firebase criado.
-   Conta Mercado Pago (para obter credenciais de API).
-   Chave de API do Google Gemini.

**Passos:**

1.  **Clonar o Repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd HoroscopoZap
    ```

2.  **Instalar Dependências do Frontend:**
    ```bash
    npm install
    # ou
    # bun install
    ```

3.  **Instalar Dependências do Backend:**
    ```bash
    cd functions
    npm install
    # ou
    # bun install
    cd ..
    ```

4.  **Login no Firebase:**
    ```bash
    firebase login
    ```

5.  **Associar Projeto Firebase:**
    ```bash
    firebase use --add
    ```
    Selecione o projeto Firebase que você criou.

6.  **Configurar Firebase no Frontend:**
    -   Copie as configurações do seu projeto Firebase (Web app) do console do Firebase.
    -   Atualize o arquivo `src/firebaseConfig.ts` com suas credenciais.

7.  **Configurar Variáveis de Ambiente do Backend (Firebase Functions):**
    -   Você precisará configurar as credenciais da API do Mercado Pago (Access Token, Public Key, Webhook Secret) e a chave da API do Google Gemini.
    -   Use o comando `firebase functions:config:set` para configurar essas variáveis de forma segura. Exemplo:
        ```bash
        firebase functions:config:set mercadopago.accesstoken="SUA_ACCESS_TOKEN" mercadopago.publickey="SUA_PUBLIC_KEY" mercadopago.webhooksecret="SEU_WEBHOOK_SECRET" gemini.apikey="SUA_API_KEY"
        ```
    -   **Importante:** Substitua os valores de exemplo pelas suas credenciais reais.

8.  **Configurar Webhook do Mercado Pago:**
    -   No painel do Mercado Pago, configure um Webhook para notificações de pagamento Pix apontando para a URL da sua função `handlePixWebhook` (você obterá a URL após o deploy).
    -   Certifique-se de que o `MERCADO_PAGO_WEBHOOK_SECRET` configurado nas Firebase Functions corresponda ao segredo configurado no Mercado Pago.

## Executando o Projeto

1.  **Iniciar o Servidor de Desenvolvimento do Frontend:**
    Na pasta raiz do projeto:
    ```bash
    npm run dev
    ```
    Isso iniciará o servidor Vite em `http://localhost:5173` (ou outra porta disponível).

2.  **Emular as Funções do Firebase Localmente:**
    Em outro terminal, na pasta raiz do projeto:
    ```bash
    npm run --prefix functions build # Compila as funções TS para JS (necessário antes de emular)
    firebase emulators:start --only functions,firestore
    ```
    Isso iniciará os emuladores do Firebase Functions e Firestore. O frontend (rodando em `dev`) pode ser configurado para usar esses emuladores durante o desenvolvimento (pode exigir ajustes em `firebaseConfig.ts` para apontar para os emuladores).

3.  **Acessar a Aplicação:**
    Abra seu navegador e acesse `http://localhost:5173` (ou a porta indicada pelo Vite).

## Build

Para criar uma versão otimizada para produção do frontend:

```bash
npm run build
```

Os arquivos de build serão gerados na pasta `dist`.

## Deploy

1.  **Deploy do Frontend (Firebase Hosting):**
    Certifique-se de que a configuração do `firebase.json` aponta para a pasta `dist` (ou a pasta de build correta).
    ```bash
    npm run build # Garanta que o build mais recente foi feito
    firebase deploy --only hosting
    ```

2.  **Deploy do Backend (Firebase Functions):**
    ```bash
    npm run --prefix functions build # Garanta que as funções foram compiladas
    firebase deploy --only functions
    ```

## Segurança

A aplicação implementa várias medidas de segurança:

-   **Frontend:** Tokenização segura de cartões (Mercado Pago SDK), HTTPS, prevenção básica de XSS/CSRF (via React).
-   **Backend:** Armazenamento seguro de credenciais (Firebase Environment Variables), validação de Webhooks (Mercado Pago), lógica de atualização de status premium centralizada no backend, acesso mínimo privilegiado para funções.
-   **Banco de Dados:** Regras de segurança do Firestore, criptografia em repouso e trânsito.

Consulte a seção "Segurança em Detalhe" em [docs/ARQUITETURA_SISTEMA.md](./docs/ARQUITETURA_SISTEMA.md) para mais informações.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes 
