const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando o ambiente HMS...\n');

// Instalar dependências
console.log('\n📦 Instalando dependências...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas com sucesso!');
} catch (error) {
  console.log('❌ Erro ao instalar dependências:', error.message);
  process.exit(1);
}

// Verificar se o PostgreSQL está rodando
console.log('\n🔍 Verificando conexão com PostgreSQL...');
try {
  execSync('psql -U postgres -h localhost -p 5432 -c "SELECT 1;"', { stdio: 'pipe' });
  console.log('✅ PostgreSQL está rodando!');
} catch (error) {
  console.log('❌ PostgreSQL não está rodando ou não está configurado corretamente.');
  console.log('📋 Por favor, siga as instruções no arquivo setup.md');
  console.log('🔗 Ou instale o PostgreSQL: https://www.postgresql.org/download/windows/');
  process.exit(1);
}

// Criar banco de dados se não existir
console.log('\n🗄️ Verificando banco de dados...');
try {
  execSync('psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE hmsdb;"', { stdio: 'pipe' });
  console.log('✅ Banco de dados hmsdb criado!');
} catch (error) {
  console.log('ℹ️ Banco de dados hmsdb já existe ou erro na criação.');
}

// Executar migrações
console.log('\n🔄 Executando migrações...');
try {
  execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
  console.log('✅ Migrações executadas com sucesso!');
} catch (error) {
  console.log('❌ Erro ao executar migrações:', error.message);
  process.exit(1);
}

// Executar seeders (opcional)
console.log('\n🌱 Executando seeders...');
try {
  execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });
  console.log('✅ Seeders executados com sucesso!');
} catch (error) {
  console.log('ℹ️ Erro ao executar seeders (opcional):', error.message);
}

console.log('\n🎉 Configuração concluída com sucesso!');
console.log('🚀 Para iniciar o servidor, execute: npm run dev');
console.log('📖 Para mais informações, consulte o arquivo setup.md');
