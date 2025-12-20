'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Associações removidas temporariamente porque as colunas não existem na tabela
      // Se precisar dessas relações no futuro, adicione as colunas na migração primeiro
      
      // this.belongsTo( models.Account, { foreignKey: "client_id_service", constraints: false } ),
      // this.belongsTo( models.Account, { foreignKey: "provider_id_service", constraints: false } ),
      // this.hasMany( models.Action, { foreignKey: "service_id_action", constraints: false } ),
      // this.hasMany( models.Payment, { foreignKey: "service_id_payment", constraints: false } );

      // Relação muitos-para-muitos com Schedules através da tabela Schedule_Service
      this.belongsToMany(models.Schedules, {
        through: 'Schedule_Service',
        foreignKey: 'service_id',
        otherKey: 'schedules_id'
      });
    }
  }
  Service.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    service: DataTypes.STRING,
    additionalComments: DataTypes.STRING,
    price: DataTypes.FLOAT,
    // Comissão padrão do colaborador para este serviço (0.0 - 1.0, ex: 0.5 = 50%)
    commission_rate: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    // Duração do serviço em minutos (padrão: 60 minutos)
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 60
    },
    // Indica se o serviço só pode ter 1 agendamento por hora (ex: manicure, pedicure)
    single_per_hour: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Service',
  });
  return Service;
};