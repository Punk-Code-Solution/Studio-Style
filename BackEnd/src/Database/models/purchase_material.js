'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Purchase_Material extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      
      this.belongsTo( models.Account, { foreignKey: "account_id_purchase_material", constraints: false } )

    }
  }
  Purchase_Material.init({
    name: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    value: DataTypes.FLOAT,
    date: DataTypes.DATE,
    product_description: DataTypes.STRING,
    account_id_purchase_material: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'Purchase_Material',
  });
  return Purchase_Material;
};