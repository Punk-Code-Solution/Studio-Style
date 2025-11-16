'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { v4: uuidv4 } = require('uuid');

    const hairTypes = [
      { type: 'Liso', level: 1, letter: 'A' },
      { type: 'Ondulado', level: 2, letter: 'B' },
      { type: 'Cacheado', level: 3, letter: 'C' },
      { type: 'Crespo', level: 4, letter: 'D' }
    ];

    for (const h of hairTypes) {
      const exists = await queryInterface.rawSelect('Hairs', {
        where: { type: h.type }
      }, ['id']);

      if (!exists) {
        await queryInterface.bulkInsert('Hairs', [{
          id: uuidv4(),
          type: h.type,
          level: h.level,
          letter: h.letter,
          createdAt: new Date(),
          updatedAt: new Date()
        }], {});
      }
    }
  },

  async down (queryInterface, Sequelize) {
    const types = ['Liso', 'Ondulado', 'Cacheado', 'Crespo'];
    await queryInterface.bulkDelete('Hairs', { type: types }, {});
  }
};
