# Configurações da Vercel para Angular SPA

## 📋 Configurações no arquivo `vercel.json`

O arquivo `vercel.json` já está configurado corretamente com:

```json
{
  "version": 2,
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "dist/estudio_style/browser",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://studio-style.vercel.app/api/$1"
    },
    {
      "source": "/((?!.*\\.).*)$",
      "destination": "/index.html"
    }
  ]
}
```

### Explicação das configurações:

1. **`buildCommand`**: `npm run build:vercel`
   - Este comando cria o `index.html` a partir do `index.csr.html` gerado pelo Angular 19
   - **CRÍTICO**: Não use `npm run build` sozinho, pois não cria o `index.html`

2. **`outputDirectory`**: `dist/estudio_style/browser`
   - Diretório onde os arquivos estáticos são gerados após o build

3. **`rewrites`**: 
   - `/api/(.*)` → Redireciona chamadas de API para o backend
   - `/((?!.*\\.).*)$` → Redireciona todas as rotas (sem extensão) para `/index.html`
   - Isso permite que o Angular Router funcione corretamente

## ⚙️ Configurações no Painel da Vercel

### 1. Build & Development Settings

Acesse: **Project Settings → Build & Development Settings**

**IMPORTANTE**: Se você tem `vercel.json` com `buildCommand`, essas configurações são **ignoradas**. Mas verifique:

- **Framework Preset**: Deixe em branco ou "Other" (não use "Angular" se tiver vercel.json)
- **Root Directory**: 
  - Se o projeto está na raiz do repositório: deixe vazio
  - Se está em uma subpasta (ex: `FrontEnd/`): configure como `FrontEnd`
- **Build Command**: Deve estar vazio (usa do vercel.json)
- **Output Directory**: Deve estar vazio (usa do vercel.json)
- **Install Command**: `npm install` (ou deixe vazio para usar o padrão)

### 2. Environment Variables

Acesse: **Project Settings → Environment Variables**

Certifique-se de que todas as variáveis necessárias estão configuradas:
- Variáveis de ambiente do Angular (se houver)
- URLs de API
- Tokens de autenticação (se necessário)

### 3. Deploy Settings

Acesse: **Project Settings → Deploy Settings**

- **Production Branch**: `main` (ou a branch principal do seu projeto)
- **Auto-deploy**: Habilitado (opcional)

## 🔍 Verificações Importantes

### 1. Verificar se o `index.html` está sendo criado

Após o build, verifique nos logs da Vercel se aparece:
```
✅ index.html criado com sucesso em dist/estudio_style/browser/index.html
```

### 2. Verificar estrutura do build

O build deve gerar:
```
dist/estudio_style/
  ├── browser/
  │   ├── index.html          ← DEVE EXISTIR
  │   ├── index.csr.html      ← Gerado pelo Angular
  │   ├── main-*.js
  │   ├── styles-*.css
  │   └── ...
  └── server/
      └── ...
```

### 3. Testar localmente

Antes de fazer deploy, teste localmente:
```bash
cd FrontEnd
npm run build:vercel
ls -la dist/estudio_style/browser/index.html
```

Se o arquivo existir, o deploy deve funcionar.

## 🚨 Problemas Comuns

### Erro 404 ao recarregar a página

**Causa**: `index.html` não está sendo criado

**Solução**: 
1. Certifique-se de que `buildCommand` está usando `npm run build:vercel`
2. Verifique os logs de build na Vercel
3. Verifique se o script `build:vercel` está no `package.json`

### Arquivos estáticos não carregam

**Causa**: Rewrite capturando arquivos estáticos

**Solução**: O rewrite `/((?!.*\\.).*)$` já exclui arquivos com extensão, então deve funcionar.

### Rotas não funcionam

**Causa**: Rewrite não configurado corretamente

**Solução**: Certifique-se de que o rewrite está redirecionando para `/index.html`

## ✅ Checklist Final

Antes de fazer deploy, verifique:

- [ ] `vercel.json` tem `buildCommand: "npm run build:vercel"`
- [ ] `package.json` tem o script `build:vercel`
- [ ] O script `build:vercel` cria o `index.html` corretamente
- [ ] `outputDirectory` está correto: `dist/estudio_style/browser`
- [ ] Rewrites estão configurados para redirecionar rotas para `/index.html`
- [ ] Root Directory está configurado corretamente no painel (se necessário)
- [ ] Variáveis de ambiente estão configuradas (se necessário)

