'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Expense extends Model {
    static associate(models) {
      this.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });
      this.belongsTo(models.Schedules, {
        foreignKey: 'schedule_id',
        as: 'schedule'
      });
      this.belongsTo(models.Account, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      this.hasMany(models.FinancialLedger, {
        foreignKey: 'expense_id',
        as: 'ledgerEntries'
      });
    }
  }

  Expense.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    expense_type: {
      type: DataTypes.ENUM('FIXED', 'VARIABLE'),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('amount');
        return value ? parseFloat(value) : 0;
      }
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    recurring_period: {
      type: DataTypes.ENUM('MONTHLY', 'WEEKLY', 'YEARLY'),
      allowNull: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    schedule_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Expense',
    tableName: 'Expenses'
  });

  return Expense;
};

