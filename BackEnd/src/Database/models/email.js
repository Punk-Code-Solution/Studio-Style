'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Email extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsTo( models.Account , { foreignKey: { name: "account_id_email" }, constraints: false }),
      this.belongsTo( models.Company , { foreignKey: { name: "company_id_email" }, constraints: false });

    }
  }
  Email.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    active: DataTypes.DATE,
    account_id_email: DataTypes.UUID,
    company_id_email: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Email',
  });
  return Email;
};