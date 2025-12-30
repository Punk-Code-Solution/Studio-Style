const fs = require('fs');
const path = require('path');

const browserDir = path.join('dist', 'estudio_style', 'browser');
const src = path.join(browserDir, 'index.csr.html');
const dest = path.join(browserDir, 'index.html');

console.log('🔧 [BUILD] Verificando estrutura de build...');
console.log('🔧 [BUILD] Diretório browser:', browserDir);

if (!fs.existsSync(browserDir)) {
  console.error('❌ [BUILD] Diretório browser não encontrado:', browserDir);
  process.exit(1);
}

const files = fs.readdirSync(browserDir);
console.log('📁 [BUILD] Arquivos encontrados:', files);

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✅ [BUILD] index.html criado com sucesso em', dest);
  
  // Verificar se o arquivo foi criado
  if (fs.existsSync(dest)) {
    console.log('✅ [BUILD] index.html confirmado no filesystem');
  } else {
    console.error('❌ [BUILD] index.html não foi criado corretamente');
    process.exit(1);
  }
} else {
  console.error('❌ [BUILD] index.csr.html não encontrado em', src);
  console.log('📁 [BUILD] Arquivos no diretório:', files);
  
  // Tentar criar um index.html básico se não existir
  if (!fs.existsSync(dest)) {
    console.log('⚠️ [BUILD] Tentando criar index.html básico...');
    const basicHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Studio & Style</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
  <script>console.error('❌ Build incompleto - index.csr.html não encontrado');</script>
</body>
</html>`;
    fs.writeFileSync(dest, basicHtml);
    console.log('⚠️ [BUILD] index.html básico criado (build pode estar incompleto)');
  }
  process.exit(1);
}

