'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SaleProducts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo( models.Sale, { foreignKey: "saleId", constraints: false } ),
      this.belongsTo( models.Product, { foreignKey: "productId", constraints: false } );
    }
  }
  SaleProducts.init({
    saleId: DataTypes.UUID,
    productId: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'SaleProducts',
  });
  return SaleProducts;
};