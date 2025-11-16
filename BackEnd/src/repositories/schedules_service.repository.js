const { Schedule_Service } = require("../Database/models");
const { v4: uuidv4 } = require('uuid');

class schedules_serviceRepository{

  async findAll(limit = 10, base = 0){

    return await Schedule_Service.findAll({

        limit: limit,
        offset: base,
        include: [
            { model: Service },
            { model: Schedules }
        ]

    });
    
  }

  async findSchedule_Service(id) {
    return await Schedule_Service.findOne({ 
      where:{
        id : id
      }
     });
  }
    
  async addSchedule_Service(schedules_id, services) {
    if (!Array.isArray(services) || services.length === 0) {
      return false;
    }

    try {
      // Primeiro, remover todas as relações existentes para este agendamento
      await Schedule_Service.destroy({
        where: { schedules_id }
      });
      // Criar array de objetos para bulkCreate (mantendo duplicatas)
      const scheduleServicesData = services.map(service => ({
        id: uuidv4(),
        schedules_id,
        service_id: service
      }));

      // Adiciona todos os relacionamentos de uma só vez
      const result = await Schedule_Service.bulkCreate(scheduleServicesData, { 
        returning: true
      });
      return result;
    } catch (error) {
      return false;
    }
  }
    
  async updateSchedule_Service(Schedule_Service) {

    await Schedule_Service.update(
      {

        name_client: Schedule_Service.name_client ? Schedule_Service.name_client : Schedule_Service.name_client,
        name_provider: Schedule_Service.name_provider ? Schedule_Service.name_provider : Schedule_Service.name_provider,
        client_id: Schedule_Service.client_id ? Schedule_Service.client_id : Schedule_Service.client_id,
        value: Schedule_Service.value ? Schedule_Service.value : Schedule_Service.value,
        Schedule_Service: Schedule_Service.Schedule_Service ? Schedule_Service.Schedule_Service : Schedule_Service.Schedule_Service,
        id_account_Schedule_Service_provider: Schedule_Service.id_account_Schedule_Service_provider ? Schedule_Service.id_account_Schedule_Service_provider : Schedule_Service.id_account_Schedule_Service_provider,
        date_Schedule_Service: Schedule_Service.date_Schedule_Service ? Schedule_Service.date_Schedule_Service : Schedule_Service.date_Schedule_Service

      },
      {
        where: {
            id: Schedule_Service.id,
        },
        
      }

    );
  
    return await Schedule_Service.findOne({
      where:{
        id : id
        }
    });
  }
    
  async deleteSchedule_Service(id) {

    await Schedule_Service.destroy({
      where: {
        id: id,
      },
    });

  }
}

module.exports = schedules_serviceRepository