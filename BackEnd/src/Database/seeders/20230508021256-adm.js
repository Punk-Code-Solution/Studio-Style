'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {

    await queryInterface.bulkInsert('TypeAccount', [{

      type: 'adm',
      edit: 'true',
      creat: 'true',
      viwer: 'true',
      delet: 'true'

    }], {});

  },

  async down (queryInterface, Sequelize) {
    
    await queryInterface.bulkDelete('TypeAccount', null, {});
     
  }
};
