# 💇 Studio & Style

> Sistema completo de gerenciamento para salões de beleza

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-19.2.0-red.svg)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Deploy](#-deploy)
- [Documentação](#-documentação)
- [Contribuindo](#-contribuindo)
- [Segurança](#-segurança)
- [Licença](#-licença)
- [Contato](#-contato)

## 🎯 Sobre o Projeto

O **Studio & Style** é uma plataforma web completa e moderna desenvolvida para gerenciar salões de beleza de forma eficiente e profissional. O sistema oferece uma solução integrada que abrange desde o agendamento de serviços até o controle financeiro detalhado.

### Objetivo

Simplificar e automatizar as operações diárias de salões de beleza, proporcionando:
- **Gestão Centralizada**: Todas as operações em um único sistema
- **Interface Intuitiva**: Fácil de usar para todos os níveis de usuários
- **Análise de Dados**: Relatórios e dashboards para tomada de decisão
- **Escalabilidade**: Suporta desde pequenos até grandes estabelecimentos

## ✨ Funcionalidades

### 📅 Agendamento de Serviços
- Sistema completo de agendamento com calendário visual
- Seleção de profissional e serviço
- Gestão de disponibilidade e horários
- Notificações automáticas
- Histórico completo de agendamentos

### 👥 Gestão de Clientes
- Cadastro completo de clientes
- Histórico de serviços realizados
- Preferências e observações personalizadas
- Controle de frequência
- Comunicação integrada

### 💰 Controle Financeiro
- Dashboard financeiro completo
- Controle de entradas e saídas
- Cálculo automático de comissões
- Relatórios financeiros detalhados
- DRE (Demonstrativo de Resultado do Exercício)
- Análise de lucratividade

### 👨‍💼 Gestão de Funcionários
- Cadastro de profissionais
- Controle de comissões
- Histórico de serviços
- Relatórios de desempenho
- Gestão de permissões e roles

### 📦 Gestão de Produtos e Serviços
- Cadastro de produtos e serviços
- Controle de estoque
- Categorização de tipos de cabelo
- Preços e comissões configuráveis

### 📊 Relatórios e Analytics
- Dashboard executivo
- Gráficos e visualizações interativas
- Relatórios personalizáveis
- Exportação de dados
- Análise de tendências

## 🛠️ Tecnologias

### Frontend
- **Angular 19.2** - Framework frontend
- **TypeScript** - Linguagem de programação
- **RxJS** - Programação reativa
- **Chart.js** - Gráficos e visualizações
- **PrimeNG** - Componentes UI
- **SCSS** - Estilização
- **Angular SSR** - Server-Side Rendering

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação e autorização
- **Socket.io** - Comunicação em tempo real
- **Swagger** - Documentação da API

### DevOps & Ferramentas
- **Vercel** - Deploy frontend
- **Git** - Controle de versão
- **Jest** - Testes unitários
- **ESLint** - Linting de código
- **Prettier** - Formatação de código

## 📁 Estrutura do Projeto

```
Studio-Style/
├── FrontEnd/                 # Aplicação Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/         # Serviços core, guards, interceptors
│   │   │   ├── features/     # Módulos de funcionalidades
│   │   │   ├── layout/       # Componentes de layout
│   │   │   └── shared/       # Componentes compartilhados
│   │   ├── assets/           # Arquivos estáticos
│   │   └── environments/      # Configurações de ambiente
│   ├── public/               # Arquivos públicos
│   └── dist/                 # Build de produção
│
├── BackEnd/                  # API Node.js/Express
│   ├── src/
│   │   ├── controllers/      # Controladores da aplicação
│   │   ├── models/          # Modelos Sequelize
│   │   ├── repositories/     # Camada de acesso a dados
│   │   ├── routes/          # Definição de rotas
│   │   ├── middlewares/     # Middlewares customizados
│   │   ├── services/        # Lógica de negócio
│   │   ├── utils/           # Utilitários
│   │   └── Database/        # Migrações e seeders
│   └── server.js            # Ponto de entrada
│
├── README.md                # Este arquivo
├── SECURITY.md              # Política de segurança
└── LICENSE                  # Licença do projeto
```

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **PostgreSQL** (versão 12 ou superior)
- **Git**

### Verificando as Instalações

```bash
node --version   # Deve ser >= 18.0.0
npm --version    # Deve ser >= 8.0.0
psql --version   # Deve ser >= 12.0.0
git --version
```

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/Punk-Code-Solution/Studio-Style.git
cd Studio-Style
```

### 2. Instale as Dependências do Backend

```bash
cd BackEnd
npm install
```

### 3. Instale as Dependências do Frontend

```bash
cd ../FrontEnd
npm install
```

## ⚙️ Configuração

### Backend

1. **Crie o arquivo `.env` na pasta `BackEnd/`:**

```bash
cd BackEnd
cp .env.example .env
```

2. **Configure as variáveis de ambiente:**

```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hmsdb
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:4200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Configure o banco de dados:**

```bash
# Crie o banco de dados
createdb hmsdb

# Execute as migrações
npx sequelize-cli db:migrate

# (Opcional) Execute os seeders
npx sequelize-cli db:seed:all
```

### Frontend

1. **Configure as variáveis de ambiente:**

Edite `FrontEnd/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api'
};
```

## 🎮 Uso

### Desenvolvimento

#### Iniciar o Backend

```bash
cd BackEnd
npm run dev
```

O servidor estará disponível em `http://localhost:3001`

#### Iniciar o Frontend

```bash
cd FrontEnd
npm start
```

A aplicação estará disponível em `http://localhost:4200`

### Produção

#### Build do Frontend

```bash
cd FrontEnd
npm run build:vercel
```

#### Iniciar o Backend em Produção

```bash
cd BackEnd
npm start
```

## 📚 Documentação

### API

A documentação completa da API está disponível via Swagger:

- **Desenvolvimento**: `http://localhost:3001/api-docs`
- **Produção**: `https://studio-style.vercel.app/api-docs`

### Frontend

- **Design System**: [Figma](https://www.figma.com/file/f820lObNmqr734b0GmzU6y/Untitled?type=design&t=RiTcnMEEAj6azPRf-6)

### Documentação Adicional

- [Backend README](BackEnd/README.md) - Documentação detalhada do backend
- [Frontend README](FrontEnd/README.md) - Documentação do frontend
- [SECURITY.md](SECURITY.md) - Política de segurança

## 🌐 Deploy

### Frontend (Vercel)

O frontend está configurado para deploy automático na Vercel:

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente
3. O deploy será automático a cada push

### Backend

O backend pode ser deployado em qualquer plataforma que suporte Node.js:

- **Vercel** (recomendado)
- **Heroku**
- **AWS**
- **DigitalOcean**
- **Railway**

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Por favor, siga estes passos:

1. **Fork o projeto**
2. **Crie uma branch para sua feature** (`git checkout -b feature/AmazingFeature`)
3. **Commit suas mudanças** (`git commit -m 'Add some AmazingFeature'`)
4. **Push para a branch** (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request**

### Padrões de Código

- Siga os padrões de código existentes
- Adicione testes para novas funcionalidades
- Atualize a documentação conforme necessário
- Mantenha commits descritivos

## 🔒 Segurança

Para reportar vulnerabilidades de segurança, consulte nosso [SECURITY.md](SECURITY.md).

**NÃO** reporte vulnerabilidades através de issues públicas do GitHub.

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## © Copyright

**Copyright © 2024 Punk Code Solution**

- **CNPJ**: 61.805.210/0001-41
- **Endereço**: Rua do Aconchego, Ilhéus - BA, CEP 45656-627

Todos os direitos reservados.

## 👥 Autores

**Thiago de Freitas**
- GitHub: [@ThiagoFreitasFreelancer](https://github.com/ThiagoFreitasFreelancer)

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/Punk-Code-Solution/Studio-Style/issues)
- **Email**: [punkcodesolution@gmail.com]

## 🙏 Agradecimentos

- Todos os contribuidores que ajudaram a melhorar este projeto
- Comunidade open source pelas ferramentas incríveis

---

**Desenvolvido com ❤️ para salões de beleza**
