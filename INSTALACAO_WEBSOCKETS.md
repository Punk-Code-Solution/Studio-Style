# Instalação e Configuração - Atualização Automática do Dashboard

## 📋 Visão Geral

Esta funcionalidade implementa atualização automática do Dashboard quando um agendamento é criado, seja via frontend ou via WhatsApp, usando WebSockets (Socket.IO).

## 🔧 Instalação das Dependências

### Backend
```bash
cd BackEnd
npm install socket.io@^4.5.4
```

### Frontend
```bash
cd FrontEnd
npm install socket.io-client@^4.5.4
```

## 📁 Arquivos Criados/Modificados

### Backend

1. **`BackEnd/src/utils/socket.io.js`** (NOVO)
   - Utilitário para gerenciar Socket.IO
   - Funções para emitir eventos de agendamentos

2. **`BackEnd/server.js`** (MODIFICADO)
   - Adicionado suporte a HTTP server para Socket.IO
   - Inicialização do Socket.IO

3. **`BackEnd/src/controllers/schedules.controller.js`** (MODIFICADO)
   - Emite evento `schedule:created` quando agendamento é criado via frontend

4. **`BackEnd/src/controllers/whatsapp.controller.js`** (MODIFICADO)
   - Emite evento `schedule:created` quando agendamento é criado via WhatsApp

5. **`BackEnd/package.json`** (MODIFICADO)
   - Adicionada dependência `socket.io`

### Frontend

1. **`FrontEnd/src/app/core/services/socket.service.ts`** (NOVO)
   - Serviço para gerenciar conexão Socket.IO
   - Observables para eventos de agendamentos

2. **`FrontEnd/src/app/features/dashboard/dashboard.component.ts`** (MODIFICADO)
   - Escuta eventos Socket.IO
   - Atualiza Dashboard automaticamente quando recebe eventos

3. **`FrontEnd/package.json`** (MODIFICADO)
   - Adicionada dependência `socket.io-client`

## 🚀 Como Funciona

### Fluxo de Atualização Automática

1. **Criação de Agendamento (Frontend ou WhatsApp)**
   - Controller cria o agendamento no banco
   - Busca o agendamento completo com relacionamentos
   - Emite evento `schedule:created` via Socket.IO

2. **Servidor Socket.IO**
   - Recebe o evento
   - Transmite para todos os clientes inscritos na sala `schedules`

3. **Dashboard (Frontend)**
   - Escuta eventos `schedule:created`
   - Verifica se o agendamento é de hoje
   - Recarrega dados automaticamente
   - Mostra notificação ao usuário

## 🔌 Eventos Socket.IO

### Eventos Emitidos pelo Servidor

- **`schedule:created`**: Quando um novo agendamento é criado
  ```javascript
  {
    schedule: { /* dados do agendamento */ },
    timestamp: "2024-12-07T19:00:00.000Z"
  }
  ```

- **`schedule:updated`**: Quando um agendamento é atualizado
  ```javascript
  {
    schedule: { /* dados do agendamento atualizado */ },
    timestamp: "2024-12-07T19:00:00.000Z"
  }
  ```

- **`schedule:deleted`**: Quando um agendamento é deletado
  ```javascript
  {
    scheduleId: "uuid-do-agendamento",
    timestamp: "2024-12-07T19:00:00.000Z"
  }
  ```

### Eventos Enviados pelo Cliente

- **`subscribe:schedules`**: Cliente se inscreve em atualizações de agendamentos
- **`unsubscribe:schedules`**: Cliente se desinscreve

## ⚙️ Configuração

### Variáveis de Ambiente (Opcional)

No backend, você pode configurar a URL do frontend:

```env
FRONTEND_URL=http://localhost:4200
```

Se não configurado, o Socket.IO aceitará conexões de qualquer origem (apenas em desenvolvimento).

### Ambiente de Produção

**Nota Importante**: WebSockets podem não funcionar em ambientes serverless como Vercel. Para produção, considere:

1. Usar um serviço de WebSocket dedicado (ex: Pusher, Ably)
2. Usar Server-Sent Events (SSE) como alternativa
3. Usar polling como fallback

## 🧪 Testando a Funcionalidade

### 1. Iniciar o Backend
```bash
cd BackEnd
npm install  # Instalar socket.io se ainda não instalado
npm run dev
```

### 2. Iniciar o Frontend
```bash
cd FrontEnd
npm install  # Instalar socket.io-client se ainda não instalado
npm start
```

### 3. Testar Atualização Automática

**Teste 1 - Via Frontend:**
1. Abra o Dashboard em uma aba
2. Abra outra aba e crie um novo agendamento
3. O Dashboard deve atualizar automaticamente

**Teste 2 - Via WhatsApp:**
1. Abra o Dashboard
2. Crie um agendamento via WhatsApp
3. O Dashboard deve atualizar automaticamente

## 🐛 Troubleshooting

### Socket.IO não conecta

1. Verifique se as dependências foram instaladas:
   ```bash
   # Backend
   cd BackEnd && npm list socket.io
   
   # Frontend
   cd FrontEnd && npm list socket.io-client
   ```

2. Verifique os logs do console do navegador
3. Verifique os logs do servidor

### Dashboard não atualiza

1. Verifique se o Socket.IO está conectado (veja console do navegador)
2. Verifique se o evento está sendo emitido (veja logs do servidor)
3. Verifique se o Dashboard está escutando eventos (veja console do navegador)

### Erro "Cannot find module 'socket.io'"

Execute:
```bash
cd BackEnd
npm install socket.io
```

### Erro "Cannot find module 'socket.io-client'"

Execute:
```bash
cd FrontEnd
npm install socket.io-client
```

## 📝 Notas Técnicas

- O Socket.IO usa WebSockets como transporte principal, com fallback para polling
- A conexão é estabelecida automaticamente quando o Dashboard é carregado
- A conexão é desconectada quando o componente é destruído
- Reconexão automática está configurada (até 5 tentativas)

## 🔄 Próximas Melhorias Possíveis

1. Adicionar atualização automática em outras telas (ex: lista de agendamentos)
2. Implementar notificações push para novos agendamentos
3. Adicionar indicador visual de conexão Socket.IO
4. Implementar cache local para melhorar performance
5. Adicionar suporte a múltiplos usuários simultâneos

