const { Schedules, Service, Account } = require("../database/models");
const { v4: uuidv4 } = require('uuid');

class schedulesRepository{

  async findAll(limit = 10, offset = 0) {
    try {
      const schedules = await Schedules.findAll({
        limit,
        offset,
        include: [
          {
            model: Service,
            as: 'Services',
            through: {
              attributes: [] // Não incluir atributos da tabela de junção
            }
          },
          { 
            model: Account, 
            as: 'provider', // Must match the alias in your association definition
            attributes: { exclude: ['password', 'email', 'role', 'createdAt', 'updatedAt']  }
          },
          { 
            model: Account, 
            as: 'client', // Must match the alias in your association definition
            attributes: { exclude: ['password', 'email', 'role', 'createdAt', 'updatedAt']  }
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
      }
     });
  }
    
  async addSchedules( schedules ) {

    const { 

        name_client,
        date_and_houres,
        active,
        finished,
        provider_id_schedules,
        client_id_schedules,

    } = schedules

    const result = await Schedules.create({

        id: uuidv4(),
        name_client,
        date_and_houres,
        active,
        finished,
        provider_id_schedules,
        client_id_schedules

      });

      if(result){
        return result
      }
      return false

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
      services
    } = scheduleData

    await Schedules.update(

      {

        name_client: name_client ? name_client : Schedules.name_client,
        date_and_houres: date_and_houres ? date_and_houres : Schedules.date_and_houres,
        active: active ? active : Schedules.active,
        finished: finished ? finished : Schedules.finished,
        provider_id_schedules: provider_id_schedules ? provider_id_schedules : Schedules.provider_id_schedules,
        client_id_schedules: client_id_schedules ? client_id_schedules : Schedules.client_id_schedules,
        services: services ? services : Schedules.services

      },
      {
        where: {
            id: id,
        },
        
      }

    );
  
    return await Schedules.findOne({
      where:{
         id: id
        }
    });
  }
    
  async deleteSchedules(id) {

    return await Schedules.destroy({
      where: {
        id: id,
      },
    });

  }
}

module.exports = schedulesRepository