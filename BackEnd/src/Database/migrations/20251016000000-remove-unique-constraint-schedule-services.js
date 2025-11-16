'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remover a constraint de unicidade se ela existir
    try {
      await queryInterface.removeConstraint('Schedule_Services', 'Schedule_Services_schedules_id_service_id_key');
    } catch (error) {
      console.log('ℹ️ Constraint de unicidade não encontrada ou já removida');
    }
  },
  async down(queryInterface, Sequelize) {
    // Recriar a constraint de unicidade se necessário
    try {
      await queryInterface.addConstraint('Schedule_Services', {
        fields: ['schedules_id', 'service_id'],
        type: 'unique',
        name: 'Schedule_Services_schedules_id_service_id_key'
      });
      console.log('✅ Constraint de unicidade recriada');
    } catch (error) {
      console.log('ℹ️ Erro ao recriar constraint de unicidade:', error.message);
    }
  }
};
