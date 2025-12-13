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
        unreadCount: 0,
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
                attributes: ['id', 'number', 'type'],
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
        where: { phoneNumber },
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
                attributes: ['id', 'number', 'type'],
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
        order: [['lastMessageAt', 'DESC']],
        include: [
          {
            model: Account,
            as: 'account',
            attributes: ['id', 'name'],
            include: [
              {
                model: Phone,
                as: 'phones',
                attributes: ['id', 'number', 'type'],
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
        conversationId,
        ...messageData,
        timestamp: new Date(),
      }, { transaction });

      // Atualiza a conversa com a última mensagem e data
      await this.Conversation.update(
        {
          lastMessage: messageData.content,
          lastMessageAt: new Date(),
          unreadCount: messageData.direction === 'incoming' 
            ? this.sequelize.literal('unread_count + 1')
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
        { unreadCount: 0 },
        { where: { id: conversationId } }
      );

      // Marca todas as mensagens como lidas
      await this.Message.update(
        { status: 'read' },
        { 
          where: { 
            conversationId,
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
        where: { conversationId },
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
          unreadCount: { [Op.gt]: 0 }
        },
        order: [['lastMessageAt', 'DESC']],
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
