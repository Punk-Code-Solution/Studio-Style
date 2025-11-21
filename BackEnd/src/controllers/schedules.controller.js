const SchedulesRepository = require('../repositories/schedules.repository');
const ServiceRepository = require('../repositories/service.repository');
const ResponseHandler = require('../utils/responseHandler');
const Schedules_Service = require('../repositories/schedules_service.repository');
// ADICIONADO: Repositórios para criar novo cliente
const AccountRepository = require('../repositories/account.repository');
const TypeAccountRepository = require('../repositories/type_account.repository');

class SchedulesController {

    constructor() {
        this.schedulesRepository = new SchedulesRepository();
        this.servicesRepository = new ServiceRepository();
        this.schedules_serviceRepository = new Schedules_Service();
        // ADICIONADO: Instâncias dos repositórios
        this.accountRepository = new AccountRepository();
        this.typeAccountRepository = new TypeAccountRepository();
    }

    /**
   * Create a new schedule
   */
  async createSchedules(req, res) {
    try {
      const schedules = req.body;
      let clientId = schedules.client_id_schedules;

      // Validar dados obrigatórios
      if (!schedules.name_client || !schedules.date_and_houres || !schedules.provider_id_schedules) {
        return ResponseHandler.error(res, 400, 'Nome do cliente, data/hora e prestador são obrigatórios');
      }

      // Validar se há serviços
      if (!schedules.services || !Array.isArray(schedules.services) || schedules.services.length === 0) {
        return ResponseHandler.error(res, 400, 'Pelo menos um serviço deve ser selecionado');
      }

      // LÓGICA MODIFICADA (Ponto 2): Se client_id_schedules não for fornecido, crie um novo cliente
      if (!clientId) {

        // 1. Encontrar o TypeAccount 'client'
        const typeAccounts = await this.typeAccountRepository.findAll();
        const clientType = typeAccounts.find(t => t.type.toLowerCase() === 'client');

        if (!clientType) {
          return ResponseHandler.error(res, 500, 'Tipo de conta "client" não encontrado. Não é possível criar novo cliente.');
        }

        // 2. Criar a nova conta de cliente (campos mínimos)
        const [firstName, ...lastNameParts] = schedules.name_client.split(' ');
        const newClientData = {
          name: firstName,
          lastname: lastNameParts.join(' ') || 'Cliente',
          // Email, password e CPF são opcionais (Ponto 1)
          email: null, 
          password: null,
          cpf: null,
          typeaccount_id: clientType.id,
          deleted: false
        };

        const newAccount = await this.accountRepository.addAccount(newClientData);
        if (!newAccount) {
          return ResponseHandler.error(res, 500, 'Falha ao criar a nova conta de cliente');
        }

        clientId = newAccount.id; // Usar o ID do cliente recém-criado
        schedules.client_id_schedules = clientId; // Adicionar ao objeto schedules
      }

      // 3. Criar o agendamento
      const result = await this.schedulesRepository.addSchedules(schedules);

      if (!result) {
        return ResponseHandler.error(res, 400, 'Falha ao criar agendamento');
      }

      // 4. Adicionar serviços ao agendamento
      const result_services = await this.schedules_serviceRepository.addSchedule_Service(result.dataValues.id, schedules.services);

      if (!result_services) {
        // Se falhou ao adicionar serviços, remover o agendamento criado (rollback manual)
        await this.schedulesRepository.deleteSchedules(result.dataValues.id);
        return ResponseHandler.error(res, 400, 'Falha ao associar serviços ao agendamento');
      }

      return ResponseHandler.success(res, 201, 'Agendamento criado com sucesso', {
        schedule: result,
        services: result_services
      });
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Falha ao criar agendamento', error.message);
    }
  }

  /**
   * Get all accounts
   */
  async getAllSchedules(req, res) {
    try {
      const result = await this.schedulesRepository.findAll();
      return ResponseHandler.success(res, 200, 'Schedules retrieved successfully', result);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      // Log detalhado do erro para debug em produção
      console.error("Stack trace:", error.stack);
      const errorMessage = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      return ResponseHandler.error(res, 500, 'Failed to retrieve schedules', errorMessage);
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

      // LÓGICA ADICIONADA: Atualizar serviços se eles forem enviados
      if (scheduleData.services && Array.isArray(scheduleData.services) && scheduleData.services.length > 0) {
        const result_services = await this.schedules_serviceRepository.addSchedule_Service(scheduleData.id, scheduleData.services);
        if (!result_services) {
          console.warn(`⚠️ Agendamento ${scheduleData.id} atualizado, mas falha ao atualizar serviços.`);
        }
      }
      
      return ResponseHandler.success(res, 200, 'Service updated successfully', result);
    } catch (error) {
      return ResponseHandler.error(res, 500, 'Failed to update service', error);
    }
  }

  /**
   * Delete account by ID
   */
  async deleteScheduleById(req, res) {
    try {
      const { id } = req.query;

      // ADICIONADO: Deletar associações de serviço primeiro
      await this.schedules_serviceRepository.deleteSchedule_Service(id, null, true); // Deleta por schedule_id

      const result = await this.schedulesRepository.deleteSchedules(id);
      
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