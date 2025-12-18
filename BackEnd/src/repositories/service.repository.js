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
    
  async addService(services, transaction = null) {
    try {
      const { 
        service,
        additionalComments,
        price,
        commission_rate,
        duration,
        single_per_hour
      } = services;

      const result = await Service.create({
        id: uuidv4(),
        service,
        additionalComments,
        price,
        commission_rate,
        duration: duration || 60, // Valor padrão de 60 minutos
        single_per_hour: single_per_hour !== undefined && single_per_hour !== null ? single_per_hour : false // Valor padrão false
      }, { transaction });

      if (!result) {
        throw new Error('Failed to create service');
      }

      return result;
    } catch (error) {
      console.error('Erro ao criar serviço no repositório:', error);
      throw error;
    }
  }
    
  async updateService(service, transaction = null) {
    try {
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
      if (service.commission_rate !== undefined) {
        updateData.commission_rate = service.commission_rate;
      }
      if (service.duration !== undefined) {
        updateData.duration = service.duration;
      }
      if (service.single_per_hour !== undefined) {
        updateData.single_per_hour = service.single_per_hour;
      }

      const [affectedRows] = await Service.update(
        updateData,
        {
          where: {
            id: service.id,
          },
          transaction
        }
      );

      if (affectedRows === 0) {
        throw new Error('Service not found or no changes made');
      }
  
      const updatedService = await Service.findOne({
        where: {
          id: service.id
        },
        transaction
      });

      if (!updatedService) {
        throw new Error('Failed to retrieve updated service');
      }

      return updatedService;
    } catch (error) {
      console.error('Erro ao atualizar serviço no repositório:', error);
      throw error;
    }
  }
    
  async deleteService(id, transaction = null) {
    try {
      const result = await Service.destroy({
        where: {
          id: id,
        },
        transaction
      });

      if (result === 0) {
        throw new Error('Service not found');
      }

      return result > 0;
    } catch (error) {
      console.error('Erro ao deletar serviço no repositório:', error);
      throw error;
    }
  }

  async findServiceStatus(status, transaction = null) {
    try {
      const services = await Service.findAll({
        where: {
          status: status
        },
        transaction
      });

      return services || [];
    } catch (error) {
      console.error('Erro ao buscar serviços por status no repositório:', error);
      throw error;
    }
  }
}

module.exports = serviceRepository