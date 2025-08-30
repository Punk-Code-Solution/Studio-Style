'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Schedules extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsTo( models.Account, { foreignKey: "provider_id_schedules", constraints: false } ),
      this.belongsTo( models.Account, { foreignKey: "client_id_schedules", constraints: false } );
      
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