# 💐 FloraERP - Sistema Integrado de Gestão para Floriculturas

O **FloraERP** é uma solução ERP completa desenvolvida para otimizar as operações comerciais, logísticas e de atendimento ao cliente em floriculturas. O sistema engloba desde a frente de caixa (PDV) até a gestão avançada de estoque botânico, perdas/avarias, agendamento de entregas e pós-venda automatizado via WhatsApp.

---

## 🎯 Requisitos do Sistema

### 📌 Requisitos Funcionais (RF)
- **RF01 - Catálogo Rápido e Ficha Botânica:** Exibição visual de produtos e ficha detalhada contendo dicas de rega, iluminação, benefícios (medicinal/culinário), argumentos de venda e recomendações para venda casada.
- **RF02 - Pesquisa Global e Atalho Web:** Busca rápida no acervo do sistema (produtos, SKUs e clientes) com atalho para pesquisas externas na internet direto pelo PDV.
- **RF03 - Categorização por Mais Populares:** Destaque para sub-classes e produtos mais vendidos no caixa.
- **RF04 - Histórico de Vendas:** Consulta integrada de vendas realizadas diretamente na interface principal.
- **RF05 - Disparo de Guia de Cuidados:** Abertura do WhatsApp com o Guia de Cuidados Botânicos personalizado pronto para revisão e confirmação do atendente após a venda.
- **RF06 - Montagem de Kits/Combos:** Agrupamento de itens e insumos (ex: vaso + muda + fita) em um carrinho único.
- **RF07 - Cadastro e Gestão de Clientes:** Cadastro completo para controle de preferências e histórico de compras.
- **RF08 - Agendamento de Entregas:** Registro de agendamentos com validação cadastral (Nome, Telefone, CPF, Data e Horário da entrega).
- **RF09 - Registro Formal de Pedidos:** Processamento transacional seguro de cada pedido.
- **RF10 - Registro de Perdas no Balcão:** Módulo para dar baixa em itens danificados, murchos ou quebrados.
- **RF11 - Alertas de Estoque Baixo/Zerado:** Notificação visual em tempo real e relatórios de saldo crítico/zerado.

### 📌 Requisitos Não Funcionais (RNF)
- **RNF01 - Multiplataforma Integrada:** Compatível com computadores do caixa, tablets e smartphones no pátio da loja.
- **RNF02 - Interface Intuitiva:** Design limpo e otimizado para dias de grande movimento (ex: Dia das Mães, Dia dos Namorados).
- **RNF03 - Atalhos Principais:** Acesso direto em 1 clique para Pesquisa de Estoque, Realizar Venda e Histórico.

### 📌 Regras de Negócio (RN)
- **RN01 - Baixa Automática por Avaria:** A dedução de estoque ocorre no instante do registro da perda.
- **RN02 - Unificação de Kit em Pedido Único:** O kit personalizado gera um único lançamento financeiro no pedido.
- **RN03 - Obrigatoriedade de Dados para Agendamento:** Validação estrita de Nome, Telefone, CPF e Data/Horário para agendar entregas.

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** (Ambiente de execução)
- **Express.js** (Framework de rotas e API RESTful)
- **Prisma ORM** (Modelagem e manipulação de banco de dados)
- **PostgreSQL** (Banco de dados relacional)

### Frontend
- **HTML5 / CSS3 / JavaScript (Vanilla)**
- **Tailwind CSS** (Estilização responsiva)

### Integrações
- **API do WhatsApp (`wa.me`)** para envio de guias de cuidados botânicos.

---

## 📂 Estrutura do Projeto

```text
Floricultura/
├── client/
│   ├── pages/              # Telas do sistema (clientes, dashboard, entregas, login, pdv, perdas...)
│   ├── services/           # Serviços HTTP do frontend
│   └── styles/             # CSS por módulo
├── server/
│   ├── config/             # Configuração de ambiente e Prisma Client
│   ├── controllers/        # Controladores da API
│   ├── middlewares/        # Middlewares (auth, RBAC e erros)
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco de dados (local oficial do Prisma neste projeto)
│   │   ├── seed.js         # Seed inicial
│   │   └── migrations/     # Histórico de migrações
│   ├── routes/             # Rotas da API REST
│   ├── services/           # Regras de negócio
│   └── server.js           # Entry point do backend
├── package.json
└── README.md
```

As pastas `client/components`, `client/hooks`, `server/models` e `server/migrations` são reservadas para futuras extrações; o código atual usa páginas vanilla e `server/prisma` como fonte oficial do banco.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **PostgreSQL** em execução local ou em nuvem

### Passo a Passo

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/Federal-star/Floricultura.git
   cd Floricultura
   ```

2. **Instalar as Dependências:**
   ```bash
   npm install
   ```

3. **Gerar o Prisma Client (obrigatório após instalar dependências):**
   ```bash
   npm run prisma:generate
   ```

4. **Configurar as Variáveis de Ambiente (`.env`):**
   Crie um arquivo `.env` na raiz do projeto contendo:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/flora_erp?schema=public"
   PORT=3000
   JWT_SECRET="sua_chave_secreta_aqui"
   ESTOQUE_MINIMO=5
   FRONTEND_URL=
   ADMIN_PASSWORD="defina-uma-senha-com-pelo-menos-4-caracteres"
   ```
   > Substitua `usuario` e `senha` pelas credenciais reais do seu PostgreSQL. Se estiverem incorretas, o Prisma retornará erro **P1000 (Authentication failed)**.

5. **Executar as Migrations do Banco:**
   ```bash
   npm run migrate:dev
   ```

6. **(Opcional) Executar o Seed para Dados Iniciais:**
   ```bash
   npm run seed
   ```

7. **Iniciar o Servidor em Modo de Desenvolvimento:**
   ```bash
   npm run dev
   ```

8. **Acessar a Aplicação:**
   Abra o navegador e acesse: `http://localhost:3000/client/pages/pdv/index.html`

---

## 🧯 Solução de Problemas Comuns

### Erro: `Could not find Prisma Schema`
Esse projeto usa o schema em `server/prisma/schema.prisma` (não em `prisma/schema.prisma`).

Use os scripts do projeto:

```bash
npm run prisma:generate
npm run migrate:dev
```

### Erro: `@prisma/client did not initialize yet`
Gere o client antes de iniciar o servidor:

```bash
npm run prisma:generate
```

### Erro Prisma `P1000: Authentication failed`
Revise o valor de `DATABASE_URL` no `.env` e valide usuário/senha/host/porta do PostgreSQL.

### Seed e segurança

O seed exige `ADMIN_PASSWORD` com pelo menos 4 caracteres e não possui uma senha
padrão embutida no código:

```bash
ADMIN_PASSWORD="sua-senha-segura" npm run seed
```

O login aceita no máximo 10 tentativas por IP a cada 15 minutos. O CORS fica
desabilitado por padrão, pois o frontend é servido pelo mesmo domínio; para um
frontend hospedado separadamente, defina `FRONTEND_URL` com a origem permitida.

### Deploy na Vercel

O projeto expõe o Express por meio de `api/index.js`; localmente, `npm run dev`
continua iniciando o servidor HTTP na porta configurada. Na Vercel, configure estas
variáveis no ambiente de produção:

As páginas em `client/` são arquivos estáticos servidos diretamente pela Vercel.
O `api/index.js` atende somente as requisições em `/api/*`; por isso, não deve
haver um rewrite global de `/(.*)` para `/api`, pois ele captura as páginas do
frontend e faz o Express responder `Recurso não encontrado`.

A rota `/` abre a central do projeto em `client/index.html`, com atalhos para o
login, o PDV, a API e o health check do backend.

- `DATABASE_URL`: conexão pooler usada pelas requisições.
- `DIRECT_URL`: conexão direta usada pelo Prisma para migrações.
- `JWT_SECRET`: chave longa e privada usada para assinar os tokens.

Depois de configurar as variáveis, faça um novo deploy. As tabelas do banco de
produção devem ser criadas separadamente, a partir de uma máquina com as mesmas
variáveis configuradas:

```bash
npm run migrate:deploy
npm run seed
```

Não use `migrate:dev` contra o banco de produção.

---

## 📅 Histórico de Entregas por Sprints

### 🟢 Sprint 1: Fundação & Core Operacional
- Autenticação e permissões de usuários.
- Catálogo de Produtos e Montagem de Kits em Pedido Único (**RF06 / RN02**).
- PDV com aplicação de descontos, troco e múltiplos pagamentos.
- Módulo de Registro de Perdas com Baixa Automática no Estoque (**RF10 / RN01**).
- Cadastro Unificado de Clientes (**CAIOX-62 / RF07**).

### 🟢 Sprint 2: Gestão Avançada & Pós-venda
- **CAIOX-95:** Vínculo de cliente ao pedido no PDV e emissão de comprovante/recibo.
- **CAIOX-96:** Agendamento e gestão de entregas com validação estrita (**RF08 / RN03**).
- **CAIOX-97:** Ficha Botânica Expandida e Venda Casada (**RF01 / RF03**).
- **CAIOX-98:** Guia de Cuidados via WhatsApp pós-venda, aberto para confirmação do atendente (**RF05**).
- **CAIOX-99:** Pesquisa Global, busca web e notificações de estoque zerado/baixo (**RF02 / RF11**).

---

## 📝 Licença

Este projeto foi desenvolvido como ERP acadêmico/profissional para a disciplina de Engenharia de Software e Gestão Ágil.