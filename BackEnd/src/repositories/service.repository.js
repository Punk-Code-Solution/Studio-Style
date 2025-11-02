const { Service } = require("../Database/models");
const { v4: uuidv4 } = require('uuid');

class serviceRepository{

  async findAll(limit = 10, base = 0){

    return await Service.findAll({

      limit: limit,
      offset: base

    });
    
  }

  async findService(id) {
    return await Service.findOne({ 
      where:{
        id : id
      }
     });
  }
    
  async addService( services ) {

    const { 

      service,
      additionalComments,
      price

    } = services

    const result = await Service.create({

        id: uuidv4(),
        service,
        additionalComments,
        price

      });

      if(result){
        return result
      }
      return false

  }
    
  async updateService(service) {

    await Service.update(
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
  
    return await Service.findOne({
      where:{
        id : id
        }
    });
  }
    
  async deleteService(id) {

    return await Service.destroy({
      where: {
        id: id,
      },
    });

  }
}

module.exports = serviceRepository