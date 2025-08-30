'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsToMany( models.Product, { through: "saleproducts", constraints: false } ),
      this.belongsTo( models.Account, { foreignKey: "account_id_sale", constraints: false } ),
     	this.belongsTo( models.Account, { foreignKey: "client_id_sale", constraints: false } );

    }
  }
  Sale.init({
    name_product: DataTypes.STRING,
    amount_product: DataTypes.INTEGER,
    price_total: DataTypes.FLOAT,
    discount: DataTypes.INTEGER,
    date_sale: DataTypes.DATE,
    paid_off: DataTypes.BOOLEAN,
    remaining: DataTypes.FLOAT,
    account_id_sale: DataTypes.UUID,
    client_id_sale: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Sale',
  });
  return Sale;
};