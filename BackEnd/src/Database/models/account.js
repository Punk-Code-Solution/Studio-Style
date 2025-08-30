'use strict';
const {
  Model, Sequelize
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsTo( models.TypeAccount, { foreignKey: { name: "typeaccount_id" }, constraints: false } ),
      this.belongsTo( models.Hair, { foreignKey: { name: "type_hair_id" }, constraints: false } ),
      this.belongsTo( models.Company, { foreignKey: { name: "company_id_account" }, constraints: false } ),
      this.hasOne( models.Adress, { foreignKey: "account_id_adress",constraints: false, onDelete: 'CASCADE' } ),
      this.hasMany( models.Email, { foreignKey: "account_id_email", constraints: false, onDelete: 'CASCADE' } ),
      this.hasMany( models.Phone, { foreignKey: "account_id_phone", constraints: false, onDelete: 'CASCADE' } ),
      this.hasMany( models.Purchase_Material, { foreignKey: "account_id_purchase_material", constraints: false } ),
      this.hasMany( models.Purchase, { foreignKey: "account_id_purchase", constraints: false } ),
      this.hasMany( models.Sale, { foreignKey: "account_id_sale", constraints: false } ),
      this.hasMany( models.Schedules, { foreignKey: "client_id_schedules", constraints: false } ),
      this.hasMany( models.Service, { foreignKey: "client_id_service", constraints: false } ),
      this.hasMany( models.Service, { foreignKey: "provider_id_service", constraints: false } );

    }
  }
  Account.init({
    name: DataTypes.STRING,
    lastname: DataTypes.STRING,
    password: DataTypes.STRING,
    cpf: DataTypes.STRING,
    start_date: DataTypes.DATE,
    birthday: DataTypes.DATE,
    deleted: DataTypes.BOOLEAN,
    avatar: DataTypes.STRING,
    typeaccount_id: DataTypes.UUID,
    company_id_account: DataTypes.UUID,
    type_hair_id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Account',
  });
  return Account;
};