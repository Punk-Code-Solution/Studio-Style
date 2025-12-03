'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FinancialLedger extends Model {
    static associate(models) {
      this.belongsTo(models.Schedules, {
        foreignKey: 'schedule_id',
        as: 'schedule'
      });
      this.belongsTo(models.Expense, {
        foreignKey: 'expense_id',
        as: 'expense'
      });
      this.belongsTo(models.Account, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
  }

  FinancialLedger.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transaction_type: {
      type: DataTypes.ENUM('INCOME', 'EXPENSE'),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(
        'SERVICE_PAYMENT',
        'COMMISSION_PAYMENT',
        'TAX_PAYMENT',
        'GATEWAY_FEE',
        'PRODUCT_COST',
        'FIXED_EXPENSE',
        'VARIABLE_EXPENSE',
        'OTHER'
      ),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('amount');
        return value ? parseFloat(value) : 0;
      },
      set(value) {
        // Garante que o valor seja armazenado corretamente
        this.setDataValue('amount', value);
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reference_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    reference_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    schedule_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    expense_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'FinancialLedger',
    tableName: 'FinancialLedger'
    // Nota: Para auditoria completa, considere desabilitar updates via políticas de banco
    // ou usar triggers. Por enquanto, mantemos flexibilidade para correções administrativas.
  });

  return FinancialLedger;
};

