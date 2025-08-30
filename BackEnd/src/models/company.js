'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

      this.hasMany( models.Account, { foreignKey: "company_id_account", constraints: false  } ),
      this.hasMany( models.Email, { foreignKey: "company_id_email", constraints: false } ),
      this.hasMany( models.Phone, { foreignKey: "company_id_phone", constraints: false } ),
      this.hasMany( models.Purchase, { foreignKey: "company_id_purchase", constraints: false });
    }
  }
  Company.init({
    name: DataTypes.STRING,
    cnpj: DataTypes.STRING,
    start_date: DataTypes.DATE,
    active: DataTypes.DATE,
    avatar: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Company',
  });
  return Company;
};