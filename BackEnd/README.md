# HMS Backend - Hair Management System

## 📋 Visão Geral

Este é o backend do sistema de gerenciamento de salão de beleza (HMS), implementado com Node.js, Express e Sequelize. O projeto foi completamente refatorado seguindo padrões de mercado e boas práticas.

## 🚀 Melhorias Implementadas

### 1. Estrutura de Pastas Reorganizada

```
src/
├── controllers/     # Controladores da aplicação
├── models/         # Modelos do Sequelize
├── repositories/   # Camada de acesso a dados
├── routes/         # Definição das rotas
├── middlewares/    # Middlewares customizados
├── utils/          # Utilitários e helpers
└── config/         # Configurações da aplicação
```

### 2. Middleware Global de Tratamento de Erros

- Implementado middleware `errorHandler.js` que captura e trata todos os erros da aplicação
- Tratamento específico para diferentes tipos de erro (Sequelize, JWT, etc.)
- Respostas padronizadas para erros

### 3. Status Codes HTTP Padronizados

- **200**: Sucesso (GET, PUT, DELETE)
- **201**: Criação bem-sucedida (POST)
- **400**: Erro de validação
- **401**: Não autorizado
- **403**: Proibido
- **404**: Não encontrado
- **500**: Erro interno do servidor

### 4. Validação de Dados

- Implementado `express-validator` para validação de entrada
- Middleware `validation.js` com regras de validação reutilizáveis
- Validação automática em todas as rotas que recebem dados

### 5. Formato de Resposta Padronizado

Todas as respostas seguem o formato:
```json
{
  "success": true/false,
  "message": "Mensagem descritiva",
  "data": {}, // Dados da resposta (quando aplicável)
  "error": {} // Detalhes do erro (apenas em desenvolvimento)
}
```

### 6. Nomenclatura Padronizada

- **Arquivos**: camelCase (ex: `accountController.js`)
- **Classes**: PascalCase (ex: `AccountController`)
- **Funções**: camelCase (ex: `createAccount`)
- **Variáveis**: camelCase (ex: `userData`)

### 7. Autenticação e Autorização

- Implementado JWT (JSON Web Tokens)
- Middleware `auth.js` com funções de autenticação
- Suporte a roles e permissões
- Tokens com expiração configurável

### 8. Configurações Sensíveis

- Uso de variáveis de ambiente com `dotenv`
- Arquivo `.env.example` para documentação
- Configurações separadas por ambiente (dev, test, prod)

### 9. Documentação da API

- Swagger/OpenAPI 3.0 implementado
- Documentação automática das rotas
- Interface interativa disponível em `/api-docs`

### 10. Testes Automatizados

- Jest configurado para testes unitários e de integração
- Supertest para testes de API
- Cobertura de código configurada
- Exemplos de testes incluídos

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Sequelize** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **express-validator** - Validação de dados
- **helmet** - Segurança
- **morgan** - Logging
- **rate-limiter** - Limitação de taxa

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js (versão 14 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

### Configuração Rápida

1. **Clone o repositório e entre na pasta BackEnd:**
   ```bash
   cd BackEnd
   ```

2. **Execute o script de setup automatizado:**
   ```bash
   npm run setup
   ```

3. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

### Configuração Manual

Se preferir configurar manualmente, siga as instruções no arquivo `setup.md`.

### Variáveis de Ambiente

O arquivo `.env` deve conter as seguintes variáveis:

```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=hmsdb
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
NODE_ENV=development
```
- **Swagger** - Documentação da API
- **Jest** - Testes
- **Supertest** - Testes de API

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd BackEnd
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

4. **Configure o banco de dados**
```bash
# Certifique-se de que o PostgreSQL está rodando
# Configure as credenciais no arquivo .env
```

5. **Execute as migrações**
```bash
npx sequelize-cli db:migrate
```

6. **Execute os seeders (opcional)**
```bash
npx sequelize-cli db:seed:all
```

## 🚀 Executando o Projeto

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

### Testes
```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:
- **Swagger UI**: `http://localhost:3001/api-docs`
- **Health Check**: `http://localhost:3001/health`

## 🔐 Autenticação

### Registro de Usuário
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "cpf": "12345678901"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "senha123"
}
```

### Usando o Token
```bash
GET /api/accounts
Authorization: Bearer <seu-token-jwt>
```

## 🧪 Testes

### Estrutura de Testes
```
src/tests/
├── setup.js           # Configuração dos testes
├── auth.test.js       # Testes de autenticação
└── __mocks__/         # Mocks para testes
```

### Executando Testes Específicos
```bash
# Testes de autenticação
npm test -- auth.test.js

# Testes com verbose
npm test -- --verbose
```

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente (.env)
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hmsdb
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📁 Estrutura de Arquivos

```
BackEnd/
├── src/
│   ├── controllers/
│   │   ├── accountController.js
│   │   └── authController.js
│   ├── models/
│   │   ├── account.js
│   │   ├── email.js
│   │   └── ...
│   ├── repositories/
│   │   ├── account.repository.js
│   │   ├── email.repository.js
│   │   └── ...
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── accountRoutes.js
│   │   └── ...
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── utils/
│   │   └── responseHandler.js
│   ├── config/
│   │   └── database.js
│   └── tests/
│       ├── setup.js
│       └── auth.test.js
├── server.js
├── package.json
├── jest.config.js
└── README.md
```

## 🔒 Segurança

- **Helmet**: Headers de segurança
- **Rate Limiting**: Proteção contra ataques de força bruta
- **CORS**: Configuração de origens permitidas
- **JWT**: Autenticação stateless
- **bcrypt**: Hash seguro de senhas
- **Validação**: Sanitização de entrada

## 📊 Monitoramento

- **Morgan**: Logging de requisições HTTP
- **Health Check**: Endpoint para verificação de status
- **Error Handling**: Logging centralizado de erros

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Thiago de Freitas**
- GitHub: [@ThiagoFreitasFreelancer](https://github.com/ThiagoFreitasFreelancer)

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas, por favor abra uma issue no repositório.
