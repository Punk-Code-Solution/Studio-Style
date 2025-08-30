'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsTo( models.Purchase, { foreignKey: "purchase_id_product", constraints:false } ),
      this.belongsToMany( models.Sale, { through: "saleproducts", constraints: false } );

    }
  }
  Product.init({
    liters: DataTypes.FLOAT,
    weight: DataTypes.FLOAT,
    name: DataTypes.STRING,
    priceTotal: DataTypes.FLOAT,
    amount: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    tipeProduct: DataTypes.STRING,
    brand: DataTypes.STRING,
    date_validity: DataTypes.DATE,
    purchase_id_product: DataTypes.UUID,
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};