'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Purchase extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsTo( models.Account, { foreignKey: "account_id_purchase", constraints: false } ),
      this.belongsTo( models.Company, { foreignKey: "company_id_purchase", constraints: false } ),
      this.hasMany( models.Product, { constraints: false } );
      
    }
  }
  Purchase.init({
    nameproduct: DataTypes.STRING,
    amount_product: DataTypes.INTEGER,
    value_product: DataTypes.FLOAT,
    date_purchase: DataTypes.DATE,
    product_description: DataTypes.TEXT,
    account_id_purchase: DataTypes.UUID,
    company_id_purchase: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Purchase',
  });
  return Purchase;
};