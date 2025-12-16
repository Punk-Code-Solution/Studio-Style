const FinancialRepository = require('../repositories/financial.repository');
const PaymentCalculationService = require('../services/payment-calculation.service');
const { FinancialLedger, Expense, Schedules, Service, Account } = require('../Database/models');
const { Op } = require('sequelize');

class FinancialController {
  constructor() {
    this.financialRepo = new FinancialRepository();
  }

  /**
   * Calcula divisão de pagamento de um serviço
   */
  async calculateServiceSplit(req, res) {
    try {
      const { grossAmount, serviceId, professionalId, productCost } = req.body;

      if (!grossAmount) {
        return res.status(400).json({
          success: false,
          message: 'grossAmount é obrigatório'
        });
      }

      const result = await PaymentCalculationService.calculateServiceSplit({
        grossAmount: Math.round(grossAmount * 100), // Converte para centavos
        serviceId,
        professionalId,
        productCost: productCost ? Math.round(productCost * 100) : 0
      });

      // Converte de volta para reais para resposta
      const formattedResult = this._formatToReais(result);

      return res.status(200).json({
        success: true,
        data: formattedResult
      });
    } catch (error) {
      console.error('Erro ao calcular divisão:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao calcular divisão de pagamento'
      });
    }
  }

  /**
   * Registra pagamento de serviço no livro razão
   */
  async recordServicePayment(req, res) {
    try {
      const { scheduleId, calculationResult, createdBy } = req.body;

      if (!scheduleId || !calculationResult) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos para registro de pagamento'
        });
      }

      // Garante que o schedule existe e está marcado como finalizado
      const schedule = await Schedules.findByPk(scheduleId);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado para registrar pagamento'
        });
      }

      // Se ainda não estiver finalizado, marcamos como finalizado
      if (!schedule.finished) {
        await schedule.update({ finished: true });
      }

      // Valores recebidos do front estão em REAIS, precisamos converter para centavos
      const toCents = (value) => Math.round((value || 0) * 100);

      const entries = [];

      // 1. Entrada: Valor líquido do salão
      entries.push({
        transactionType: 'INCOME',
        category: 'SERVICE_PAYMENT',
        amount: toCents(calculationResult.salonNetAmount),
        description: `Pagamento de serviço - Parte do Salão`,
        referenceId: scheduleId,
        referenceType: 'Schedule',
        scheduleId,
        metadata: { calculationResult },
        createdBy
      });

      // 2. Saída: Comissão do profissional
      entries.push({
        transactionType: 'EXPENSE',
        category: 'COMMISSION_PAYMENT',
        amount: toCents(calculationResult.professionalNetAmount),
        description: `Comissão do profissional`,
        referenceId: scheduleId,
        referenceType: 'Schedule',
        scheduleId,
        metadata: { calculationResult },
        createdBy
      });

      // 3. Saída: Taxa do gateway
      entries.push({
        transactionType: 'EXPENSE',
        category: 'GATEWAY_FEE',
        amount: toCents(calculationResult.operationalCosts.gatewayFee),
        description: `Taxa do gateway de pagamento`,
        referenceId: scheduleId,
        referenceType: 'Schedule',
        scheduleId,
        metadata: { calculationResult },
        createdBy
      });

      // 4. Saída: Impostos
      if (calculationResult.taxes.totalTax > 0) {
        entries.push({
          transactionType: 'EXPENSE',
          category: 'TAX_PAYMENT',
          amount: toCents(calculationResult.taxes.totalTax),
          description: `Impostos retidos`,
          referenceId: scheduleId,
          referenceType: 'Schedule',
          scheduleId,
          metadata: { calculationResult },
          createdBy
        });
      }

      // 5. Saída: Custo de produtos
      if (calculationResult.operationalCosts.productCost > 0) {
        entries.push({
          transactionType: 'EXPENSE',
          category: 'PRODUCT_COST',
          amount: toCents(calculationResult.operationalCosts.productCost),
          description: `Custo de produtos consumidos`,
          referenceId: scheduleId,
          referenceType: 'Schedule',
          scheduleId,
          metadata: { calculationResult },
          createdBy
        });
      }

      // Cria todas as entradas
      const createdEntries = await Promise.all(
        entries.map(entry => this.financialRepo.createLedgerEntry(entry))
      );

      return res.status(201).json({
        success: true,
        message: 'Pagamento registrado com sucesso',
        data: {
          entries: createdEntries.length,
          ledgerEntries: createdEntries
        }
      });
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao registrar pagamento'
      });
    }
  }

  /**
   * Busca entradas do livro razão
   * Inclui schedules finalizados que ainda não têm entrada registrada
   */
  async getLedgerEntries(req, res) {
    try {
      const { startDate, endDate, transactionType, category, limit, offset } = req.query;

      // Buscar entradas existentes do livro razão
      const entries = await this.financialRepo.findLedgerEntries({
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        transactionType,
        category,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      });

      // Buscar schedules finalizados que ainda não têm entrada de receita registrada
      const dateFilter = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date_and_houres = {
          [Op.between]: [start, end]
        };
      } else if (startDate) {
        const start = new Date(startDate);
        dateFilter.date_and_houres = {
          [Op.gte]: start
        };
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date_and_houres = {
          [Op.lte]: end
        };
      }

      const finishedSchedules = await Schedules.findAll({
        where: {
          ...dateFilter,
          finished: true
        },
        include: [{
          model: Service,
          as: 'Services',
          through: {
            attributes: []
          },
          attributes: ['id', 'service', 'price', 'commission_rate'],
          required: false
        }]
      });

      // Verificar quais schedules finalizados não têm entrada de receita
      const scheduleIdsWithIncome = new Set(
        entries
          .filter(e => e.transaction_type === 'INCOME' && e.category === 'SERVICE_PAYMENT' && e.schedule_id)
          .map(e => e.schedule_id)
      );

      // Criar entradas virtuais para schedules finalizados sem entrada
      const virtualEntries = [];
      for (const schedule of finishedSchedules) {
        if (!scheduleIdsWithIncome.has(schedule.id) && schedule.Services && schedule.Services.length > 0) {
          // Calcular valor total dos serviços
          let scheduleTotal = 0;
          for (const service of schedule.Services) {
            scheduleTotal += parseFloat(service.price) || 0;
          }

          if (scheduleTotal > 0) {
            try {
              // Calcular divisão usando o serviço de cálculo
              const calculation = await PaymentCalculationService.calculateServiceSplit({
                grossAmount: Math.round(scheduleTotal * 100),
                serviceId: schedule.Services[0]?.id,
                professionalId: schedule.provider_id_schedules
              });

              // Criar entrada virtual de receita
              virtualEntries.push({
                id: `virtual-income-${schedule.id}`,
                transaction_type: 'INCOME',
                category: 'SERVICE_PAYMENT',
                amount: calculation.salonNetAmount, // Já em centavos
                description: `Pagamento de serviço - Parte do Salão (Agendamento finalizado)`,
                reference_id: schedule.id,
                reference_type: 'Schedule',
                schedule_id: schedule.id,
                transaction_date: schedule.date_and_houres || new Date(),
                schedule: schedule, // Incluir o schedule completo
                isVirtual: true // Flag para indicar que é uma entrada virtual
              });

              // Criar entradas virtuais de despesas
              // Comissão do profissional
              virtualEntries.push({
                id: `virtual-expense-commission-${schedule.id}`,
                transaction_type: 'EXPENSE',
                category: 'COMMISSION_PAYMENT',
                amount: calculation.professionalNetAmount, // Já em centavos
                description: `Comissão do profissional (Agendamento finalizado)`,
                reference_id: schedule.id,
                reference_type: 'Schedule',
                schedule_id: schedule.id,
                transaction_date: schedule.date_and_houres || new Date(),
                schedule: schedule,
                isVirtual: true
              });

              // Taxa do gateway
              // calculation.operationalCosts.gatewayFee já está em centavos (retornado por _toCents)
              if (calculation.operationalCosts.gatewayFee > 0) {
                virtualEntries.push({
                  id: `virtual-expense-gateway-${schedule.id}`,
                  transaction_type: 'EXPENSE',
                  category: 'GATEWAY_FEE',
                  amount: Math.round(calculation.operationalCosts.gatewayFee), // Já em centavos
                  description: `Taxa do gateway de pagamento (Agendamento finalizado)`,
                  reference_id: schedule.id,
                  reference_type: 'Schedule',
                  schedule_id: schedule.id,
                  transaction_date: schedule.date_and_houres || new Date(),
                  schedule: schedule,
                  isVirtual: true
                });
              }

              // Impostos
              // calculation.taxes.totalTax já está em centavos (retornado por _toCents)
              if (calculation.taxes.totalTax > 0) {
                virtualEntries.push({
                  id: `virtual-expense-tax-${schedule.id}`,
                  transaction_type: 'EXPENSE',
                  category: 'TAX_PAYMENT',
                  amount: Math.round(calculation.taxes.totalTax), // Já em centavos
                  description: `Impostos retidos (Agendamento finalizado)`,
                  reference_id: schedule.id,
                  reference_type: 'Schedule',
                  schedule_id: schedule.id,
                  transaction_date: schedule.date_and_houres || new Date(),
                  schedule: schedule,
                  isVirtual: true
                });
              }

              // Custo de produtos
              // calculation.operationalCosts.productCost já está em centavos (retornado por _toCents)
              if (calculation.operationalCosts.productCost > 0) {
                virtualEntries.push({
                  id: `virtual-expense-product-${schedule.id}`,
                  transaction_type: 'EXPENSE',
                  category: 'PRODUCT_COST',
                  amount: Math.round(calculation.operationalCosts.productCost), // Já em centavos
                  description: `Custo de produtos consumidos (Agendamento finalizado)`,
                  reference_id: schedule.id,
                  reference_type: 'Schedule',
                  schedule_id: schedule.id,
                  transaction_date: schedule.date_and_houres || new Date(),
                  schedule: schedule,
                  isVirtual: true
                });
              }
            } catch (error) {
              console.error(`[Financial] Erro ao calcular para schedule ${schedule.id}:`, error);
              // Fallback: usar comissão padrão da empresa ou comissão do serviço
              try {
                const companySettings = await this.financialRepo.getCompanySettings();
                const serviceCommissionRate = schedule.Services[0]?.commission_rate;
                const estimatedCommissionRate = serviceCommissionRate || companySettings.default_commission_rate || 0.5;
                const estimatedNet = Math.round(scheduleTotal * (1 - estimatedCommissionRate) * 100);
                const estimatedCommission = Math.round(scheduleTotal * estimatedCommissionRate * 100);
                
                virtualEntries.push({
                  id: `virtual-income-${schedule.id}`,
                  transaction_type: 'INCOME',
                  category: 'SERVICE_PAYMENT',
                  amount: estimatedNet,
                  description: `Pagamento de serviço - Parte do Salão (Agendamento finalizado - estimado)`,
                  reference_id: schedule.id,
                  reference_type: 'Schedule',
                  schedule_id: schedule.id,
                  transaction_date: schedule.date_and_houres || new Date(),
                  schedule: schedule,
                  isVirtual: true
                });
                // Despesa estimada (comissão)
                virtualEntries.push({
                  id: `virtual-expense-commission-${schedule.id}`,
                  transaction_type: 'EXPENSE',
                  category: 'COMMISSION_PAYMENT',
                  amount: estimatedCommission,
                  description: `Comissão do profissional (Agendamento finalizado - estimado)`,
                  reference_id: schedule.id,
                  reference_type: 'Schedule',
                  schedule_id: schedule.id,
                  transaction_date: schedule.date_and_houres || new Date(),
                  schedule: schedule,
                  isVirtual: true
                });
              } catch (fallbackError) {
                console.error(`[Financial] Erro ao buscar configurações para fallback:`, fallbackError);
                // Último recurso: 50% receita, 50% despesa
                const estimatedNet = Math.round(scheduleTotal * 0.5 * 100);
                virtualEntries.push({
                  id: `virtual-income-${schedule.id}`,
                  transaction_type: 'INCOME',
                  category: 'SERVICE_PAYMENT',
                  amount: estimatedNet,
                  description: `Pagamento de serviço - Parte do Salão (Agendamento finalizado - estimado)`,
                  reference_id: schedule.id,
                  reference_type: 'Schedule',
                  schedule_id: schedule.id,
                  transaction_date: schedule.date_and_houres || new Date(),
                  schedule: schedule,
                  isVirtual: true
                });
                virtualEntries.push({
                  id: `virtual-expense-commission-${schedule.id}`,
                  transaction_type: 'EXPENSE',
                  category: 'COMMISSION_PAYMENT',
                  amount: estimatedNet,
                  description: `Comissão do profissional (Agendamento finalizado - estimado)`,
                  reference_id: schedule.id,
                  reference_type: 'Schedule',
                  schedule_id: schedule.id,
                  transaction_date: schedule.date_and_houres || new Date(),
                  schedule: schedule,
                  isVirtual: true
                });
              }
            }
          }
        }
      }

      // Aplicar filtros de transactionType e category nas entradas virtuais
      let filteredVirtualEntries = virtualEntries;
      
      if (transactionType) {
        filteredVirtualEntries = filteredVirtualEntries.filter(
          entry => entry.transaction_type === transactionType
        );
      }
      
      if (category) {
        filteredVirtualEntries = filteredVirtualEntries.filter(
          entry => entry.category === category
        );
      }

      // Combinar entradas reais com entradas virtuais filtradas
      const allEntries = [...entries, ...filteredVirtualEntries];

      // Ordenar por data (mais recente primeiro)
      allEntries.sort((a, b) => {
        const dateA = new Date(a.transaction_date || a.transactionDate);
        const dateB = new Date(b.transaction_date || b.transactionDate);
        return dateB - dateA;
      });

      // Aplicar limite e offset após combinar
      const paginatedEntries = allEntries.slice(
        offset ? parseInt(offset) : 0,
        (offset ? parseInt(offset) : 0) + (limit ? parseInt(limit) : 100)
      );

      return res.status(200).json({
        success: true,
        data: paginatedEntries,
        meta: {
          total: allEntries.length,
          virtualCount: virtualEntries.length,
          realCount: entries.length
        }
      });
    } catch (error) {
      console.error('[Financial] Erro ao buscar entradas:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar entradas do livro razão'
      });
    }
  }

  /**
   * Busca uma entrada específica por ID
   */
  async getLedgerEntry(req, res) {
    try {
      const { id } = req.params;
      const entry = await this.financialRepo.findLedgerEntryById(id);

      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Entrada não encontrada'
        });
      }

      return res.status(200).json({
        success: true,
        data: entry
      });
    } catch (error) {
      console.error('Erro ao buscar entrada:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar entrada'
      });
    }
  }

  /**
   * Cria uma entrada manual no livro razão
   */
  async createLedgerEntry(req, res) {
    try {
      const { transactionType, category, amount, description, transactionDate, metadata, createdBy } = req.body;

      if (!transactionType || !category || !amount) {
        return res.status(400).json({
          success: false,
          message: 'transactionType, category e amount são obrigatórios'
        });
      }

      // Usar o ID do usuário autenticado se createdBy não for fornecido
      const userId = createdBy || req.user?.id || null;

      const entry = await this.financialRepo.createLedgerEntry({
        transactionType,
        category,
        amount: Math.round(amount * 100), // Converte para centavos
        description,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        metadata,
        createdBy: userId
      });

      return res.status(201).json({
        success: true,
        message: 'Entrada criada com sucesso',
        data: entry
      });
    } catch (error) {
      console.error('Erro ao criar entrada:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar entrada'
      });
    }
  }

  /**
   * Atualiza uma entrada do livro razão
   */
  async updateLedgerEntry(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se é uma entrada virtual (não pode ser editada)
      if (id && (id.startsWith('virtual-income-') || id.startsWith('virtual-expense-'))) {
        return res.status(400).json({
          success: false,
          message: 'Entradas virtuais não podem ser editadas. Elas são geradas automaticamente a partir de agendamentos finalizados.'
        });
      }

      const { transactionType, category, amount, description, transactionDate, metadata } = req.body;

      const entry = await this.financialRepo.updateLedgerEntry(id, {
        transactionType,
        category,
        amount: amount ? Math.round(amount * 100) : undefined, // Converte para centavos
        description,
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        metadata
      });

      return res.status(200).json({
        success: true,
        message: 'Entrada atualizada com sucesso',
        data: entry
      });
    } catch (error) {
      console.error('Erro ao atualizar entrada:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar entrada'
      });
    }
  }

  /**
   * Deleta uma entrada do livro razão
   */
  async deleteLedgerEntry(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se é uma entrada virtual (não pode ser deletada)
      if (id && (id.startsWith('virtual-income-') || id.startsWith('virtual-expense-'))) {
        return res.status(400).json({
          success: false,
          message: 'Entradas virtuais não podem ser deletadas. Elas são geradas automaticamente a partir de agendamentos finalizados.'
        });
      }
      
      await this.financialRepo.deleteLedgerEntry(id);

      return res.status(200).json({
        success: true,
        message: 'Entrada deletada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar entrada:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao deletar entrada'
      });
    }
  }

  /**
   * Calcula totais financeiros (para DRE)
   * Inclui entradas virtuais de schedules finalizados sem entrada registrada
   */
  async getFinancialTotals(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Buscar totais das entradas reais do livro razão
      const totals = await this.financialRepo.calculateTotals(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      // Buscar schedules finalizados sem entrada de receita para adicionar aos totais
      const dateFilter = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date_and_houres = {
          [Op.between]: [start, end]
        };
      }

      const finishedSchedules = await Schedules.findAll({
        where: {
          ...dateFilter,
          finished: true
        },
        include: [{
          model: Service,
          as: 'Services',
          through: {
            attributes: []
          },
          attributes: ['id', 'service', 'price', 'commission_rate'],
          required: false
        }]
      });

      // Verificar quais schedules finalizados não têm entrada de receita
      const scheduleIdsWithIncome = await FinancialLedger.findAll({
        where: {
          transaction_type: 'INCOME',
          category: 'SERVICE_PAYMENT',
          schedule_id: {
            [Op.not]: null
          },
          ...(startDate && endDate ? {
            transaction_date: {
              [Op.between]: [new Date(startDate), new Date(endDate)]
            }
          } : {})
        },
        attributes: ['schedule_id'],
        raw: true
      });

      const scheduleIdsWithIncomeSet = new Set(
        scheduleIdsWithIncome.map(e => e.schedule_id).filter(Boolean)
      );

      // Calcular totais adicionais de schedules finalizados sem entrada
      let additionalIncome = 0;
      let additionalExpenses = 0;

      for (const schedule of finishedSchedules) {
        if (!scheduleIdsWithIncomeSet.has(schedule.id) && schedule.Services && schedule.Services.length > 0) {
          let scheduleTotal = 0;
          for (const service of schedule.Services) {
            scheduleTotal += parseFloat(service.price) || 0;
          }

          if (scheduleTotal > 0) {
            try {
              const calculation = await PaymentCalculationService.calculateServiceSplit({
                grossAmount: Math.round(scheduleTotal * 100),
                serviceId: schedule.Services[0]?.id,
                professionalId: schedule.provider_id_schedules
              });

              // Adicionar receita líquida do salão
              // calculation.salonNetAmount já está em centavos
              additionalIncome += calculation.salonNetAmount;
              
              // Adicionar despesas (comissão, taxas, impostos, etc.)
              // Todos os valores já estão em centavos (retornados por _toCents)
              additionalExpenses += calculation.professionalNetAmount; // Comissão (já em centavos)
              additionalExpenses += Math.round(calculation.operationalCosts.gatewayFee); // Taxa gateway (já em centavos)
              if (calculation.taxes.totalTax > 0) {
                additionalExpenses += Math.round(calculation.taxes.totalTax); // Impostos (já em centavos)
              }
              if (calculation.operationalCosts.productCost > 0) {
                additionalExpenses += Math.round(calculation.operationalCosts.productCost); // Custo produtos (já em centavos)
              }
            } catch (error) {
              console.error(`[Financial] Erro ao calcular totais para schedule ${schedule.id}:`, error);
              // Fallback: usar comissão padrão da empresa ou 50% se não disponível
              try {
                const companySettings = await this.financialRepo.getCompanySettings();
                const estimatedCommissionRate = companySettings.default_commission_rate || 0.5;
                const estimatedNet = Math.round(scheduleTotal * (1 - estimatedCommissionRate) * 100);
                const estimatedCommission = Math.round(scheduleTotal * estimatedCommissionRate * 100);
                additionalIncome += estimatedNet;
                additionalExpenses += estimatedCommission;
              } catch (fallbackError) {
                console.error(`[Financial] Erro ao buscar configurações para fallback:`, fallbackError);
                // Último recurso: 50% receita, 50% despesa
                const estimatedNet = Math.round(scheduleTotal * 0.5 * 100);
                additionalIncome += estimatedNet;
                additionalExpenses += estimatedNet;
              }
            }
          }
        }
      }

      // Somar totais reais com totais virtuais
      const totalIncome = (totals.totalIncome || 0) + additionalIncome;
      const totalExpenses = (totals.totalExpenses || 0) + additionalExpenses;
      const netProfit = totalIncome - totalExpenses;

      // Converte para reais
      const formattedTotals = {
        totalIncome: totalIncome / 100,
        totalExpenses: totalExpenses / 100,
        netProfit: netProfit / 100
      };

      console.log(`[Financial] Totais calculados - Receita: R$ ${formattedTotals.totalIncome.toFixed(2)}, Despesas: R$ ${formattedTotals.totalExpenses.toFixed(2)}, Lucro: R$ ${formattedTotals.netProfit.toFixed(2)}`);
      console.log(`[Financial] Entradas virtuais adicionadas - Receita: R$ ${(additionalIncome / 100).toFixed(2)}, Despesas: R$ ${(additionalExpenses / 100).toFixed(2)}`);

      return res.status(200).json({
        success: true,
        data: formattedTotals
      });
    } catch (error) {
      console.error('[Financial] Erro ao calcular totais financeiros:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao calcular totais financeiros'
      });
    }
  }

  /**
   * Resumo de comissões pagas por colaborador (para gráficos)
   * Inclui comissões de agendamentos finalizados mesmo sem entrada registrada
   */
  async getCommissionSummary(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const userRole = req.user?.role?.toLowerCase();
      const userId = req.user?.id;

      console.log(`[Financial] Buscando resumo de comissões - startDate: ${startDate}, endDate: ${endDate}, userRole: ${userRole}, userId: ${userId}`);

      const where = {
        transaction_type: 'EXPENSE',
        category: 'COMMISSION_PAYMENT'
      };

      const dateFilter = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.transaction_date = {
          [Op.between]: [start, end]
        };
        dateFilter.date_and_houres = {
          [Op.between]: [start, end]
        };
        console.log(`[Financial] Filtro de data aplicado para comissões`);
      } else {
        console.log(`[Financial] Sem filtro de data - buscando todas as comissões`);
      }

      // Se for provider, filtrar apenas suas comissões
      let providerFilter = {};
      if (userRole === 'provider' && userId) {
        providerFilter.provider_id_schedules = userId;
        console.log(`[Financial] Filtrando comissões apenas para o provider: ${userId}`);
      }

      // Buscar entradas de comissão do livro razão
      // Se for provider, filtrar apenas entradas relacionadas a seus schedules
      const scheduleInclude = {
        model: Schedules,
        as: 'schedule',
        required: false,
        include: [{
          model: Account,
          as: 'provider',
          required: false,
          attributes: ['id', 'name', 'lastname']
        }]
      };

      // Se for provider, adicionar filtro no where do schedule
      if (providerFilter.provider_id_schedules) {
        scheduleInclude.where = { provider_id_schedules: providerFilter.provider_id_schedules };
      }

      const entries = await FinancialLedger.findAll({
        where,
        include: [scheduleInclude]
      });

      console.log(`[Financial] Entradas de comissão do livro razão: ${entries.length}`);

      // Buscar schedules finalizados para calcular comissões não registradas
      const finishedSchedules = await Schedules.findAll({
        where: {
          ...dateFilter,
          finished: true
        },
        include: [{
          model: Service,
          as: 'Services',
          through: {
            attributes: []
          },
          attributes: ['id', 'service', 'price', 'commission_rate'],
          required: false
        }, {
          model: Account,
          as: 'provider',
          required: false,
          attributes: ['id', 'name', 'lastname']
        }]
      });

      console.log(`[Financial] Schedules finalizados encontrados: ${finishedSchedules.length}`);

      // Verificar quais schedules têm entrada de comissão registrada
      const scheduleIdsWithCommission = new Set(
        entries
          .filter(e => e.schedule_id)
          .map(e => e.schedule_id)
      );

      // Agrupa por colaborador (provider)
      const summaryMap = {};

      // Processar entradas do livro razão
      for (const entry of entries) {
        const schedule = entry.schedule;
        let providerId = null;
        let fullName = 'Colaborador Desconhecido';

        if (schedule && schedule.provider) {
          providerId = schedule.provider.id;
          fullName = [schedule.provider.name, schedule.provider.lastname].filter(Boolean).join(' ') || 'Colaborador';
        } else if (schedule && schedule.provider_id_schedules) {
          providerId = schedule.provider_id_schedules;
          try {
            const provider = await Account.findByPk(providerId);
            if (provider) {
              fullName = [provider.name, provider.lastname].filter(Boolean).join(' ') || 'Colaborador';
            }
          } catch (err) {
            console.warn(`[Financial] Erro ao buscar provider ${providerId}:`, err);
          }
        } else if (entry.metadata && entry.metadata.calculationResult && entry.metadata.calculationResult.professionalId) {
          providerId = entry.metadata.calculationResult.professionalId;
          try {
            const provider = await Account.findByPk(providerId);
            if (provider) {
              fullName = [provider.name, provider.lastname].filter(Boolean).join(' ') || 'Colaborador';
            }
          } catch (err) {
            console.warn(`[Financial] Erro ao buscar provider do metadata ${providerId}:`, err);
          }
        }

        // Se for provider, filtrar apenas suas próprias comissões
        if (userRole === 'provider' && userId && providerId !== userId) {
          continue; // Pular esta entrada se não for do provider logado
        }

        if (providerId) {
          if (!summaryMap[providerId]) {
            summaryMap[providerId] = {
              professionalId: providerId,
              professionalName: fullName,
              totalCommission: 0
            };
          }
          // entry.amount já está em centavos no banco de dados
          summaryMap[providerId].totalCommission += (entry.amount || 0);
        }
      }

      // Processar schedules finalizados sem entrada de comissão
      for (const schedule of finishedSchedules) {
        // Se for provider, filtrar apenas seus próprios schedules
        if (userRole === 'provider' && userId && schedule.provider_id_schedules !== userId) {
          continue; // Pular este schedule se não for do provider logado
        }

        if (!scheduleIdsWithCommission.has(schedule.id) && schedule.Services && schedule.Services.length > 0 && schedule.provider) {
          let scheduleTotal = 0;
          for (const service of schedule.Services) {
            scheduleTotal += parseFloat(service.price) || 0;
          }

          if (scheduleTotal > 0) {
            try {
              const calculation = await PaymentCalculationService.calculateServiceSplit({
                grossAmount: Math.round(scheduleTotal * 100),
                serviceId: schedule.Services[0]?.id,
                professionalId: schedule.provider_id_schedules
              });

              const providerId = schedule.provider.id;
              const fullName = [schedule.provider.name, schedule.provider.lastname].filter(Boolean).join(' ') || 'Colaborador';

              if (!summaryMap[providerId]) {
                summaryMap[providerId] = {
                  professionalId: providerId,
                  professionalName: fullName,
                  totalCommission: 0
                };
              }

              // Adicionar comissão calculada (já em centavos)
              summaryMap[providerId].totalCommission += calculation.professionalNetAmount;
            } catch (error) {
              console.error(`[Financial] Erro ao calcular comissão para schedule ${schedule.id}:`, error);
            }
          }
        }
      }

      const summary = Object.values(summaryMap);
      console.log(`[Financial] Resumo de comissões gerado: ${summary.length} colaboradores`);
      summary.forEach(item => {
        console.log(`[Financial]   ${item.professionalName}: R$ ${(item.totalCommission / 100).toFixed(2)}`);
      });

      return res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('[Financial] Erro ao gerar resumo de comissões:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao gerar resumo de comissões'
      });
    }
  }

  /**
   * Busca/Atualiza configurações financeiras globais
   */
  async getCompanySettings(req, res) {
    try {
      const settings = await this.financialRepo.getCompanySettings();

      return res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar configurações financeiras'
      });
    }
  }

  async updateCompanySettings(req, res) {
    try {
      const settings = await this.financialRepo.updateCompanySettings(req.body);

      return res.status(200).json({
        success: true,
        message: 'Configurações atualizadas com sucesso',
        data: settings
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar configurações financeiras'
      });
    }
  }

  /**
   * Gerencia regras de comissão
   */
  async createCommissionRule(req, res) {
    try {
      const rule = await this.financialRepo.createCommissionRule(req.body);

      return res.status(201).json({
        success: true,
        message: 'Regra de comissão criada com sucesso',
        data: rule
      });
    } catch (error) {
      console.error('Erro ao criar regra:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar regra de comissão'
      });
    }
  }

  async getCommissionRules(req, res) {
    try {
      const rules = await this.financialRepo.findCommissionRules(req.query);

      return res.status(200).json({
        success: true,
        data: rules
      });
    } catch (error) {
      console.error('Erro ao buscar regras:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar regras de comissão'
      });
    }
  }

  /**
   * Gerencia despesas
   */
  async createExpense(req, res) {
    try {
      const expenseData = {
        ...req.body,
        amount: Math.round(req.body.amount * 100) // Converte para centavos
      };

      const expense = await this.financialRepo.createExpense(expenseData);

      // Registra no livro razão
      await this.financialRepo.createLedgerEntry({
        transactionType: 'EXPENSE',
        category: expenseData.expense_type === 'FIXED' ? 'FIXED_EXPENSE' : 'VARIABLE_EXPENSE',
        amount: expenseData.amount,
        description: expenseData.description || expenseData.category,
        referenceId: expense.id,
        referenceType: 'Expense',
        expenseId: expense.id,
        createdBy: expenseData.created_by
      });

      return res.status(201).json({
        success: true,
        message: 'Despesa criada com sucesso',
        data: expense
      });
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar despesa'
      });
    }
  }

  async getExpenses(req, res) {
    try {
      const expenses = await this.financialRepo.findExpenses(req.query);

      return res.status(200).json({
        success: true,
        data: expenses
      });
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar despesas'
      });
    }
  }

  /**
   * Busca valores de schedules finalizados e agendados
   */
  async getScheduleFinancialData(req, res) {
    try {
      const { startDate, endDate } = req.query;

      console.log(`[Financial] Buscando dados de schedules - startDate: ${startDate}, endDate: ${endDate}`);

      // Buscar configurações para cálculo
      const companySettings = await this.financialRepo.getCompanySettings();

      // Filtros de data
      const dateFilter = {};
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Adicionar um dia ao final para incluir o dia inteiro
        end.setHours(23, 59, 59, 999);
        dateFilter.date_and_houres = {
          [Op.between]: [start, end]
        };
        console.log(`[Financial] Filtro de data aplicado: ${start.toISOString()} até ${end.toISOString()}`);
      } else {
        console.log(`[Financial] Sem filtro de data - buscando todos os agendamentos`);
      }

      // Verificar quantos agendamentos existem no total (para debug)
      const allSchedulesCount = await Schedules.count({
        where: dateFilter
      });
      const finishedCount = await Schedules.count({
        where: {
          ...dateFilter,
          finished: true
        }
      });
      const finishedWithServicesCount = await Schedules.count({
        where: {
          ...dateFilter,
          finished: true
        },
        include: [{
          model: Service,
          as: 'Services',
          through: {
            attributes: []
          },
          required: true // INNER JOIN - apenas schedules com serviços
        }]
      });

      console.log(`[Financial] Total de agendamentos (com filtro de data): ${allSchedulesCount}`);
      console.log(`[Financial] Agendamentos finalizados: ${finishedCount}`);
      console.log(`[Financial] Agendamentos finalizados COM serviços: ${finishedWithServicesCount}`);

      // 1. Buscar schedules finalizados (finished = true)
      // Não exige active = true, pois um agendamento pode estar finalizado mesmo se não estiver ativo
      // Usar Op.eq para garantir que está buscando exatamente true (não NULL ou false)
      const finishedSchedules = await Schedules.findAll({
        where: {
          ...dateFilter,
          finished: {
            [Op.eq]: true
          }
        },
        include: [{
          model: Service,
          as: 'Services',
          through: {
            attributes: [] // Não incluir campos da tabela intermediária
          },
          attributes: ['id', 'service', 'price', 'commission_rate'],
          required: false // LEFT JOIN - inclui schedules mesmo sem serviços
        }]
      });

      console.log(`[Financial] Encontrados ${finishedSchedules.length} agendamentos finalizados (com serviços carregados)`);
      
      // Log detalhado dos agendamentos encontrados
      finishedSchedules.forEach((schedule, index) => {
        const servicesCount = schedule.Services?.length || 0;
        console.log(`[Financial] Schedule ${index + 1}: ID=${schedule.id}, Cliente=${schedule.name_client}, Data=${schedule.date_and_houres}, Finished=${schedule.finished}, Active=${schedule.active}, Serviços=${servicesCount}`);
        if (schedule.Services && schedule.Services.length > 0) {
          schedule.Services.forEach((service, sIndex) => {
            console.log(`[Financial]   Serviço ${sIndex + 1}: ${service.service}, Preço=${service.price}, Comissão=${service.commission_rate}`);
          });
        } else {
          console.warn(`[Financial]   ⚠️ Schedule ${schedule.id} NÃO TEM SERVIÇOS ASSOCIADOS!`);
        }
      });

      // 2. Buscar schedules agendados (finished = false, active = true)
      // Inclui agendamentos com status: Agendado, Confirmado e Ativo
      // Removida restrição de data futura para incluir todos os agendamentos não finalizados
      const scheduledSchedules = await Schedules.findAll({
        where: {
          ...dateFilter,
          finished: false,
          active: true
          // Removido filtro de data futura para incluir todos os agendamentos ativos não finalizados
        },
        include: [{
          model: Service,
          as: 'Services',
          through: {
            attributes: [] // Não incluir campos da tabela intermediária
          },
          attributes: ['id', 'service', 'price', 'commission_rate'],
          required: false // LEFT JOIN - inclui schedules mesmo sem serviços
        }]
      });

      console.log(`[Financial] Encontrados ${scheduledSchedules.length} agendamentos agendados`);

      // 3. Calcular valores recebidos (finalizados)
      // Calcula usando a comissão individual de cada serviço
      let totalReceived = 0;
      const receivedDetails = [];

      for (const schedule of finishedSchedules) {
        if (!schedule.Services || schedule.Services.length === 0) {
          console.warn(`[Financial] Schedule ${schedule.id} finalizado mas sem serviços associados`);
          continue;
        }

        let scheduleNetTotal = 0;
        let scheduleGrossTotal = 0;

        // Calcular cada serviço individualmente para usar sua comissão específica
        for (const service of schedule.Services) {
          const servicePrice = parseFloat(service.price) || 0;
          if (servicePrice <= 0) {
            console.warn(`[Financial] Serviço ${service.id} do schedule ${schedule.id} tem preço inválido: ${service.price}`);
            continue;
          }

          scheduleGrossTotal += servicePrice;

          try {
            // Usar o ID do serviço para pegar a comissão individual
            const calculation = await PaymentCalculationService.calculateServiceSplit({
              grossAmount: Math.round(servicePrice * 100), // Converter para centavos
              serviceId: service.id, // Passa o ID do serviço para usar commission_rate individual
              professionalId: schedule.provider_id_schedules
            });

            // calculation.salonNetAmount já está em centavos
            scheduleNetTotal += calculation.salonNetAmount;
          } catch (error) {
            console.error(`[Financial] Erro ao calcular para serviço ${service.id} do schedule ${schedule.id}:`, error);
            // Fallback: usar comissão padrão de 50% ou a comissão do serviço se disponível
            const commissionRate = service.commission_rate || 0.5;
            const estimatedNet = Math.round(servicePrice * (1 - commissionRate) * 100);
            scheduleNetTotal += estimatedNet;
          }
        }

        if (scheduleNetTotal > 0) {
          totalReceived += scheduleNetTotal;
          receivedDetails.push({
            scheduleId: schedule.id,
            clientName: schedule.name_client,
            date: schedule.date_and_houres,
            grossAmount: scheduleGrossTotal,
            netAmount: scheduleNetTotal / 100 // Converter para reais
          });
        }
      }

      console.log(`[Financial] Total recebido calculado: R$ ${(totalReceived / 100).toFixed(2)} de ${receivedDetails.length} agendamentos`);

      // 4. Calcular valores esperados (agendados)
      // Calcula usando a comissão individual de cada serviço
      let totalExpected = 0;
      const expectedDetails = [];

      for (const schedule of scheduledSchedules) {
        if (schedule.Services && schedule.Services.length > 0) {
          let scheduleNetTotal = 0;
          let scheduleGrossTotal = 0;

          // Calcular cada serviço individualmente para usar sua comissão específica
          for (const service of schedule.Services) {
            const servicePrice = parseFloat(service.price) || 0;
            scheduleGrossTotal += servicePrice;

            try {
              // Usar o ID do serviço para pegar a comissão individual
              const calculation = await PaymentCalculationService.calculateServiceSplit({
                grossAmount: Math.round(servicePrice * 100), // Converter para centavos
                serviceId: service.id, // Passa o ID do serviço para usar commission_rate individual
                professionalId: schedule.provider_id_schedules
              });

              // calculation.salonNetAmount já está em centavos
              scheduleNetTotal += calculation.salonNetAmount;
            } catch (error) {
              console.error(`Erro ao calcular para serviço ${service.id} do schedule ${schedule.id}:`, error);
              // Fallback: usar comissão padrão de 50% ou a comissão do serviço se disponível
              const commissionRate = service.commission_rate || 0.5;
              const estimatedNet = Math.round(servicePrice * (1 - commissionRate) * 100);
              scheduleNetTotal += estimatedNet;
            }
          }

          totalExpected += scheduleNetTotal;
          expectedDetails.push({
            scheduleId: schedule.id,
            clientName: schedule.name_client,
            date: schedule.date_and_houres,
            grossAmount: scheduleGrossTotal,
            expectedNetAmount: scheduleNetTotal / 100 // Converter para reais
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          received: {
            total: totalReceived / 100, // Converter para reais
            count: finishedSchedules.length,
            details: receivedDetails
          },
          expected: {
            total: totalExpected / 100, // Converter para reais
            count: scheduledSchedules.length,
            details: expectedDetails
          },
          summary: {
            totalReceived: totalReceived / 100,
            totalExpected: totalExpected / 100,
            totalCombined: (totalReceived + totalExpected) / 100
          }
        }
      });
    } catch (error) {
      console.error('Erro ao buscar dados financeiros de schedules:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar dados financeiros de schedules'
      });
    }
  }

  /**
   * Converte valores de centavos para reais
   */
  _formatToReais(result) {
    const format = (value) => value / 100;
    
    return {
      ...result,
      grossAmount: format(result.grossAmount),
      amountAfterGatewayFee: format(result.amountAfterGatewayFee),
      salonShare: format(result.salonShare),
      professionalCommission: format(result.professionalCommission),
      salonNetAmount: format(result.salonNetAmount),
      professionalNetAmount: format(result.professionalNetAmount),
      taxes: {
        ...result.taxes,
        salonTax: format(result.taxes.salonTax),
        professionalTax: format(result.taxes.professionalTax),
        totalTax: format(result.taxes.totalTax)
      },
      operationalCosts: {
        gatewayFee: format(result.operationalCosts.gatewayFee),
        productCost: format(result.operationalCosts.productCost),
        total: format(result.operationalCosts.total)
      }
    };
  }
}

module.exports = new FinancialController();
