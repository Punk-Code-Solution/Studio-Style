const SchedulesRepository = require('../repositories/schedules.repository');
const ServiceRepository = require('../repositories/service.repository');
const ResponseHandler = require('../utils/responseHandler');
const Schedules_Service = require('../repositories/schedules_service.repository');

class SchedulesController {

    constructor() {
        this.schedulesRepository = new SchedulesRepository();
        this.servicesRepository = new ServiceRepository();
        this.schedules_serviceRepository = new Schedules_Service();
    }

    /**
   * Create a new account
   */
  async createSchedules(req, res) {
    try {
      const schedules = req.body;
      
      // Validar dados obrigatórios
      if (!schedules.name_client || !schedules.date_and_houres || !schedules.provider_id_schedules || !schedules.client_id_schedules) {
        return ResponseHandler.error(res, 400, 'Dados obrigatórios não fornecidos');
      }

      // Validar se há serviços
      if (!schedules.services || !Array.isArray(schedules.services) || schedules.services.length === 0) {
        return ResponseHandler.error(res, 400, 'Pelo menos um serviço deve ser selecionado');
      }

      console.log('📋 Criando agendamento:', {
        cliente: schedules.name_client,
        data: schedules.date_and_houres,
        provider: schedules.provider_id_schedules,
        client: schedules.client_id_schedules,
        services: schedules.services
      });

      // Criar o agendamento
      const result = await this.schedulesRepository.addSchedules(schedules);

      if (!result) {
        return ResponseHandler.error(res, 400, 'Falha ao criar agendamento');
      }

      console.log('✅ Agendamento criado com ID:', result.dataValues.id);

      // Adicionar serviços ao agendamento
      const result_services = await this.schedules_serviceRepository.addSchedule_Service(result.dataValues.id, schedules.services);

      if (!result_services) {
        // Se falhou ao adicionar serviços, remover o agendamento criado
        await this.schedulesRepository.deleteSchedules(result.dataValues.id);
        return ResponseHandler.error(res, 400, 'Falha ao associar serviços ao agendamento');
      }

      console.log('✅ Serviços associados ao agendamento:', result_services.length);

      return ResponseHandler.success(res, 201, 'Agendamento criado com sucesso', {
        schedule: result,
        services: result_services
      });
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      return ResponseHandler.error(res, 500, 'Falha ao criar agendamento', error.message);
    }
  }

  /**
   * Get all accounts
   */
  async getAllSchedules(req, res) {
    try {
      const result = await this.schedulesRepository.findAll();
      return ResponseHandler.success(res, 200, 'Service retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve services', error);
    }
  }

  /**
   * Get account by ID
   */
  async getSchedulesById(req, res) {
    try {
      const { id } = req.params;
      const result = await this.schedulesRepository.findSchedules(id);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Service not found');
      }
      
      return ResponseHandler.success(res, 200, 'Service retrieved successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to retrieve services', error);
    }
  }

  /**
   * Update account
   */
  async updateSchedule(req, res) {
    try {
      const scheduleData = req.body;    
      
      const result = await this.schedulesRepository.updateSchedules(scheduleData);
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Service not found');
      }
      
      return ResponseHandler.success(res, 200, 'Service updated successfully', result);
    } catch (error) {
      console.log("error", error)
      return ResponseHandler.error(res, 500, 'Failed to update service', error);
    }
  }

  /**
   * Delete account by ID
   */
  async deleteScheduleById(req, res) {
    try {
      const { id } = req.query;
      const result = await this.schedulesRepository.deleteSchedules(id);
      console.log(result)
      
      if (!result) {
        return ResponseHandler.notFound(res, 'Service not found');
      }
      
      return ResponseHandler.success(res, 200, 'Service deleted successfully');
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to delete services', error);
    }
  }

}
module.exports = SchedulesController;