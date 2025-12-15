'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Adress extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsTo( models.Account, { foreignKey: { name: "account_id_adress" }, constraints: false })

    }
  }
  Adress.init({
    city: DataTypes.STRING,
    neighborhood: DataTypes.STRING,
    road: DataTypes.STRING,
    //cep: DataTypes.INTEGER,
    account_id_adress: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Adress',
    tableName: 'Addresses', // Nome correto da tabela no banco de dados
    underscored: false
  });
  return Adress;
};