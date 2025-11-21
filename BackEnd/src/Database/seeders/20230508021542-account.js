'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Verifica se o tipo de conta 'admin' já existe; se não, cria
    let typeAccountAdminId = await queryInterface.rawSelect('TypeAccounts', {
      where: { type: 'admin' }
    }, ['id']);

    if (!typeAccountAdminId) {
      typeAccountAdminId = uuidv4();
      await queryInterface.bulkInsert('TypeAccounts', [{
        id: typeAccountAdminId,
        type: 'admin',
        edit: true,
        creat: true,
        viwer: true,
        delet: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }

    // Verifica/Cria tipo 'client'
    let typeAccountClientId = await queryInterface.rawSelect('TypeAccounts', {
      where: { type: 'client' }
    }, ['id']);

    if (!typeAccountClientId) {
      typeAccountClientId = uuidv4();
      await queryInterface.bulkInsert('TypeAccounts', [{
        id: typeAccountClientId,
        type: 'client',
        edit: false,
        creat: true,
        viwer: true,
        delet: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }

    // Verifica/Cria tipo 'provider'
    let typeAccountProviderId = await queryInterface.rawSelect('TypeAccounts', {
      where: { type: 'provider' }
    }, ['id']);

    if (!typeAccountProviderId) {
      typeAccountProviderId = uuidv4();
      await queryInterface.bulkInsert('TypeAccounts', [{
        id: typeAccountProviderId,
        type: 'provider',
        edit: false,
        creat: false,
        viwer: true,
        delet: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }

    // Verifica se a conta admin já existe por CPF; se não, cria
    let adminAccountId = await queryInterface.rawSelect('Accounts', {
      where: { cpf: '00000000000' }
    }, ['id']);

    if (!adminAccountId) {
      adminAccountId = uuidv4();
      const passwordHash = await bcrypt.hash('123456', 10);
      await queryInterface.bulkInsert('Accounts', [{
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
    }

    // Verifica se o email do admin já existe; se não, cria
    const existingEmailId = await queryInterface.rawSelect('Emails', {
      where: { email: 'admin@admin.com' }
    }, ['id']);

    if (!existingEmailId) {
      await queryInterface.bulkInsert('Emails', [{
        id: uuidv4(),
        name: 'Administrador',
        account_id_email: adminAccountId,
        email: 'admin@admin.com',
        active: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }

    // Verifica se o phone do admin já existe; se não, cria
    const existingPhoneId = await queryInterface.rawSelect('Phones', {
      where: { 
        account_id_phone: adminAccountId,
        phone: '00000000000'
      }
    }, ['id']);

    if (!existingPhoneId) {
      await queryInterface.bulkInsert('Phones', [{
        id: uuidv4(),
        phone: '73998348081',
        ddd: 0,
        active: new Date(),
        type: 'celular',
        account_id_phone: adminAccountId,
        company_id_phone: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove o phone, email, conta e tipo de conta criados pelo seeder (se existirem)
    await queryInterface.bulkDelete('Phones', { phone: '00000000000' }, {});
    await queryInterface.bulkDelete('Emails', { email: 'admin@admin.com' }, {});
    await queryInterface.bulkDelete('Accounts', { cpf: '00000000000' }, {});
    await queryInterface.bulkDelete('TypeAccounts', { type: 'admin' }, {});
  }
};
