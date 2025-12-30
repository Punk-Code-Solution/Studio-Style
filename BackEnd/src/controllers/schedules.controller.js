const SchedulesRepository = require('../repositories/schedules.repository');
const ServiceRepository = require('../repositories/service.repository');
const ResponseHandler = require('../utils/responseHandler');
const Schedules_Service = require('../repositories/schedules_service.repository');
// ADICIONADO: Repositórios para criar novo cliente
const AccountRepository = require('../repositories/account.repository');
const TypeAccountRepository = require('../repositories/type_account.repository');
const { sequelize } = require('../Database/models');

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
    const transaction = await sequelize.transaction();
    
    try {
      const schedules = req.body;
      let clientId = schedules.client_id_schedules;

      // Validar dados obrigatórios
      if (!schedules.name_client || !schedules.date_and_houres || !schedules.provider_id_schedules) {
        await transaction.rollback();
        return ResponseHandler.error(res, 400, 'Nome do cliente, data/hora e prestador são obrigatórios');
      }

      // Validar se há serviços
      if (!schedules.services || !Array.isArray(schedules.services) || schedules.services.length === 0) {
        await transaction.rollback();
        return ResponseHandler.error(res, 400, 'Pelo menos um serviço deve ser selecionado');
      }

      // Validar horário ocupado antes de criar agendamento
      const dateAndHours = new Date(schedules.date_and_houres);
      const hasConflict = await this.schedulesRepository.checkTimeConflict(
        dateAndHours, 
        schedules.provider_id_schedules,
        null, // Não é atualização, então não há scheduleId para excluir
        transaction
      );

      if (hasConflict) {
        await transaction.rollback();
        return ResponseHandler.error(res, 409, 'Horário já está ocupado para este prestador');
      }

      // LÓGICA MODIFICADA (Ponto 2): Se client_id_schedules não for fornecido, crie um novo cliente
      if (!clientId) {

        // 1. Encontrar o TypeAccount 'client'
        const typeAccounts = await this.typeAccountRepository.findAll();
        const clientType = typeAccounts.find(t => t.type.toLowerCase() === 'client');

        if (!clientType) {
          await transaction.rollback();
          return ResponseHandler.error(res, 500, 'Tipo de conta "client" não encontrado. Não é possível criar novo cliente.');
        }

        // 2. Criar a nova conta de cliente (campos mínimos) dentro da transação
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

        const newAccount = await this.accountRepository.addAccount(newClientData, transaction);
        if (!newAccount) {
          await transaction.rollback();
          return ResponseHandler.error(res, 500, 'Falha ao criar a nova conta de cliente');
        }

        clientId = newAccount.id; // Usar o ID do cliente recém-criado
        schedules.client_id_schedules = clientId; // Adicionar ao objeto schedules
      }

      // 3. Criar o agendamento dentro da transação
      const result = await this.schedulesRepository.addSchedules(schedules, transaction);

      if (!result) {
        await transaction.rollback();
        return ResponseHandler.error(res, 400, 'Falha ao criar agendamento');
      }

      // 4. Adicionar serviços ao agendamento dentro da transação
      const result_services = await this.schedules_serviceRepository.addSchedule_Service(
        result.dataValues.id, 
        schedules.services,
        transaction
      );

      if (!result_services) {
        // Rollback automático pela transação
        await transaction.rollback();
        return ResponseHandler.error(res, 400, 'Falha ao associar serviços ao agendamento');
      }

      // Commit da transação
      await transaction.commit();

      // 5. Emitir evento Socket.IO para atualizar Dashboard em tempo real (após commit)
      try {
        const { emitScheduleCreated } = require('../utils/socket.io');
        // Buscar o agendamento completo com relacionamentos para enviar no evento
        const fullSchedule = await this.schedulesRepository.findSchedules(result.dataValues.id);
        if (fullSchedule) {
          emitScheduleCreated(fullSchedule);
        }
      } catch (socketError) {
        // Não falhar a criação se o Socket.IO não estiver disponível
        console.warn('Erro ao emitir evento Socket.IO:', socketError.message);
      }

      return ResponseHandler.success(res, 201, 'Agendamento criado com sucesso', {
        schedule: result,
        services: result_services
      });
    } catch (error) {
      // Rollback em caso de erro
      await transaction.rollback();
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
      
      // Buscar o schedule antes de atualizar para verificar se finished mudou
      const oldSchedule = await this.schedulesRepository.findSchedules(scheduleData.id);
      const wasFinished = oldSchedule?.finished || false;
      const willBeFinished = scheduleData.finished === true;
      
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

      // LÓGICA ADICIONADA: Se o schedule foi marcado como finalizado, criar entrada financeira automaticamente
      if (!wasFinished && willBeFinished) {
        try {
          const { Schedules, Service } = require('../Database/models');
          const FinancialRepository = require('../repositories/financial.repository');
          const PaymentCalculationService = require('../services/payment-calculation.service');
          const financialRepo = new FinancialRepository();
          
          // Buscar o schedule atualizado com serviços
          const updatedSchedule = await Schedules.findByPk(scheduleData.id, {
            include: [{
              model: Service,
              as: 'Services',
              through: {
                attributes: []
              },
              attributes: ['id', 'service', 'price', 'commission_rate']
            }]
          });

          if (updatedSchedule && updatedSchedule.Services && updatedSchedule.Services.length > 0) {
            // Calcular valor total dos serviços
            let scheduleTotal = 0;
            for (const service of updatedSchedule.Services) {
              scheduleTotal += parseFloat(service.price) || 0;
            }

            if (scheduleTotal > 0) {
              // Determinar se deve aplicar taxa de gateway baseado no payment_method
              const applyGatewayFee = updatedSchedule.apply_gateway_fee === true || 
                                     (updatedSchedule.payment_method === 'CARD' && updatedSchedule.apply_gateway_fee !== false);

              // Calcular divisão
              const calculation = await PaymentCalculationService.calculateServiceSplit({
                grossAmount: Math.round(scheduleTotal * 100),
                serviceId: updatedSchedule.Services[0]?.id,
                professionalId: updatedSchedule.provider_id_schedules
              });

              // Se não deve aplicar taxa de gateway, remover do cálculo
              if (!applyGatewayFee) {
                // Recalcular sem gateway fee
                const gatewayFeeAmount = calculation.operationalCosts.gatewayFee;
                calculation.salonNetAmount += gatewayFeeAmount;
                calculation.operationalCosts.gatewayFee = 0;
                calculation.operationalCosts.total -= gatewayFeeAmount;
              }

              // Criar entradas financeiras automaticamente
              const toCents = (value) => Math.round((value || 0) * 100);
              const entries = [];

              // 1. Entrada: Valor líquido do salão
              entries.push({
                transactionType: 'INCOME',
                category: 'SERVICE_PAYMENT',
                amount: calculation.salonNetAmount,
                description: `Pagamento de serviço - Parte do Salão`,
                referenceId: updatedSchedule.id,
                referenceType: 'Schedule',
                scheduleId: updatedSchedule.id,
                metadata: { calculationResult: calculation },
                createdBy: req.user?.id || null
              });

              // 2. Saída: Comissão do profissional
              entries.push({
                transactionType: 'EXPENSE',
                category: 'COMMISSION_PAYMENT',
                amount: calculation.professionalNetAmount,
                description: `Comissão do profissional`,
                referenceId: updatedSchedule.id,
                referenceType: 'Schedule',
                scheduleId: updatedSchedule.id,
                metadata: { calculationResult: calculation },
                createdBy: req.user?.id || null
              });

              // 3. Saída: Taxa do gateway (se aplicável)
              if (calculation.operationalCosts.gatewayFee > 0) {
                entries.push({
                  transactionType: 'EXPENSE',
                  category: 'GATEWAY_FEE',
                  amount: calculation.operationalCosts.gatewayFee,
                  description: `Taxa do gateway de pagamento`,
                  referenceId: updatedSchedule.id,
                  referenceType: 'Schedule',
                  scheduleId: updatedSchedule.id,
                  metadata: { calculationResult: calculation },
                  createdBy: req.user?.id || null
                });
              }

              // 4. Saída: Impostos
              if (calculation.taxes.totalTax > 0) {
                entries.push({
                  transactionType: 'EXPENSE',
                  category: 'TAX_PAYMENT',
                  amount: calculation.taxes.totalTax,
                  description: `Impostos retidos`,
                  referenceId: updatedSchedule.id,
                  referenceType: 'Schedule',
                  scheduleId: updatedSchedule.id,
                  metadata: { calculationResult: calculation },
                  createdBy: req.user?.id || null
                });
              }

              // 5. Saída: Custo de produtos
              if (calculation.operationalCosts.productCost > 0) {
                entries.push({
                  transactionType: 'EXPENSE',
                  category: 'PRODUCT_COST',
                  amount: calculation.operationalCosts.productCost,
                  description: `Custo de produtos consumidos`,
                  referenceId: updatedSchedule.id,
                  referenceType: 'Schedule',
                  scheduleId: updatedSchedule.id,
                  metadata: { calculationResult: calculation },
                  createdBy: req.user?.id || null
                });
              }

              // Criar todas as entradas
              await Promise.all(
                entries.map(entry => financialRepo.createLedgerEntry(entry))
              );

              console.log(`[Schedules] Entrada financeira criada automaticamente para schedule ${updatedSchedule.id}`);
            }
          }
        } catch (error) {
          console.error(`[Schedules] Erro ao criar entrada financeira automaticamente:`, error);
          // Não falha a atualização do schedule se houver erro ao criar entrada financeira
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