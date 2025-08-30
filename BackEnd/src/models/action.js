'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Action extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsTo( models.Service, { foreignKey: { name: "service_id_action" }, constraints: false } );

    }
  }
  Action.init({
    name: DataTypes.STRING,
    additionalComments: DataTypes.STRING,
    service_id_action: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Action',
  });
  return Action;
};