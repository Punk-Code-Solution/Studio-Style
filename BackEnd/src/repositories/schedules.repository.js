const { Schedules, Service, Account } = require("../Database/models");
const { v4: uuidv4 } = require('uuid');

class schedulesRepository{

  async findAll(limit = 100, offset = 0) {
    try {
      const schedules = await Schedules.findAll({
        limit,
        offset,
        include: [
          {
            model: Service,
            as: 'Services',
            through: {
              attributes: [] 
            }
          },
          { 
            model: Account, 
            as: 'provider', 
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
          },
          { 
            model: Account, 
            as: 'client', 
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] }
          }
        ],
        order: [['date_and_houres', 'ASC']]
      });

      return schedules;
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  }

  async findSchedules(id) {
    return await Schedules.findOne({ 
      where:{
        id : id
      },
      include: [ 
          {
            model: Service,
            as: 'Services',
            through: { attributes: [] }
          },
          { model: Account, as: 'provider' },
          { model: Account, as: 'client' }
      ]
     });
  }
    
  async addSchedules(schedules, transaction = null) {
    const { 
        name_client,
        date_and_houres,
        active,
        finished,
        provider_id_schedules,
        client_id_schedules,
    } = schedules

    const result = await Schedules.create({
        id: schedules.id || uuidv4(),
        name_client,
        date_and_houres,
        active,
        finished,
        provider_id_schedules,
        client_id_schedules
      }, {
        transaction
      });

      if(result){
        return result
      }
      return false
  }
  
  /**
   * Método auxiliar para verificar conflitos de horário
   */
  async checkTimeConflict(dateAndHours, providerId, scheduleId = null, transaction = null) {
    const { Op } = require('sequelize');
    const where = {
      active: true,
      finished: false,
      date_and_houres: dateAndHours,
      provider_id_schedules: providerId
    };
    
    // Excluir o próprio agendamento se estiver atualizando
    if (scheduleId) {
      where.id = { [Op.ne]: scheduleId };
    }
    
    const conflict = await Schedules.findOne({
      where,
      transaction
    });
    
    return !!conflict;
  }
    
  async updateSchedules(scheduleData) {
    const { 
      id,
      name_client,
      date_and_houres,
      active,
      finished,
      provider_id_schedules,
      client_id_schedules,
      payment_method,
      apply_gateway_fee
    } = scheduleData

    await Schedules.update(
      {
        name_client: name_client ? name_client : undefined,
        date_and_houres: date_and_houres ? date_and_houres : undefined,
        active: active !== undefined ? active : undefined,
        finished: finished !== undefined ? finished : undefined,
        provider_id_schedules: provider_id_schedules ? provider_id_schedules : undefined,
        client_id_schedules: client_id_schedules ? client_id_schedules : undefined,
        payment_method: payment_method !== undefined ? payment_method : undefined,
        apply_gateway_fee: apply_gateway_fee !== undefined ? apply_gateway_fee : undefined
      },
      {
        where: {
            id: id,
        },
      }
    );
  
    return await this.findSchedules(id);
  }
    
  async deleteSchedules(id) {
    return await Schedules.destroy({
      where: {
        id: id,
      },
    });
  }
}

module.exports = schedulesRepository;
