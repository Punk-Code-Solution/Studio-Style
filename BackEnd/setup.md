# Configuração do Ambiente sem Docker

## 1. Instalar PostgreSQL

### Windows:
1. Baixe o PostgreSQL do site oficial: https://www.postgresql.org/download/windows/
2. Durante a instalação:
   - Usuário: `postgres`
   - Senha: `postgres`
   - Porta: `5432`
   - Database: `hmsdb`

### Ou usando Chocolatey:
```powershell
choco install postgresql
```

## 2. Configurar o Banco de Dados

Após instalar o PostgreSQL, execute os seguintes comandos:

```sql
-- Conectar ao PostgreSQL
psql -U postgres

-- Criar o banco de dados
CREATE DATABASE hmsdb;

-- Verificar se foi criado
\l

-- Sair
\q
```

## 3. Instalar Dependências

```bash
npm install
```

## 4. Executar Migrações

```bash
npx sequelize-cli db:migrate
```

## 5. Executar Seeders (opcional)

```bash
npx sequelize-cli db:seed:all
```

## 6. Iniciar o Servidor

```bash
npm run dev
```

## Configurações do .env

O arquivo `.env` já foi criado com as seguintes configurações:

```
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=hmsdb
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

## Solução de Problemas

### Erro de conexão com banco:
1. Verifique se o PostgreSQL está rodando
2. Verifique se as credenciais estão corretas
3. Verifique se o banco `hmsdb` existe

### Erro de autenticação:
1. Verifique se o usuário `postgres` existe
2. Verifique se a senha está correta
3. Verifique se o arquivo `pg_hba.conf` permite conexões locais
