# Guia de Testes - Validação de Atualização de Contas

## 📋 Testes Criados

Foram criados testes para validar que a atualização de funcionários/pacientes não está duplicando registros relacionados.

## 🧪 Como Executar os Testes

### 1. Teste Manual de Validação

Execute o script de validação manual:

```bash
cd BackEnd
npm run test:validate-update
```

Ou diretamente:

```bash
node src/tests/validate-account-update.js
```

### 2. Testes Unitários (Jest)

Execute os testes unitários:

```bash
npm test
```

Ou com watch mode:

```bash
npm run test:watch
```

## ✅ O que os Testes Validam

### 1. **Atualização de Email**
- ✅ Atualiza email existente ao invés de criar novo
- ✅ Remove emails duplicados se houver múltiplos
- ✅ Cria novo email apenas se não existir

### 2. **Atualização de Telefone**
- ✅ Atualiza telefone existente ao invés de criar novo
- ✅ Processa formato do telefone corretamente (com/sem DDD)
- ✅ Remove telefones duplicados se houver múltiplos
- ✅ Cria novo telefone apenas se não existir

### 3. **Atualização de Endereço**
- ✅ Atualiza endereço existente ao invés de criar novo
- ✅ Preserva campos não fornecidos
- ✅ Cria novo endereço apenas se não existir

### 4. **Validação de Duplicatas**
- ✅ Permite atualizar com mesmo email (próprio registro)
- ✅ Rejeita atualização com email de outra conta
- ✅ Permite atualizar com mesmo CPF (próprio registro)
- ✅ Rejeita atualização com CPF de outra conta

### 5. **Verificação de Duplicatas no Banco**
- ✅ Verifica se há emails duplicados por conta
- ✅ Verifica se há telefones duplicados por conta
- ✅ Verifica se há endereços duplicados por conta

## 🔍 Testes Manuais Recomendados

### Teste 1: Editar Funcionário Mantendo Mesmo Email
1. Abra a lista de funcionários
2. Clique em editar um funcionário
3. Mantenha o mesmo email
4. Salve
5. **Resultado esperado**: Deve salvar sem erro e não criar email duplicado

### Teste 2: Editar Funcionário Alterando Email
1. Abra a lista de funcionários
2. Clique em editar um funcionário
3. Altere o email para um novo
4. Salve
5. **Resultado esperado**: Deve atualizar o email existente, não criar novo

### Teste 3: Editar Funcionário Alterando Telefone
1. Abra a lista de funcionários
2. Clique em editar um funcionário
3. Altere o telefone
4. Salve
5. **Resultado esperado**: Deve atualizar o telefone existente, não criar novo

### Teste 4: Editar Funcionário com Email de Outro
1. Abra a lista de funcionários
2. Clique em editar um funcionário
3. Tente usar um email que já pertence a outro funcionário
4. Salve
5. **Resultado esperado**: Deve mostrar erro "Este funcionário já existe. Por favor, use um e-mail diferente."

### Teste 5: Verificar Duplicatas no Banco
1. Execute o script de validação
2. Verifique se há duplicatas
3. **Resultado esperado**: Não deve haver duplicatas

## 📊 Verificação no Banco de Dados

Para verificar manualmente se há duplicatas, execute estas queries:

### Verificar Emails Duplicados
```sql
SELECT account_id_email, COUNT(*) as count
FROM "Emails"
GROUP BY account_id_email
HAVING COUNT(*) > 1;
```

### Verificar Telefones Duplicados
```sql
SELECT account_id_phone, COUNT(*) as count
FROM "Phones"
GROUP BY account_id_phone
HAVING COUNT(*) > 1;
```

### Verificar Endereços Duplicados
```sql
SELECT account_id_adress, COUNT(*) as count
FROM "Adresses"
GROUP BY account_id_adress
HAVING COUNT(*) > 1;
```

## 🐛 Problemas Conhecidos e Soluções

### Problema: Emails duplicados após edição
**Solução**: O código agora atualiza o email existente ao invés de criar novo.

### Problema: Telefones duplicados após edição
**Solução**: O código agora atualiza o telefone existente e remove duplicados.

### Problema: Erro ao editar mantendo mesmo email
**Solução**: A validação agora exclui o próprio registro da verificação de duplicatas.

## 📝 Checklist de Validação

Antes de considerar os testes completos, verifique:

- [ ] Teste manual de edição mantendo mesmo email passa
- [ ] Teste manual de edição alterando email passa
- [ ] Teste manual de edição alterando telefone passa
- [ ] Teste manual de edição com email duplicado rejeita corretamente
- [ ] Script de validação não encontra duplicatas
- [ ] Queries SQL não retornam duplicatas
- [ ] Frontend exibe telefone corretamente após edição
- [ ] Frontend exibe email corretamente após edição

## 🔧 Correções Implementadas

1. ✅ Email: Atualiza registro existente ao invés de criar novo
2. ✅ Telefone: Atualiza registro existente ao invés de criar novo
3. ✅ Endereço: Atualiza registro existente ao invés de criar novo
4. ✅ Validação: Exclui próprio registro da verificação de duplicatas
5. ✅ Remoção: Remove registros duplicados automaticamente
6. ✅ Relacionamentos: Todos os relacionamentos são atualizados corretamente

