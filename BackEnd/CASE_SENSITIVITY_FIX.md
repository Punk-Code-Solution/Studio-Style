# Correção de Case Sensitivity - Nomenclatura de Pastas

## Problema Identificado

O Git está rastreando arquivos com nomenclatura em MAIÚSCULAS (`src/Database/`, `src/Routes/`), mas:
- As pastas no sistema de arquivos Windows estão em minúsculas (`src/database/`, `src/routes/`)
- No Windows, `core.ignorecase = true` faz o Git tratar como iguais
- No Linux/Vercel (case-sensitive), isso causa erro: "Cannot find module"

## Configurações Encontradas

### Git Configuration
- `core.ignorecase = true` (padrão no Windows)

### Arquivos com Nomenclatura Incorreta no Git
O Git está rastreando:
- `src/Database/` (com D maiúsculo) - mas pasta real é `src/database/`
- `src/Routes/` (com R maiúsculo) - mas pasta real é `src/routes/`

## Correções Aplicadas

### 1. Arquivo `server.js`
- ✅ Corrigido: `require('./src/Database/models')` → `require('./src/database/models')`
- ✅ Corrigido: `require('./src/Routes/...')` → `require('./src/routes/...')`

### 2. Arquivo `.vercelignore`
- ✅ Corrigido: `src/Database/migrations/` → `src/database/migrations/`
- ✅ Corrigido: `src/Database/seeders/` → `src/database/seeders/`

## Ação Necessária

Para corrigir completamente o problema no repositório Git, você precisa renomear os arquivos no Git:

```bash
# Renomear Database para database
git mv src/Database src/database-temp
git mv src/database-temp src/database

# Renomear Routes para routes
git mv src/Routes src/routes-temp
git mv src/routes-temp src/routes

# Commit as mudanças
git add -A
git commit -m "fix: corrigir case sensitivity de pastas Database e Routes"
```

## Verificação

Após as correções, o Git deve mostrar:
```bash
git ls-files | grep -i "database\|routes"
```

Todos os caminhos devem estar em minúsculas.

## Observação

⚠️ **IMPORTANTE**: No Windows, o sistema de arquivos não diferencia maiúsculas/minúsculas, mas o Git pode rastrear com case diferente. Em ambientes Linux (Vercel, produção), isso causa erros de módulo não encontrado.

