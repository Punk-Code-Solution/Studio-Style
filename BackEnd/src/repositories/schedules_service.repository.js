const { Schedule_Service } = require("../Database/models");
const { v4: uuidv4 } = require('uuid');

class schedules_serviceRepository{

  async findAll(limit = 10, base = 0){

    return await Schedule_Service.findAll({

      limit: limit,
      offset: base

    });
    
  }

  async findSchedule_Service(id) {
    return await Schedule_Service.findOne({ 
      where:{
        id : id
      }
     });
  }
    
  async addSchedule_Service( Schedule_Services ) {

    const { 

      Schedule_Service,
      additionalComments,
      price

    } = Schedule_Services

    const result = await Schedule_Service.create({

        id: uuidv4(),
        Schedule_Service,
        additionalComments,
        price

      });

      if(result){
        return result
      }
      return false

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