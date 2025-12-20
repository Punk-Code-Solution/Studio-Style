const { Conversation, Message, Account, Phone } = require("../Database/models");
const { Op } = require('sequelize');

class ConversationRepository {
  constructor() {
    this.Conversation = Conversation;
    this.Message = Message;
  }

  // Cria uma nova conversa
  async createConversation(conversationData) {
    try {
      return await this.Conversation.create({
        id: require('uuid').v4(),
        ...conversationData,
        status: 'active',
        unread_count: 0,
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  // Encontra uma conversa por ID
  async findConversationById(conversationId) {
    try {
      return await this.Conversation.findByPk(conversationId, {
        include: [
          {
            model: Message,
            as: 'messages',
            order: [['timestamp', 'DESC']],
            limit: 20, // Últimas 20 mensagens
          },
          {
            model: Account,
            as: 'account',
            include: [
              {
                model: Phone,
                as: 'phones',
                attributes: ['id', 'phone', 'ddd', 'type'],
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error finding conversation:', error);
      throw new Error('Failed to find conversation');
    }
  }

  // Encontra uma conversa por número de telefone
  async findConversationByPhone(phoneNumber) {
    try {
      return await this.Conversation.findOne({
        where: { phone_number: phoneNumber },
        include: [
          {
            model: Message,
            as: 'messages',
            order: [['timestamp', 'DESC']],
            limit: 20, // Últimas 20 mensagens
          },
          {
            model: Account,
            as: 'account',
            include: [
              {
                model: Phone,
                as: 'phones',
                attributes: ['id', 'phone', 'ddd', 'type'],
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error finding conversation by phone:', error);
      throw new Error('Failed to find conversation by phone');
    }
  }

  // Lista todas as conversas com paginação
  async listConversations(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      return await this.Conversation.findAndCountAll({
        order: [['last_message_at', 'DESC']],
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name'],
            include: [
              {
                model: Phone,
                as: 'phones',
                attributes: ['id', 'phone', 'ddd', 'type'],
              },
            ],
          },
        ],
        limit,
        offset,
      });
    } catch (error) {
      console.error('Error listing conversations:', error);
      throw new Error('Failed to list conversations');
    }
  }

  // Atualiza uma conversa
  async updateConversation(conversationId, updateData) {
    try {
      const conversation = await this.Conversation.findByPk(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }
      
      return await conversation.update(updateData);
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw new Error('Failed to update conversation');
    }
  }

  // Adiciona uma mensagem a uma conversa
  async addMessage(conversationId, messageData) {
    const transaction = await this.Conversation.sequelize.transaction();
    
    try {
      // Cria a mensagem
      const message = await this.Message.create({
        id: require('uuid').v4(),
        conversation_id: conversationId,
        ...messageData,
        timestamp: new Date(),
      }, { transaction });

      // Atualiza a conversa com a última mensagem e data
      await this.Conversation.update(
        {
          last_message: messageData.content,
          last_message_at: new Date(),
          unread_count: messageData.direction === 'incoming' 
            ? this.Conversation.sequelize.literal('unread_count + 1')
            : 0,
        },
        { 
          where: { id: conversationId },
          transaction,
        }
      );

      await transaction.commit();
      return message;
    } catch (error) {
      await transaction.rollback();
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }
  }

  // Marca mensagens como lidas
  async markAsRead(conversationId) {
    try {
      // Atualiza a contagem de não lidas para zero
      await this.Conversation.update(
        { unread_count: 0 },
        { where: { id: conversationId } }
      );

      // Marca todas as mensagens como lidas
      await this.Message.update(
        { status: 'read' },
        { 
          where: { 
            conversation_id: conversationId,
            status: { [Op.ne]: 'read' },
            direction: 'incoming',
          } 
        }
      );

      return true;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  // Busca mensagens de uma conversa com paginação
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      
      return await this.Message.findAndCountAll({
        where: { conversation_id: conversationId },
        order: [['timestamp', 'DESC']],
        limit,
        offset,
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new Error('Failed to get messages');
    }
  }

  // Busca conversas não lidas
  async getUnreadConversations() {
    try {
      return await this.Conversation.findAll({
        where: {
          unread_count: { [Op.gt]: 0 }
        },
        order: [['last_message_at', 'DESC']],
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name'],
          },
        ],
      });
    } catch (error) {
      console.error('Error getting unread conversations:', error);
      throw new Error('Failed to get unread conversations');
    }
  }
}

module.exports = new ConversationRepository();
