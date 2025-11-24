const FinancialRepository = require('../repositories/financial.repository');
const PaymentCalculationService = require('../services/payment-calculation.service');
const { FinancialLedger, Expense, Schedules, Service } = require('../Database/models');
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

      const entries = [];

      // 1. Entrada: Valor líquido do salão
      entries.push({
        transactionType: 'INCOME',
        category: 'SERVICE_PAYMENT',
        amount: calculationResult.salonNetAmount,
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
        amount: calculationResult.professionalNetAmount,
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
        amount: calculationResult.operationalCosts.gatewayFee,
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
          amount: calculationResult.taxes.totalTax,
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
          amount: calculationResult.operationalCosts.productCost,
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
   */
  async getLedgerEntries(req, res) {
    try {
      const { startDate, endDate, transactionType, category, limit, offset } = req.query;

      const entries = await this.financialRepo.findLedgerEntries({
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        transactionType,
        category,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0
      });

      return res.status(200).json({
        success: true,
        data: entries
      });
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
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

      const entry = await this.financialRepo.createLedgerEntry({
        transactionType,
        category,
        amount: Math.round(amount * 100), // Converte para centavos
        description,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        metadata,
        createdBy
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
   */
  async getFinancialTotals(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const totals = await this.financialRepo.calculateTotals(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      // Converte para reais
      const formattedTotals = {
        totalIncome: totals.totalIncome / 100,
        totalExpenses: totals.totalExpenses / 100,
        netProfit: totals.netProfit / 100
      };

      return res.status(200).json({
        success: true,
        data: formattedTotals
      });
    } catch (error) {
      console.error('Erro ao calcular totais:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao calcular totais financeiros'
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

      // Buscar configurações para cálculo
      const companySettings = await this.financialRepo.getCompanySettings();

      // Filtros de data
      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.date_and_houres = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      // 1. Buscar schedules finalizados (finished = true)
      const finishedSchedules = await Schedules.findAll({
        where: {
          ...dateFilter,
          finished: true,
          active: true
        },
        include: [{
          model: Service,
          as: 'Services',
          attributes: ['id', 'service', 'price']
        }]
      });

      // 2. Buscar schedules agendados (finished = false, active = true, data futura)
      const scheduledSchedules = await Schedules.findAll({
        where: {
          ...dateFilter,
          finished: false,
          active: true,
          date_and_houres: {
            [Op.gte]: new Date() // Apenas agendamentos futuros
          }
        },
        include: [{
          model: Service,
          as: 'Services',
          attributes: ['id', 'service', 'price']
        }]
      });

      // 3. Calcular valores recebidos (finalizados)
      let totalReceived = 0;
      const receivedDetails = [];

      for (const schedule of finishedSchedules) {
        if (schedule.Services && schedule.Services.length > 0) {
          // Soma os preços dos serviços (já estão em reais)
          const scheduleTotal = schedule.Services.reduce((sum, service) => {
            return sum + (parseFloat(service.price) || 0);
          }, 0);

          // Calcular divisão usando o serviço de cálculo
          try {
            const calculation = await PaymentCalculationService.calculateServiceSplit({
              grossAmount: Math.round(scheduleTotal * 100), // Converter para centavos
              professionalId: schedule.provider_id_schedules
            });

            // calculation.salonNetAmount já está em centavos
            totalReceived += calculation.salonNetAmount;
            receivedDetails.push({
              scheduleId: schedule.id,
              clientName: schedule.name_client,
              date: schedule.date_and_houres,
              grossAmount: scheduleTotal,
              netAmount: calculation.salonNetAmount / 100 // Converter para reais
            });
          } catch (error) {
            console.error(`Erro ao calcular para schedule ${schedule.id}:`, error);
            // Fallback: usar valor bruto (assumindo 50% de comissão padrão)
            const estimatedNet = Math.round(scheduleTotal * 0.5 * 100);
            totalReceived += estimatedNet;
            receivedDetails.push({
              scheduleId: schedule.id,
              clientName: schedule.name_client,
              date: schedule.date_and_houres,
              grossAmount: scheduleTotal,
              netAmount: estimatedNet / 100
            });
          }
        }
      }

      // 4. Calcular valores esperados (agendados)
      let totalExpected = 0;
      const expectedDetails = [];

      for (const schedule of scheduledSchedules) {
        if (schedule.Services && schedule.Services.length > 0) {
          // Soma os preços dos serviços (já estão em reais)
          const scheduleTotal = schedule.Services.reduce((sum, service) => {
            return sum + (parseFloat(service.price) || 0);
          }, 0);

          // Calcular divisão usando o serviço de cálculo
          try {
            const calculation = await PaymentCalculationService.calculateServiceSplit({
              grossAmount: Math.round(scheduleTotal * 100), // Converter para centavos
              professionalId: schedule.provider_id_schedules
            });

            // calculation.salonNetAmount já está em centavos
            totalExpected += calculation.salonNetAmount;
            expectedDetails.push({
              scheduleId: schedule.id,
              clientName: schedule.name_client,
              date: schedule.date_and_houres,
              grossAmount: scheduleTotal,
              expectedNetAmount: calculation.salonNetAmount / 100 // Converter para reais
            });
          } catch (error) {
            console.error(`Erro ao calcular para schedule ${schedule.id}:`, error);
            // Fallback: usar valor bruto (assumindo 50% de comissão padrão)
            const estimatedNet = Math.round(scheduleTotal * 0.5 * 100);
            totalExpected += estimatedNet;
            expectedDetails.push({
              scheduleId: schedule.id,
              clientName: schedule.name_client,
              date: schedule.date_and_houres,
              grossAmount: scheduleTotal,
              expectedNetAmount: estimatedNet / 100
            });
          }
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
