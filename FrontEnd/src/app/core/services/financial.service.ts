import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CompanySettings {
  id?: string;
  tax_regime: 'MEI' | 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
  is_partner_salon: boolean;
  tax_rate: number;
  payment_gateway_fee: number;
  default_commission_rate: number;
}

export interface CommissionRule {
  id?: string;
  rule_type: 'GENERAL' | 'SERVICE' | 'PROFESSIONAL';
  service_id?: string;
  professional_id?: string;
  commission_rate: number;
  is_active: boolean;
}

export interface ServiceSplitCalculation {
  grossAmount: number;
  amountAfterGatewayFee: number;
  salonShare: number;
  professionalCommission: number;
  salonNetAmount: number;
  professionalNetAmount: number;
  taxes: {
    salonTax: number;
    professionalTax: number;
    totalTax: number;
    taxRegime: string;
    isPartnerSalon: boolean;
  };
  operationalCosts: {
    gatewayFee: number;
    productCost: number;
    total: number;
  };
  metadata: {
    commissionRate: number;
    gatewayFeeRate: number;
    taxRate: number;
  };
}

export interface FinancialLedgerEntry {
  id: string;
  transaction_type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number; // Em centavos
  description: string;
  transaction_date: string;
  reference_id?: string;
  reference_type?: string;
  schedule_id?: string;
  expense_id?: string;
  metadata?: any;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id?: string;
  expense_type: 'FIXED' | 'VARIABLE';
  category: string;
  description?: string;
  amount: number;
  due_date?: string;
  payment_date?: string;
  is_paid: boolean;
  is_recurring: boolean;
  recurring_period?: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  product_id?: string;
  schedule_id?: string;
}

export interface FinancialTotals {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export interface ScheduleFinancialData {
  received: {
    total: number;
    count: number;
    details: Array<{
      scheduleId: string;
      clientName: string;
      date: string;
      grossAmount: number;
      netAmount: number;
    }>;
  };
  expected: {
    total: number;
    count: number;
    details: Array<{
      scheduleId: string;
      clientName: string;
      date: string;
      grossAmount: number;
      expectedNetAmount: number;
    }>;
  };
  summary: {
    totalReceived: number;
    totalExpected: number;
    totalCombined: number;
  };
}

export interface CommissionSummaryEntry {
  professionalId: string;
  professionalName: string;
  totalCommission: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private apiUrl = `${environment.apiUrl}/financial`;

  constructor(private http: HttpClient) {}

  /**
   * Calcula divisão de pagamento de serviço
   */
  calculateServiceSplit(params: {
    grossAmount: number;
    serviceId?: string;
    professionalId?: string;
    productCost?: number;
  }): Observable<{ success: boolean; data: ServiceSplitCalculation }> {
    return this.http.post<{ success: boolean; data: ServiceSplitCalculation }>(
      `${this.apiUrl}/calculate-split`,
      params
    );
  }

  /**
   * Registra pagamento no livro razão
   */
  recordServicePayment(params: {
    scheduleId: string;
    calculationResult: ServiceSplitCalculation;
    createdBy?: string;
  }): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(
      `${this.apiUrl}/record-payment`,
      params
    );
  }

  /**
   * Busca entradas do livro razão
   */
  getLedgerEntries(filters?: {
    startDate?: string;
    endDate?: string;
    transactionType?: 'INCOME' | 'EXPENSE';
    category?: string;
    limit?: number;
    offset?: number;
  }): Observable<{ success: boolean; data: FinancialLedgerEntry[]; meta?: { total: number; virtualCount: number; realCount: number } }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.http.get<{ success: boolean; data: FinancialLedgerEntry[]; meta?: { total: number; virtualCount: number; realCount: number } }>(
      `${this.apiUrl}/ledger?${params.toString()}`
    );
  }

  /**
   * Calcula totais financeiros (DRE)
   */
  getFinancialTotals(
    startDate?: string,
    endDate?: string
  ): Observable<{ success: boolean; data: FinancialTotals }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.http.get<{ success: boolean; data: FinancialTotals }>(
      `${this.apiUrl}/totals?${params.toString()}`
    );
  }

  /**
   * Resumo de comissões por colaborador
   */
  getCommissionSummary(
    startDate?: string,
    endDate?: string
  ): Observable<{ success: boolean; data: CommissionSummaryEntry[] }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.http.get<{ success: boolean; data: CommissionSummaryEntry[] }>(
      `${this.apiUrl}/commissions?${params.toString()}`
    );
  }

  /**
   * Busca configurações financeiras globais
   */
  getCompanySettings(): Observable<{ success: boolean; data: CompanySettings }> {
    return this.http.get<{ success: boolean; data: CompanySettings }>(
      `${this.apiUrl}/settings`
    );
  }

  /**
   * Atualiza configurações financeiras globais
   */
  updateCompanySettings(
    settings: Partial<CompanySettings>
  ): Observable<{ success: boolean; message: string; data: CompanySettings }> {
    return this.http.put<{ success: boolean; message: string; data: CompanySettings }>(
      `${this.apiUrl}/settings`,
      settings
    );
  }

  /**
   * Cria regra de comissão
   */
  createCommissionRule(rule: Omit<CommissionRule, 'id'>): Observable<{ success: boolean; message: string; data: CommissionRule }> {
    return this.http.post<{ success: boolean; message: string; data: CommissionRule }>(
      `${this.apiUrl}/commission-rules`,
      rule
    );
  }

  /**
   * Busca regras de comissão
   */
  getCommissionRules(filters?: {
    ruleType?: 'GENERAL' | 'SERVICE' | 'PROFESSIONAL';
    serviceId?: string;
    professionalId?: string;
    isActive?: boolean;
  }): Observable<{ success: boolean; data: CommissionRule[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.http.get<{ success: boolean; data: CommissionRule[] }>(
      `${this.apiUrl}/commission-rules?${params.toString()}`
    );
  }

  /**
   * Cria despesa
   */
  createExpense(expense: Omit<Expense, 'id'>): Observable<{ success: boolean; message: string; data: Expense }> {
    return this.http.post<{ success: boolean; message: string; data: Expense }>(
      `${this.apiUrl}/expenses`,
      expense
    );
  }

  /**
   * Busca despesas
   */
  getExpenses(filters?: {
    expenseType?: 'FIXED' | 'VARIABLE';
    isPaid?: boolean;
    startDate?: string;
    endDate?: string;
  }): Observable<{ success: boolean; data: Expense[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.http.get<{ success: boolean; data: Expense[] }>(
      `${this.apiUrl}/expenses?${params.toString()}`
    );
  }

  /**
   * Busca valores de schedules finalizados e agendados
   */
  getScheduleFinancialData(
    startDate?: string,
    endDate?: string
  ): Observable<{ success: boolean; data: ScheduleFinancialData }> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.http.get<{ success: boolean; data: ScheduleFinancialData }>(
      `${this.apiUrl}/schedules?${params.toString()}`
    );
  }

  /**
   * Busca uma entrada específica por ID
   */
  getLedgerEntry(id: string): Observable<{ success: boolean; data: FinancialLedgerEntry }> {
    return this.http.get<{ success: boolean; data: FinancialLedgerEntry }>(
      `${this.apiUrl}/ledger/${id}`
    );
  }

  /**
   * Cria uma entrada manual no livro razão
   */
  createLedgerEntry(entry: {
    transactionType: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    description?: string;
    transactionDate?: string;
    metadata?: any;
    createdBy?: string;
  }): Observable<{ success: boolean; message: string; data: FinancialLedgerEntry }> {
    return this.http.post<{ success: boolean; message: string; data: FinancialLedgerEntry }>(
      `${this.apiUrl}/ledger`,
      entry
    );
  }

  /**
   * Atualiza uma entrada do livro razão
   */
  updateLedgerEntry(id: string, entry: {
    transactionType?: 'INCOME' | 'EXPENSE';
    category?: string;
    amount?: number;
    description?: string;
    transactionDate?: string;
    metadata?: any;
  }): Observable<{ success: boolean; message: string; data: FinancialLedgerEntry }> {
    return this.http.put<{ success: boolean; message: string; data: FinancialLedgerEntry }>(
      `${this.apiUrl}/ledger/${id}`,
      entry
    );
  }

  /**
   * Deleta uma entrada do livro razão
   */
  deleteLedgerEntry(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/ledger/${id}`
    );
  }
}
