import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { FinancialService, FinancialTotals, FinancialLedgerEntry, ScheduleFinancialData, CommissionSummaryEntry } from '../../../core/services/financial.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="financial-dashboard">
      <div class="dashboard-header">
        <h2>
          <i class="fas fa-chart-line"></i>
          Dashboard Financeiro
        </h2>
        <div class="date-filter">
          <input
            type="date"
            id="startDate"
            name="startDate"
            [(ngModel)]="startDate"
            (change)="loadData()"
            class="date-input"
          >
          <span>até</span>
          <input
            type="date"
            id="endDate"
            name="endDate"
            [(ngModel)]="endDate"
            (change)="loadData()"
            class="date-input"
          >
        </div>
      </div>

      <!-- Cards de Resumo -->
      <div class="summary-cards">
        <div class="card income-card">
          <div class="card-icon">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div class="card-content">
            <h3>Total de Entradas</h3>
            <p class="amount positive">{{ totals.totalIncome | currency:'BRL' }}</p>
          </div>
        </div>

        <div class="card expense-card">
          <div class="card-icon">
            <i class="fas fa-arrow-down"></i>
          </div>
          <div class="card-content">
            <h3>Total de Saídas</h3>
            <p class="amount negative">{{ totals.totalExpenses | currency:'BRL' }}</p>
          </div>
        </div>

        <div class="card profit-card">
          <div class="card-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="card-content">
            <h3>Lucro Líquido</h3>
            <p class="amount" [class.positive]="totals.netProfit >= 0" [class.negative]="totals.netProfit < 0">
              {{ totals.netProfit | currency:'BRL' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="charts-container">
        <div class="chart-card">
          <h3>Entradas vs Saídas</h3>
          <canvas #incomeExpenseChart></canvas>
        </div>

        <div class="chart-card">
          <h3>DRE Simplificado</h3>
          <canvas #dreChart></canvas>
        </div>

        <div class="chart-card">
          <h3>
            <i class="fas fa-user-tie"></i>
            Comissões por Colaborador
          </h3>
          <canvas #commissionChart></canvas>
        </div>

        <div class="chart-card pie-chart-card">
          <h3>
            <i class="fas fa-chart-pie"></i>
            Recebido vs Esperado (Agendamentos)
          </h3>
          <canvas #schedulePieChart></canvas>
          <div class="pie-chart-legend" *ngIf="scheduleData">
            <div class="legend-item">
              <span class="legend-color" style="background-color: #4caf50;"></span>
              <span class="legend-text">
                <strong>Recebido:</strong> {{ scheduleData.received.total | currency:'BRL' }}
                <small>({{ scheduleData.received.count }} finalizados)</small>
              </span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background-color: #ff9800;"></span>
              <span class="legend-text">
                <strong>Esperado:</strong> {{ scheduleData.expected.total | currency:'BRL' }}
                <small>({{ scheduleData.expected.count }} agendados)</small>
              </span>
            </div>
            <div class="legend-item total">
              <span class="legend-text">
                <strong>Total Combinado:</strong> {{ scheduleData.summary.totalCombined | currency:'BRL' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- DRE Detalhado -->
      <div class="dre-container">
        <h3>
          <i class="fas fa-file-invoice"></i>
          Demonstrativo do Resultado do Exercício (DRE)
        </h3>
        <div class="dre-table">
          <div class="dre-row">
            <span class="dre-label">Receita Bruta de Serviços</span>
            <span class="dre-value">{{ totals.totalIncome | currency:'BRL' }}</span>
          </div>
          <div class="dre-row">
            <span class="dre-label">(-) Taxas de Gateway</span>
            <span class="dre-value negative">{{ operationalCosts.gatewayFee | currency:'BRL' }}</span>
          </div>
          <div class="dre-row">
            <span class="dre-label">(-) Custo de Produtos</span>
            <span class="dre-value negative">{{ operationalCosts.productCost | currency:'BRL' }}</span>
          </div>
          <div class="dre-row">
            <span class="dre-label">(-) Comissões Pagas</span>
            <span class="dre-value negative">{{ operationalCosts.commissions | currency:'BRL' }}</span>
          </div>
          <div class="dre-row">
            <span class="dre-label">(-) Impostos</span>
            <span class="dre-value negative">{{ operationalCosts.taxes | currency:'BRL' }}</span>
          </div>
          <div class="dre-row">
            <span class="dre-label">(-) Despesas Operacionais</span>
            <span class="dre-value negative">{{ operationalCosts.operationalExpenses | currency:'BRL' }}</span>
          </div>
          <div class="dre-row total">
            <span class="dre-label"><strong>Lucro Líquido</strong></span>
            <span class="dre-value" [class.positive]="totals.netProfit >= 0" [class.negative]="totals.netProfit < 0">
              <strong>{{ totals.netProfit | currency:'BRL' }}</strong>
            </span>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Carregando dados...
      </div>
    </div>
  `,
  styles: [`
    .financial-dashboard {
      padding: 2rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 1rem;

      h2 {
        margin: 0;
        color: #1976d2;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .date-filter {
        display: flex;
        align-items: center;
        gap: 1rem;

        .date-input {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;

      .card-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }

      .income-card .card-icon {
        background-color: #4caf50;
      }

      .expense-card .card-icon {
        background-color: #f44336;
      }

      .profit-card .card-icon {
        background-color: #2196f3;
      }

      .card-content {
        flex: 1;

        h3 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          color: #666;
          font-weight: normal;
        }

        .amount {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;

          &.positive {
            color: #4caf50;
          }

          &.negative {
            color: #f44336;
          }
        }
      }
    }

    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);

      h3 {
        margin: 0 0 1rem 0;
        color: #333;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      canvas {
        max-height: 300px;
      }

      &.pie-chart-card {
        .pie-chart-legend {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e0e0e0;

          .legend-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;

            &.total {
              margin-top: 0.75rem;
              padding-top: 0.75rem;
              border-top: 1px solid #e0e0e0;
            }

            .legend-color {
              width: 20px;
              height: 20px;
              border-radius: 4px;
              flex-shrink: 0;
            }

            .legend-text {
              flex: 1;
              font-size: 0.9rem;

              small {
                display: block;
                color: #666;
                font-size: 0.8rem;
                margin-top: 0.25rem;
              }
            }
          }
        }
      }
    }

    .dre-container {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);

      h3 {
        margin: 0 0 1.5rem 0;
        color: #333;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .dre-table {
      .dre-row {
        display: flex;
        justify-content: space-between;
        padding: 0.75rem;
        border-bottom: 1px solid #e0e0e0;

        &.total {
          border-top: 2px solid #333;
          border-bottom: 2px solid #333;
          margin-top: 0.5rem;
          padding-top: 1rem;
        }

        .dre-label {
          flex: 1;
        }

        .dre-value {
          font-weight: 500;

          &.positive {
            color: #4caf50;
          }

          &.negative {
            color: #f44336;
          }
        }
      }
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
  `]
})
export class FinancialDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('incomeExpenseChart', { static: false }) incomeExpenseCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dreChart', { static: false }) dreCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('commissionChart', { static: false }) commissionCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('schedulePieChart', { static: false }) schedulePieCanvas!: ElementRef<HTMLCanvasElement>;
  totals: FinancialTotals = {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0
  };

  operationalCosts = {
    gatewayFee: 0,
    productCost: 0,
    commissions: 0,
    taxes: 0,
    operationalExpenses: 0
  };

  scheduleData: ScheduleFinancialData | null = null;
  commissionSummary: CommissionSummaryEntry[] = [];
  startDate = '';
  endDate = '';
  loading = false;
  incomeExpenseChart: Chart | null = null;
  dreChart: Chart | null = null;
  schedulePieChart: Chart | null = null;
  commissionChart: Chart<'bar', number[], string> | null = null;

  constructor(
    private financialService: FinancialService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    // Define datas padrão (últimos 30 dias)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];
  }

  ngOnInit() {
    // Componente inicializado
  }

  ngAfterViewInit() {
    // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadData();
    }, 0);
  }

  ngOnDestroy() {
    if (this.incomeExpenseChart) {
      this.incomeExpenseChart.destroy();
    }
    if (this.dreChart) {
      this.dreChart.destroy();
    }
    if (this.schedulePieChart) {
      this.schedulePieChart.destroy();
    }
    if (this.commissionChart) {
      this.commissionChart.destroy();
    }
  }

  async loadData() {
    this.loading = true;
    try {
      // Carregar totais
      const totalsResponse = await this.financialService.getFinancialTotals(
        this.startDate,
        this.endDate
      ).toPromise();

      if (totalsResponse?.success) {
        this.totals = totalsResponse.data;
      }

      // Carregar entradas detalhadas para calcular custos operacionais
      // Isso agora inclui entradas virtuais de schedules finalizados
      const entriesResponse = await this.financialService.getLedgerEntries({
        startDate: this.startDate,
        endDate: this.endDate
      }).toPromise();

      if (entriesResponse?.success) {
        console.log('[Financial Dashboard] Entradas recebidas para cálculo de custos:', entriesResponse.data.length);
        if (entriesResponse.meta) {
          console.log('[Financial Dashboard] Meta:', entriesResponse.meta);
        }
        this.calculateOperationalCosts(entriesResponse.data);
      }

      // Carregar dados de schedules
      const scheduleResponse = await this.financialService.getScheduleFinancialData(
        this.startDate,
        this.endDate
      ).toPromise();

      if (scheduleResponse?.success) {
        this.scheduleData = scheduleResponse.data;
        console.log('[Financial Dashboard] Dados de schedules recebidos:', this.scheduleData);
      } else {
        console.warn('[Financial Dashboard] Resposta de schedules sem sucesso:', scheduleResponse);
        this.scheduleData = null;
      }

      // Carregar resumo de comissões
      const commissionResponse = await this.financialService.getCommissionSummary(
        this.startDate,
        this.endDate
      ).toPromise();

      if (commissionResponse?.success) {
        this.commissionSummary = commissionResponse.data || [];
        console.log('[Financial Dashboard] Dados de comissões recebidos:', this.commissionSummary);
      } else {
        console.warn('[Financial Dashboard] Resposta de comissões sem sucesso:', commissionResponse);
        this.commissionSummary = [];
      }

      // Atualizar gráficos
      setTimeout(() => {
        this.updateCharts();
      }, 100);
    } catch (error: any) {
      this.notificationService.error('Erro ao carregar dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      this.loading = false;
    }
  }

  calculateOperationalCosts(entries: FinancialLedgerEntry[]) {
    this.operationalCosts = {
      gatewayFee: 0,
      productCost: 0,
      commissions: 0,
      taxes: 0,
      operationalExpenses: 0
    };

    // Os valores no livro razão vêm em centavos, convertemos para reais
    entries.forEach(entry => {
      if (entry.transaction_type === 'EXPENSE') {
        const value = (entry.amount || 0) / 100;

        switch (entry.category) {
          case 'GATEWAY_FEE':
            this.operationalCosts.gatewayFee += value;
            break;
          case 'PRODUCT_COST':
            this.operationalCosts.productCost += value;
            break;
          case 'COMMISSION_PAYMENT':
            this.operationalCosts.commissions += value;
            break;
          case 'TAX_PAYMENT':
            this.operationalCosts.taxes += value;
            break;
          case 'FIXED_EXPENSE':
          case 'VARIABLE_EXPENSE':
            this.operationalCosts.operationalExpenses += value;
            break;
        }
      }
    });
  }

  updateCharts() {
    this.updateIncomeExpenseChart();
    this.updateDREChart();
    this.updateCommissionChart();
    this.updateSchedulePieChart();
  }

  updateIncomeExpenseChart() {
    if (!this.incomeExpenseCanvas?.nativeElement) return;

    if (this.incomeExpenseChart) {
      this.incomeExpenseChart.destroy();
    }

    this.incomeExpenseChart = new Chart(this.incomeExpenseCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Entradas', 'Saídas'],
        datasets: [{
          label: 'Valores (R$)',
          data: [this.totals.totalIncome, this.totals.totalExpenses],
          backgroundColor: ['#4caf50', '#f44336']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  updateDREChart() {
    if (!this.dreCanvas?.nativeElement) return;

    if (this.dreChart) {
      this.dreChart.destroy();
    }

    this.dreChart = new Chart(this.dreCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Lucro Líquido', 'Custos e Despesas'],
        datasets: [{
          data: [
            Math.max(0, this.totals.netProfit),
            this.totals.totalExpenses
          ],
          backgroundColor: ['#4caf50', '#f44336']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  updateCommissionChart() {
    if (!this.commissionCanvas?.nativeElement) {
      console.warn('[Financial Dashboard] Canvas do gráfico de comissões não encontrado');
      return;
    }

    if (this.commissionChart) {
      this.commissionChart.destroy();
      this.commissionChart = null;
    }

    if (!this.commissionSummary || this.commissionSummary.length === 0) {
      console.warn('[Financial Dashboard] Não há dados de comissões para renderizar');
      return;
    }

    console.log('[Financial Dashboard] Atualizando gráfico de comissões com', this.commissionSummary.length, 'colaboradores');

    const labels = this.commissionSummary.map(item => item.professionalName || 'Colaborador');
    // totalCommission vem em centavos do backend, convertemos para reais
    const data = this.commissionSummary.map(item => {
      const value = (item.totalCommission || 0) / 100;
      console.log(`[Financial Dashboard] ${item.professionalName}: R$ ${value.toFixed(2)}`);
      return value;
    });

    console.log('[Financial Dashboard] Dados do gráfico de comissões:', { labels, data: data[0].toFixed(2) });
    this.commissionChart = new Chart<"bar", number[], string>(this.commissionCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{  
          label: 'Comissões (R$)',
          data: data.map(item => Number(item.toFixed(2))),
          backgroundColor: '#2196f3',
          borderColor: '#2196f3',
          borderWidth: 1
        }]
      }
    });
  }

  updateSchedulePieChart() {
    if (!this.schedulePieCanvas?.nativeElement) {
      console.warn('[Financial Dashboard] Canvas do gráfico de schedules não encontrado');
      return;
    }

    if (this.schedulePieChart) {
      this.schedulePieChart.destroy();
      this.schedulePieChart = null;
    }

    // Se não há dados, não renderiza o gráfico
    if (!this.scheduleData) {
      console.warn('[Financial Dashboard] Não há dados de schedules para renderizar');
      return;
    }

    const received = this.scheduleData.received?.total || 0;
    const expected = this.scheduleData.expected?.total || 0;

    console.log('[Financial Dashboard] Atualizando gráfico de schedules:', { received, expected });

    // Se ambos os valores são zero, não renderiza
    if (received === 0 && expected === 0) {
      console.warn('[Financial Dashboard] Valores de recebido e esperado são zero');
      return;
    }

    this.schedulePieChart = new Chart(this.schedulePieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: [
          `Recebido (${this.scheduleData.received.count} agendamentos)`,
          `Esperado (${this.scheduleData.expected.count} agendamentos)`
        ],
        datasets: [{
          data: [received, expected],
          backgroundColor: ['#4caf50', '#ff9800'],
          borderColor: ['#388e3c', '#f57c00'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
              }
            }
          }
        }
      }
    });
  }
}

