'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Purchases', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      nameproduct: {
        type: Sequelize.STRING
      },
      amount_product: {
        type: Sequelize.INTEGER
      },
      value_product: {
        type: Sequelize.FLOAT
      },
      date_purchase: {
        type: Sequelize.DATE
      },
      product_description: {
        type: Sequelize.TEXT
      },
      account_id_purchase: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        references: {
          model: 'Accounts',
          key: 'id'
        }
      },
      company_id_purchase: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        references: {
          model: 'Companies',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Purchases');
  }
};