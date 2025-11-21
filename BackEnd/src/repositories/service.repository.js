const { Service } = require("../Database/models");
const { v4: uuidv4 } = require('uuid');

class serviceRepository{

  async findAll(limit = 10, base = 0){
    try {
      const services = await Service.findAll({
        limit: limit,
        offset: base,
        // Não incluir associações para evitar problemas com colunas que não existem
        include: [],
        // Remover ordenação por createdAt se não existir no modelo
        // order: [['createdAt', 'DESC']]
      });
      
      console.log('Services found in repository:', services?.length || 0);
      return services || [];
    } catch (error) {
      console.error('Erro ao buscar serviços no repositório:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
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
    // Atualizar apenas os campos permitidos do modelo Service
    const updateData = {};
    
    if (service.service !== undefined) {
      updateData.service = service.service;
    }
    if (service.additionalComments !== undefined) {
      updateData.additionalComments = service.additionalComments;
    }
    if (service.price !== undefined) {
      updateData.price = service.price;
    }

    await Service.update(
      updateData,
      {
        where: {
            id: service.id,
        },
        
      }

    );
  
    return await Service.findOne({
      where:{
        id: service.id
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