'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relação muitos-para-muitos com Schedules através da tabela Schedule_Service
      this.belongsToMany(models.Schedules, {
        through: 'Schedule_Service',
        foreignKey: 'service_id',
        otherKey: 'schedules_id'
      });
    }
  }
  Service.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    service: DataTypes.STRING,
    additionalComments: DataTypes.STRING,
    price: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'Service',
  });
  return Service;
};