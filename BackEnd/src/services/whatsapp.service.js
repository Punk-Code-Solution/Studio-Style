
const axios = require('axios');
const moment = require('moment');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    this.apiUrl = `https://graph.facebook.com/v22.0/${this.phoneNumberId}/messages`;
  }

  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  async sendTextMessage(to, message) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errorData = error.response?.data?.error || {};
      const errorCode = errorData.code;
      const errorMessage = errorData.message || error.message;
      
      // Erros conhecidos que não devem quebrar o webhook
      const knownErrors = [
        131030, // Recipient phone number not in allowed list
        131026, // Message undeliverable
        131047, // Re-engagement message
        131048, // Unsupported message type
      ];
      
      // Erros de autenticação/token (não quebram o webhook, mas são problemas de configuração)
      const authErrors = [
        190, // OAuthException - Token expirado ou inválido
      ];
      
      if (errorCode && knownErrors.includes(errorCode)) {
        console.warn(`Erro conhecido do WhatsApp (${errorCode}): ${errorMessage}`);
        console.warn(`Número: ${to}`);
        return { 
          success: false, 
          error: errorMessage,
          code: errorCode,
          recoverable: true // Indica que é um erro conhecido e não crítico
        };
      }
      
      if (errorCode && authErrors.includes(errorCode)) {
        console.error(`⚠️ ERRO DE AUTENTICAÇÃO DO WHATSAPP (${errorCode}): ${errorMessage}`);
        console.error(`⚠️ O token de acesso expirou ou é inválido. Atualize a variável WHATSAPP_ACCESS_TOKEN no ambiente.`);
        console.error(`⚠️ Número tentado: ${to}`);
        return { 
          success: false, 
          error: errorMessage,
          code: errorCode,
          recoverable: true, // Não quebra o webhook, mas precisa ser corrigido
          isAuthError: true // Flag especial para erros de autenticação
        };
      }
      
      // Erros desconhecidos ou críticos
      console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
      return { 
        success: false, 
        error: errorMessage,
        code: errorCode,
        recoverable: false
      };
    }
  }

  processIncomingMessage(webhookData) {
    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value?.messages) {
        return null;
      }

      const message = value.messages[0];
      const contact = value.contacts?.[0];

      return {
        messageId: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: message.type,
        text: message.text?.body || '',
        contact: {
          name: contact?.profile?.name || '',
          phone: message.from
        }
      };
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return null;
    }
  }

  formatDate(date) {
    return moment(date).format('DD/MM/YYYY [às] HH:mm');
  }

  validatePhoneNumber(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      return `55${cleanPhone}`;
    }
    
    return null;
  }
}

module.exports = WhatsAppService;