'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Phone extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsTo( models.Account, { foreignKey: { name: "account_id_phone" }, constraints: false } ),
  	  this.belongsTo( models.Company, { foreignKey: { name: "company_id_phone" }, constraints: false } );
      
    }
  }
  Phone.init({
    phone: DataTypes.INTEGER,
    ddd: DataTypes.INTEGER,
    active: DataTypes.DATE,
    type: DataTypes.STRING,
    account_id_phone: DataTypes.UUID,
    company_id_phone: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Phone',
  });
  return Phone;
};