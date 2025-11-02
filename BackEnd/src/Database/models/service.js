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
<<<<<<< HEAD

      this.belongsTo( models.Account, { foreignKey: "client_id_service", constraints: false } ),
      this.belongsTo( models.Account, { foreignKey: "provider_id_service", constraints: false } ),
      this.belongsTo( models.Schedules, { foreignKey: "schedule_id", constraints: false } ),
      this.hasMany( models.Action, { foreignKey: "service_id_action", constraints: false } ),
      this.hasMany( models.Payment, { foreignKey: "service_id_payment", constraints: false } );

=======
      // Relação muitos-para-muitos com Schedules através da tabela Schedule_Service
      this.belongsToMany(models.Schedules, {
        through: 'Schedule_Service',
        foreignKey: 'service_id',
        otherKey: 'schedules_id'
      });
>>>>>>> deae5e3ed238b02055f120a185104ab74c159e37
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