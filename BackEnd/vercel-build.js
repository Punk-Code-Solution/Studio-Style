#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando build para Vercel...');

try {
  // Verificar se estamos no ambiente do Vercel
  if (process.env.VERCEL) {
    console.log('📦 Instalando dependências nativas...');
    
    // Instalar dependências nativas necessárias
    execSync('npm install pg@^8.16.3 --save', { stdio: 'inherit' });
    execSync('npm install pg-hstore@^2.3.4 --save', { stdio: 'inherit' });
    
    console.log('✅ Dependências instaladas com sucesso!');
  }
  
  console.log('🚀 Build concluído!');
} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}
