/**
 * PaymentCalculationService
 * 
 * Serviço especializado para cálculo de divisão de pagamentos
 * seguindo a Lei do Salão Parceiro e diferentes regimes tributários.
 * 
 * Utiliza Strategy Pattern para permitir fácil extensão de novos regimes.
 */

const { CompanySettings, CommissionRule, Service } = require('../Database/models');

class PaymentCalculationService {
  constructor() {
    // Strategy Pattern: Mapeamento de estratégias de cálculo de imposto
    this.taxStrategies = {
      MEI: new MEITaxStrategy(),
      SIMPLES_NACIONAL: new SimplesNacionalTaxStrategy(),
      LUCRO_PRESUMIDO: new LucroPresumidoTaxStrategy(),
      LUCRO_REAL: new LucroRealTaxStrategy()
    };
  }

  /**
   * Calcula a divisão de valores de um serviço
   * 
   * @param {Object} params
   * @param {number} params.grossAmount - Valor bruto do serviço (em centavos)
   * @param {string} params.serviceId - ID do serviço (opcional)
   * @param {string} params.professionalId - ID do profissional (opcional)
   * @param {number} params.productCost - Custo de produtos consumidos (em centavos, opcional)
   * 
   * @returns {Promise<Object>} Objeto com divisão detalhada dos valores
   */
  async calculateServiceSplit(params) {
    const { grossAmount, serviceId, professionalId, productCost = 0 } = params;

    // Validações
    if (!grossAmount || grossAmount <= 0) {
      throw new Error('Parâmetros inválidos para cálculo de divisão');
    }

    // 1. Buscar configurações globais
    const companySettings = await CompanySettings.findOne();

    if (!companySettings) {
      // Cria configuração padrão se não existir
      const defaultSettings = await CompanySettings.create({
        tax_regime: 'MEI',
        is_partner_salon: false,
        tax_rate: 0.06,
        payment_gateway_fee: 0.0299,
        default_commission_rate: 0.50
      });
      return this._calculateWithSettings(defaultSettings, grossAmount, serviceId, professionalId, productCost);
    }

    return this._calculateWithSettings(companySettings, grossAmount, serviceId, professionalId, productCost);
  }

  /**
   * Calcula divisão usando configurações
   */
  async _calculateWithSettings(companySettings, grossAmount, serviceId, professionalId, productCost) {
    // 2. Buscar taxa de comissão (prioridade: serviço > regras específicas > geral)
    const commissionRate = await this._getCommissionRate(
      serviceId,
      professionalId,
      companySettings.default_commission_rate
    );

    // 3. Calcular dedução inicial (taxa do gateway)
    const gatewayFee = this._calculatePercentage(
      grossAmount,
      companySettings.payment_gateway_fee
    );
    const amountAfterGatewayFee = grossAmount - gatewayFee;

    // 4. Calcular divisão básica (Salão vs Profissional)
    const professionalCommission = this._calculatePercentage(
      amountAfterGatewayFee,
      commissionRate
    );
    const salonShare = amountAfterGatewayFee - professionalCommission;

    // 5. Calcular impostos baseado na Lei do Salão Parceiro
    const taxStrategy = this.taxStrategies[companySettings.tax_regime];
    if (!taxStrategy) {
      throw new Error(`Regime tributário não suportado: ${companySettings.tax_regime}`);
    }

    const taxCalculation = taxStrategy.calculateTax({
      grossAmount: amountAfterGatewayFee,
      salonShare,
      professionalCommission,
      isPartnerSalon: companySettings.is_partner_salon,
      taxRate: companySettings.tax_rate
    });

    // 6. Calcular valores líquidos finais
    const salonNetAmount = salonShare - taxCalculation.salonTax - productCost;
    const professionalNetAmount = professionalCommission - taxCalculation.professionalTax;

    // 7. Calcular custos operacionais totais
    const operationalCosts = gatewayFee + productCost + taxCalculation.totalTax;

    // 8. Retornar objeto detalhado
    // Todos os valores já estão em centavos (inteiros), garantimos apenas que sejam inteiros
    return {
      // Valores brutos (já em centavos)
      grossAmount: Math.round(grossAmount),
      amountAfterGatewayFee: Math.round(amountAfterGatewayFee),

      // Divisão básica (já em centavos)
      salonShare: Math.round(salonShare),
      professionalCommission: Math.round(professionalCommission),

      // Valores líquidos finais (já em centavos)
      salonNetAmount: Math.round(salonNetAmount),
      professionalNetAmount: Math.round(professionalNetAmount),

      // Impostos (já em centavos)
      taxes: {
        salonTax: Math.round(taxCalculation.salonTax),
        professionalTax: Math.round(taxCalculation.professionalTax),
        totalTax: Math.round(taxCalculation.totalTax),
        taxRegime: companySettings.tax_regime,
        isPartnerSalon: companySettings.is_partner_salon
      },

      // Custos operacionais (já em centavos)
      operationalCosts: {
        gatewayFee: Math.round(gatewayFee),
        productCost: Math.round(productCost),
        total: Math.round(operationalCosts)
      },

      // Metadados
      metadata: {
        commissionRate: commissionRate,
        gatewayFeeRate: companySettings.payment_gateway_fee,
        taxRate: companySettings.tax_rate
      }
    };
  }

  /**
   * Busca a taxa de comissão aplicável (prioridade: serviço > regras específicas > geral)
   */
  async _getCommissionRate(serviceId, professionalId, defaultRate) {
    // Prioridade 0: Comissão definida diretamente no cadastro do serviço
    if (serviceId) {
      const service = await Service.findByPk(serviceId);
      if (service && service.commission_rate !== null && service.commission_rate !== undefined) {
        return service.commission_rate;
      }
    }

    // Prioridade 1: Regra específica para serviço + profissional
    if (serviceId && professionalId) {
      const specificRule = await CommissionRule.findOne({
        where: {
          service_id: serviceId,
          professional_id: professionalId,
          is_active: true
        }
      });
      if (specificRule) return specificRule.commission_rate;
    }

    // Prioridade 2: Regra por serviço
    if (serviceId) {
      const serviceRule = await CommissionRule.findOne({
        where: {
          rule_type: 'SERVICE',
          service_id: serviceId,
          is_active: true
        }
      });
      if (serviceRule) return serviceRule.commission_rate;
    }

    // Prioridade 3: Regra por profissional
    if (professionalId) {
      const professionalRule = await CommissionRule.findOne({
        where: {
          rule_type: 'PROFESSIONAL',
          professional_id: professionalId,
          is_active: true
        }
      });
      if (professionalRule) return professionalRule.commission_rate;
    }

    // Prioridade 4: Regra geral (mantida apenas como fallback oculto)
    const generalRule = await CommissionRule.findOne({
      where: {
        rule_type: 'GENERAL',
        is_active: true
      }
    });

    return generalRule ? generalRule.commission_rate : defaultRate;
  }

  /**
   * Calcula porcentagem de um valor
   */
  _calculatePercentage(amount, percentage) {
    return Math.round(amount * percentage);
  }

  /**
   * Garante que o valor seja um inteiro (valores já estão em centavos)
   * @deprecated Use Math.round() diretamente, valores já estão em centavos
   */
  _toCents(value) {
    return Math.round(value);
  }
}

/**
 * Strategy: MEI (Microempreendedor Individual)
 */
class MEITaxStrategy {
  calculateTax({ grossAmount, salonShare, professionalCommission, isPartnerSalon, taxRate }) {
    if (isPartnerSalon) {
      // Lei do Salão Parceiro: Imposto APENAS sobre a cota-parte do salão
      const salonTax = Math.round(salonShare * taxRate);
      return {
        salonTax,
        professionalTax: 0,
        totalTax: salonTax
      };
    } else {
      // Imposto sobre o valor total
      const totalTax = Math.round(grossAmount * taxRate);
      return {
        salonTax: totalTax,
        professionalTax: 0,
        totalTax
      };
    }
  }
}

/**
 * Strategy: Simples Nacional
 */
class SimplesNacionalTaxStrategy {
  calculateTax({ grossAmount, salonShare, professionalCommission, isPartnerSalon, taxRate }) {
    if (isPartnerSalon) {
      const salonTax = Math.round(salonShare * taxRate);
      return {
        salonTax,
        professionalTax: 0,
        totalTax: salonTax
      };
    } else {
      const totalTax = Math.round(grossAmount * taxRate);
      return {
        salonTax: totalTax,
        professionalTax: 0,
        totalTax
      };
    }
  }
}

/**
 * Strategy: Lucro Presumido
 */
class LucroPresumidoTaxStrategy {
  calculateTax({ grossAmount, salonShare, professionalCommission, isPartnerSalon, taxRate }) {
    if (isPartnerSalon) {
      const salonTax = Math.round(salonShare * taxRate);
      return {
        salonTax,
        professionalTax: 0,
        totalTax: salonTax
      };
    } else {
      const totalTax = Math.round(grossAmount * taxRate);
      return {
        salonTax: totalTax,
        professionalTax: 0,
        totalTax
      };
    }
  }
}

/**
 * Strategy: Lucro Real
 */
class LucroRealTaxStrategy {
  calculateTax({ grossAmount, salonShare, professionalCommission, isPartnerSalon, taxRate }) {
    if (isPartnerSalon) {
      const salonTax = Math.round(salonShare * taxRate);
      return {
        salonTax,
        professionalTax: 0,
        totalTax: salonTax
      };
    } else {
      const totalTax = Math.round(grossAmount * taxRate);
      return {
        salonTax: totalTax,
        professionalTax: 0,
        totalTax
      };
    }
  }
}

module.exports = new PaymentCalculationService();
