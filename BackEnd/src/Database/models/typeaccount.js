'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TypeAccount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      this.hasMany( models.Account, { foreignKey: "typeaccount_id", constraints: false } )
    }
  }
  TypeAccount.init({
    type: DataTypes.STRING,
    edit: DataTypes.BOOLEAN,
    creat: DataTypes.BOOLEAN,
    viwer: DataTypes.BOOLEAN,
    delet: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'TypeAccount',
  });
  return TypeAccount;
};