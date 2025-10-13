'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Schedules extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The models/index file will call this method automatically.
     */
    static associate(models) {
      // Relações com Account (provider e client)
      this.belongsTo(models.Account, { 
        foreignKey: "provider_id_schedules", 
        as: 'provider',
        constraints: false 
      });
      this.belongsTo(models.Account, { 
        foreignKey: "client_id_schedules", 
        as: 'client',
        constraints: false 
      });
      
      // Relação muitos-para-muitos com Service através da tabela Schedule_Service
      this.belongsToMany(models.Service, {
        through: 'Schedule_Service',
        foreignKey: 'schedules_id',
        otherKey: 'service_id',
        as: 'Services'
      });
      
      // Relação com Payment (Schedules tem muitos Payments)
      this.hasMany(models.Payment, { 
        foreignKey: "service_id_payment",
        as: 'payments',
        constraints: false 
      });
    }
  }
  Schedules.init({
    name_client: DataTypes.STRING,
    date_and_houres: DataTypes.DATE,
    active: DataTypes.BOOLEAN,
    finished: DataTypes.BOOLEAN,
    provider_id_schedules: DataTypes.UUID,
    client_id_schedules: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Schedules',
  });
  return Schedules;
};
