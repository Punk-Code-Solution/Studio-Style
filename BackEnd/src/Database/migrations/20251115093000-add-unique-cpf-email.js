'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add unique index on Accounts.cpf
    await queryInterface.addIndex('Accounts', ['cpf'], {
      unique: true,
      name: 'accounts_cpf_unique'
    });

    // Add unique index on Emails.email
    await queryInterface.addIndex('Emails', ['email'], {
      unique: true,
      name: 'emails_email_unique'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove indexes
    await queryInterface.removeIndex('Accounts', 'accounts_cpf_unique');
    await queryInterface.removeIndex('Emails', 'emails_email_unique');
  }
};
