const { FinancialLedger, Expense, CompanySettings, CommissionRule } = require('../Database/models');
const { Op } = require('sequelize');

class FinancialRepository {
  /**
   * Registra uma entrada no livro razão (imutável)
   */
  async createLedgerEntry(data) {
    try {
      const entry = await FinancialLedger.create({
        transaction_type: data.transactionType,
        category: data.category,
        amount: data.amount,
        description: data.description,
        reference_id: data.referenceId,
        reference_type: data.referenceType,
        schedule_id: data.scheduleId,
        expense_id: data.expenseId,
        transaction_date: data.transactionDate || new Date(),
        metadata: data.metadata,
        created_by: data.createdBy
      });
      return entry;
    } catch (error) {
      console.error('Erro ao criar entrada no livro razão:', error);
      throw error;
    }
  }

  /**
   * Busca entradas do livro razão com filtros
   */
  async findLedgerEntries(filters) {
    const where = {};

    if (filters.startDate && filters.endDate) {
      where.transaction_date = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }

    if (filters.transactionType) {
      where.transaction_type = filters.transactionType;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    return await FinancialLedger.findAll({
      where,
      order: [['transaction_date', 'DESC']],
      limit: filters.limit || 100,
      offset: filters.offset || 0
    });
  }

  /**
   * Calcula totais de entradas e saídas
   */
  async calculateTotals(startDate, endDate) {
    const where = {};

    if (startDate && endDate) {
      where.transaction_date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const [income, expenses] = await Promise.all([
      FinancialLedger.sum('amount', {
        where: { ...where, transaction_type: 'INCOME' }
      }),
      FinancialLedger.sum('amount', {
        where: { ...where, transaction_type: 'EXPENSE' }
      })
    ]);

    return {
      totalIncome: income || 0,
      totalExpenses: expenses || 0,
      netProfit: (income || 0) - (expenses || 0)
    };
  }

  /**
   * Busca configurações financeiras globais (singleton)
   */
  async getCompanySettings() {
    let settings = await CompanySettings.findOne();

    // Se não existir, cria com valores padrão
    if (!settings) {
      settings = await CompanySettings.create({
        tax_regime: 'MEI',
        is_partner_salon: false,
        tax_rate: 0.06,
        payment_gateway_fee: 0.0299,
        default_commission_rate: 0.50
      });
    }

    return settings;
  }

  /**
   * Atualiza configurações financeiras globais
   */
  async updateCompanySettings(data) {
    // Busca ou cria configuração global
    let settings = await CompanySettings.findOne();
    
    if (settings) {
      await settings.update(data);
      return settings;
    } else {
      return await CompanySettings.create({
        tax_regime: 'MEI',
        is_partner_salon: false,
        tax_rate: 0.06,
        payment_gateway_fee: 0.0299,
        default_commission_rate: 0.50,
        ...data
      });
    }
  }

  /**
   * Cria regra de comissão
   */
  async createCommissionRule(data) {
    return await CommissionRule.create(data);
  }

  /**
   * Busca regras de comissão
   */
  async findCommissionRules(filters = {}) {
    const where = {
      is_active: filters.isActive !== undefined ? filters.isActive : true
    };

    if (filters.ruleType) {
      where.rule_type = filters.ruleType;
    }

    if (filters.serviceId) {
      where.service_id = filters.serviceId;
    }

    if (filters.professionalId) {
      where.professional_id = filters.professionalId;
    }

    return await CommissionRule.findAll({ where });
  }

  /**
   * Cria despesa
   */
  async createExpense(data) {
    return await Expense.create(data);
  }

  /**
   * Busca despesas
   */
  async findExpenses(filters = {}) {
    const where = {};

    if (filters.expenseType) {
      where.expense_type = filters.expenseType;
    }

    if (filters.isPaid !== undefined) {
      where.is_paid = filters.isPaid;
    }

    if (filters.startDate && filters.endDate) {
      where.due_date = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }

    return await Expense.findAll({
      where,
      order: [['due_date', 'DESC']]
    });
  }

  /**
   * Busca uma entrada do livro razão por ID
   */
  async findLedgerEntryById(id) {
    return await FinancialLedger.findByPk(id);
  }

  /**
   * Atualiza uma entrada do livro razão
   */
  async updateLedgerEntry(id, data) {
    const entry = await FinancialLedger.findByPk(id);
    if (!entry) {
      throw new Error('Entrada não encontrada');
    }
    
    await entry.update({
      transaction_type: data.transactionType,
      category: data.category,
      amount: data.amount,
      description: data.description,
      transaction_date: data.transactionDate,
      metadata: data.metadata
    });
    
    return entry;
  }

  /**
   * Deleta uma entrada do livro razão
   */
  async deleteLedgerEntry(id) {
    const entry = await FinancialLedger.findByPk(id);
    if (!entry) {
      throw new Error('Entrada não encontrada');
    }
    
    await entry.destroy();
    return true;
  }
}

module.exports = FinancialRepository;
