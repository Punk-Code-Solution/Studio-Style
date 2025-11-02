'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Schedule_Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Tabela de junção: relaciona Schedule_Service com Service
      this.belongsTo(models.Service, {
        foreignKey: 'service_id',
        as: 'service'
      });
      
      // Tabela de junção: relaciona Schedule_Service com Schedules
      this.belongsTo(models.Schedules, {
        foreignKey: 'schedules_id',
        as: 'schedule'
      });
    }
  }
  Schedule_Service.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    schedules_id: DataTypes.UUID,
    service_id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Schedule_Service',
  });
  return Schedule_Service;
};