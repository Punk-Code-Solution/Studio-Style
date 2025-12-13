const ConversationRepository = require('../repositories/conversation.repository');
const WhatsAppService = require('./whatsapp.service');
const { Op } = require('sequelize');

class ConversationService {
  constructor() {
    this.conversationRepo = ConversationRepository;
    this.whatsappService = new WhatsAppService();
  }

  // Processa uma mensagem recebida
  async processIncomingMessage(messageData) {
    const { from, text, contact, messageType = 'text', mediaUrl } = messageData;
    
    try {
      // Verifica se já existe uma conversa para este número
      let conversation = await this.conversationRepo.findConversationByPhone(from);
      
      // Se não existir, cria uma nova conversa
      if (!conversation) {
        conversation = await this.conversationRepo.createConversation({
          phoneNumber: from,
          contactName: contact?.name || from,
          lastMessage: text || 'Mídia recebida',
          metadata: {
            contact,
            lastInteraction: new Date(),
          },
        });
      }
      
      // Adiciona a mensagem à conversa
      const message = await this.conversationRepo.addMessage(conversation.id, {
        whatsappMessageId: messageData.id,
        from,
        to: this.whatsappService.phoneNumberId,
        direction: 'incoming',
        messageType,
        content: text || 'Mídia recebida',
        mediaUrl,
        status: 'delivered',
        metadata: {
          ...messageData,
          processedAt: new Date(),
        },
      });

      // Retorna os dados da conversa e mensagem para processamento adicional
      return {
        conversation,
        message,
        isNewConversation: !conversation.lastMessageAt,
      };
    } catch (error) {
      console.error('Error processing incoming message:', error);
      throw new Error('Failed to process incoming message');
    }
  }

  // Envia uma mensagem para um número
  async sendMessage(phoneNumber, message, options = {}) {
    try {
      // Envia a mensagem via WhatsApp
      const result = await this.whatsappService.sendTextMessage(phoneNumber, message);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
      
      // Verifica se já existe uma conversa para este número
      let conversation = await this.conversationRepo.findConversationByPhone(phoneNumber);
      
      // Se não existir, cria uma nova conversa
      if (!conversation) {
        conversation = await this.conversationRepo.createConversation({
          phoneNumber,
          contactName: options.contactName || phoneNumber,
          lastMessage: message,
        });
      }
      
      // Adiciona a mensagem à conversa
      const savedMessage = await this.conversationRepo.addMessage(conversation.id, {
        whatsappMessageId: result.data?.messages?.[0]?.id || `temp-${Date.now()}`,
        from: this.whatsappService.phoneNumberId,
        to: phoneNumber,
        direction: 'outgoing',
        messageType: 'text',
        content: message,
        status: 'sent',
        metadata: {
          whatsappResponse: result.data,
          sentAt: new Date(),
        },
      });
      
      return {
        success: true,
        message: savedMessage,
        conversation,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Obtém o histórico de mensagens de uma conversa
  async getConversationHistory(conversationId, page = 1, limit = 20) {
    try {
      return await this.conversationRepo.getMessages(conversationId, page, limit);
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw new Error('Failed to get conversation history');
    }
  }

  // Lista todas as conversas com paginação
  async listConversations(page = 1, limit = 20, status = 'all') {
    try {
      let where = {};
      
      if (status === 'unread') {
        where.unreadCount = { [Op.gt]: 0 };
      } else if (status === 'active') {
        where.status = 'active';
      } else if (status === 'archived') {
        where.status = 'archived';
      }
      
      return await this.conversationRepo.listConversations(page, limit, where);
    } catch (error) {
      console.error('Error listing conversations:', error);
      throw new Error('Failed to list conversations');
    }
  }

  // Marca uma conversa como lida
  async markAsRead(conversationId) {
    try {
      await this.conversationRepo.markAsRead(conversationId);
      return { success: true };
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw new Error('Failed to mark conversation as read');
    }
  }

  // Atualiza os metadados de uma conversa
  async updateConversation(conversationId, updateData) {
    try {
      const conversation = await this.conversationRepo.updateConversation(conversationId, updateData);
      return { success: true, conversation };
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw new Error('Failed to update conversation');
    }
  }

  // Associa uma conta a uma conversa
  async linkToAccount(conversationId, accountId) {
    try {
      const conversation = await this.conversationRepo.updateConversation(conversationId, {
        accountId,
        metadata: {
          ...(conversation.metadata || {}),
          linkedAt: new Date(),
        },
      });
      
      return { success: true, conversation };
    } catch (error) {
      console.error('Error linking conversation to account:', error);
      throw new Error('Failed to link conversation to account');
    }
  }
}

module.exports = new ConversationService();
