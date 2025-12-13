'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CommissionRule extends Model {
    static associate(models) {
      this.belongsTo(models.Service, {
        foreignKey: 'service_id',
        as: 'service'
      });
      this.belongsTo(models.Account, {
        foreignKey: 'professional_id',
        as: 'professional'
      });
    }
  }

  CommissionRule.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    rule_type: {
      type: DataTypes.ENUM('GENERAL', 'SERVICE', 'PROFESSIONAL'),
      allowNull: false,
      defaultValue: 'GENERAL'
    },
    service_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    professional_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    commission_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      get() {
        const value = this.getDataValue('commission_rate');
        return value ? parseFloat(value) : 0;
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'CommissionRule',
    tableName: 'CommissionRules'
  });

  return CommissionRule;
};

