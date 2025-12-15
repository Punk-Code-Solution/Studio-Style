'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Account, { foreignKey: 'account_id', constraints: false });
      this.hasMany(models.Message, { foreignKey: 'conversation_id', constraints: false, onDelete: 'CASCADE' });
    }
  }
  Conversation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    contact_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    last_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    unread_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'spam'),
      defaultValue: 'active'
    },
    account_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Accounts',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Conversation',
    tableName: 'Conversations',
    underscored: false
  });
  return Conversation;
};

