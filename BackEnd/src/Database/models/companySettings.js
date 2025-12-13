'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CompanySettings extends Model {
    static associate(models) {
      // Sem relacionamentos - configuração global
    }
  }

  CompanySettings.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tax_regime: {
      type: DataTypes.ENUM('MEI', 'SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL'),
      allowNull: false,
      defaultValue: 'MEI'
    },
    is_partner_salon: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag para Lei do Salão Parceiro'
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.0000,
      get() {
        const value = this.getDataValue('tax_rate');
        return value ? parseFloat(value) : 0;
      },
      comment: 'Taxa de imposto (ex: 0.0600 = 6%)'
    },
    payment_gateway_fee: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.0299,
      get() {
        const value = this.getDataValue('payment_gateway_fee');
        return value ? parseFloat(value) : 0;
      },
      comment: 'Taxa do gateway de pagamento (ex: 0.0299 = 2.99%)'
    },
    default_commission_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.5000,
      get() {
        const value = this.getDataValue('default_commission_rate');
        return value ? parseFloat(value) : 0;
      },
      comment: 'Comissão padrão do profissional (ex: 0.5000 = 50%)'
    }
  }, {
    sequelize,
    modelName: 'CompanySettings',
    tableName: 'CompanySettings',
    freezeTableName: true
  });

  return CompanySettings;
};
