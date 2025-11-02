'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Cria o tipo de conta 'admin'
    const typeAccountAdminId = uuidv4();
    await queryInterface.bulkInsert('TypeAccount', [{
      id: typeAccountAdminId,
      type: 'admin',
      edit: 'true',
      creat: 'true',
      viwer: 'true',
      delet: 'true',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    // Cria o usuario admin
    const adminAccountId = uuidv4();
    const passwordHash = await bcrypt.hash('123456', 10);
    await queryInterface.bulkInsert('Account', [{
      id: adminAccountId,
      name: 'Administrador',
      lastname: 'Sistema',
      password: passwordHash,
      cpf: '00000000000',
      start_date: new Date(),
      birthday: new Date('1990-01-01'),
      deleted: false,
      avatar: null,
      typeaccount_id: typeAccountAdminId,
      company_id_account: null,
      type_hair_id: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    // Cria o email do usuario admin
    await queryInterface.bulkInsert('Email', [{
      id: uuidv4(),
      account_id_email: adminAccountId,
      email: 'admin@admin.com',
      type: 'primary',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Email', { email: 'admin@admin.com' }, {});
    await queryInterface.bulkDelete('Account', { cpf: '00000000000' }, {});
    await queryInterface.bulkDelete('TypeAccount', { type: 'admin' }, {});
  }
};
