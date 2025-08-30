'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Hair extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.hasMany( models.Account, { foreignKey: { name: "type_hair_id" }, constraints: false } );

    }
  }
  Hair.init({
    type: DataTypes.STRING,
    level: DataTypes.INTEGER,
    letter: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Hair',
  });
  return Hair;
};