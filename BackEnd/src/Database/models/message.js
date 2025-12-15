'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Conversation, { foreignKey: 'conversation_id', constraints: false });
    }
  }
  Message.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Conversations',
        key: 'id'
      }
    },
    whatsapp_message_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    from: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    to: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    direction: {
      type: DataTypes.ENUM('incoming', 'outgoing'),
      allowNull: false
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contacts', 'interactive', 'button', 'template'),
      defaultValue: 'text'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    media_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
      defaultValue: 'sent'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'Messages',
    underscored: false
  });
  return Message;
};

