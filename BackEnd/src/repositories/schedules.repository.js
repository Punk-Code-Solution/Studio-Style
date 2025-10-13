const { Schedules, Service } = require("../Database/models");
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
    
  async updateSchedules(service) {

    await Schedules.update(
      {

        name_client: service.name_client ? service.name_client : Service.name_client,
        name_provider: service.name_provider ? service.name_provider : Service.name_provider,
        client_id: service.client_id ? service.client_id : Service.client_id,
        value: service.value ? service.value : Service.value,
        service: service.service ? service.service : Service.service,
        id_account_service_provider: service.id_account_service_provider ? service.id_account_service_provider : Service.id_account_service_provider,
        date_service: service.date_service ? service.date_service : Service.date_service

      },
      {
        where: {
            id: service.id,
        },
        
      }

    );
  
    return await Schedules.findOne({
      where:{
        id : id
        }
    });
  }
    
  async deleteSchedules(id) {

    await Schedules.destroy({
      where: {
        id: id,
      },
    });

  }
}

module.exports = schedulesRepository