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

      this.belongsTo( models.Account, { foreignKey: "client_id_service", constraints: false } ),
      this.belongsTo( models.Account, { foreignKey: "provider_id_service", constraints: false } ),
      this.hasMany( models.Action, { foreignKey: "client_id_service", constraints: false } ),
      this.hasMany( models.Payment, { foreignKey: "payment_id_action", constraints: false } );

    }
  }
  Service.init({
    service: DataTypes.STRING,
    date_service: DataTypes.DATE,
    additionalComments: DataTypes.STRING,
    client_id_service: DataTypes.UUID,
    provider_id_service: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Service',
  });
  return Service;
};