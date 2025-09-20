#!/usr/bin/env node

console.log('🔧 Configurando build para Vercel...');

try {
  // Verificar se estamos no ambiente do Vercel
  if (process.env.VERCEL) {
    console.log('📦 Configurando ambiente para PostgreSQL...');
    
    // Configurar variáveis de ambiente para PostgreSQL
    process.env.PG_CONFIG = 'true';
    process.env.PG_HOME = '/tmp';
    
    console.log('✅ Configuração concluída!');
  }
  
  console.log('🚀 Build concluído!');
} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}
