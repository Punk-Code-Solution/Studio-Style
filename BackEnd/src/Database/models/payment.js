'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Payment pertence a Schedules
      this.belongsTo(models.Schedules, { 
        foreignKey: "service_id_payment",
        as: 'schedule',
        constraints: false 
      });
    }
  }
  Payment.init({
    valueTotal: DataTypes.FLOAT,
    discountValue: DataTypes.FLOAT,
    tipePayment: DataTypes.STRING,
    date: DataTypes.DATE,
    service_id_payment: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};