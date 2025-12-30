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
        <div class="header-controls">
          <!-- Filtros Rápidos -->
          <div class="quick-filters">
            <button 
              *ngFor="let filter of quickFilters" 
              class="quick-filter-btn"
              [class.active]="filter.active"
              (click)="applyQuickFilter(filter)"
            >
              {{ filter.label }}
            </button>
          </div>
          <!-- Filtros de Data -->
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
      </div>

      <!-- Cards de Resumo -->
      <div class="summary-cards" *ngIf="!isProvider">
        <div class="card income-card">
          <div class="card-icon">
            <i class="fas fa-arrow-up"></i>
          </div>
          <div class="card-content">
            <h3>Total de Entradas</h3>
            <p class="amount positive">{{ totals.totalIncome | currency:'BRL' }}</p>
            <div class="kpi-indicator" *ngIf="comparisonData">
              <span [class.positive]="comparisonData.incomeChange >= 0" [class.negative]="comparisonData.incomeChange < 0">
                <i class="fas" [ngClass]="comparisonData.incomeChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
                {{ comparisonData.incomeChange >= 0 ? '+' : '' }}{{ comparisonData.incomeChange | number:'1.1-1' }}%
              </span>
              <small>vs período anterior</small>
            </div>
          </div>
        </div>

        <div class="card expense-card">
          <div class="card-icon">
            <i class="fas fa-arrow-down"></i>
          </div>
          <div class="card-content">
            <h3>Total de Saídas</h3>
            <p class="amount negative">{{ totals.totalExpenses | currency:'BRL' }}</p>
            <div class="kpi-indicator" *ngIf="comparisonData">
              <span [class.positive]="comparisonData.expenseChange <= 0" [class.negative]="comparisonData.expenseChange > 0">
                <i class="fas" [ngClass]="comparisonData.expenseChange <= 0 ? 'fa-arrow-down' : 'fa-arrow-up'"></i>
                {{ comparisonData.expenseChange >= 0 ? '+' : '' }}{{ comparisonData.expenseChange | number:'1.1-1' }}%
              </span>
              <small>vs período anterior</small>
            </div>
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
            <div class="kpi-indicator" *ngIf="comparisonData">
              <span [class.positive]="comparisonData.profitChange >= 0" [class.negative]="comparisonData.profitChange < 0">
                <i class="fas" [ngClass]="comparisonData.profitChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
                {{ comparisonData.profitChange >= 0 ? '+' : '' }}{{ comparisonData.profitChange | number:'1.1-1' }}%
              </span>
              <small>vs período anterior</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Card de Comissões para Provider -->
      <div class="summary-cards" *ngIf="isProvider">
        <div class="card commission-card">
          <div class="card-icon">
            <i class="fas fa-hand-holding-usd"></i>
          </div>
          <div class="card-content">
            <h3>Total de Comissões</h3>
            <p class="amount positive">{{ getTotalCommissions() | currency:'BRL' }}</p>
            <div class="kpi-indicator" *ngIf="getCommissionComparison() !== null">
              <span [class.positive]="getCommissionComparison()! >= 0" [class.negative]="getCommissionComparison()! < 0">
                <i class="fas" [ngClass]="getCommissionComparison()! >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i>
                {{ getCommissionComparison()! >= 0 ? '+' : '' }}{{ getCommissionComparison()! | number:'1.1-1' }}%
              </span>
              <small>vs período anterior</small>
            </div>
            <small *ngIf="getCommissionComparison() === null">Período selecionado</small>
          </div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="charts-container">
        <!-- Gráficos apenas para Admin -->
        <ng-container *ngIf="!isProvider">
          <!-- Gráfico de Evolução Temporal -->
          <div class="chart-card full-width">
            <h3>
              <i class="fas fa-chart-area"></i>
              Evolução Financeira ao Longo do Tempo
            </h3>
            <canvas #timelineChart></canvas>
          </div>

          <div class="chart-card">
            <h3>Entradas vs Saídas</h3>
            <canvas #incomeExpenseChart></canvas>
          </div>

          <div class="chart-card">
            <h3>DRE Simplificado</h3>
            <canvas #dreChart></canvas>
          </div>

          <!-- Gráfico de Despesas por Categoria -->
          <div class="chart-card">
            <h3>
              <i class="fas fa-chart-bar"></i>
              Despesas por Categoria
            </h3>
            <canvas #expensesByCategoryChart></canvas>
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
        </ng-container>

        <!-- Gráfico de Comissões (para Admin e Provider) -->
        <div class="chart-card" [class.full-width]="isProvider">
          <h3>
            <i class="fas fa-user-tie"></i>
            {{ isProvider ? 'Minhas Comissões' : 'Comissões por Colaborador' }}
          </h3>
          <canvas #commissionChart></canvas>
        </div>
      </div>

      <!-- DRE Detalhado (apenas para Admin) -->
      <div class="dre-container" *ngIf="!isProvider">
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
      margin-bottom: 2rem;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 1rem;

      h2 {
        margin: 0 0 1rem 0;
        color: #1976d2;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .header-controls {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .quick-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;

          .quick-filter-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            background: white;
            color: #666;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s;

            &:hover {
              background: #f5f5f5;
              border-color: #1976d2;
            }

            &.active {
              background: #1976d2;
              color: white;
              border-color: #1976d2;
            }
          }
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

      .commission-card .card-icon {
        background-color: #ff9800;
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

        .kpi-indicator {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          span {
            font-size: 0.875rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.25rem;

            &.positive {
              color: #4caf50;
            }

            &.negative {
              color: #f44336;
            }
          }

          small {
            font-size: 0.75rem;
            color: #999;
          }
        }
      }
    }

    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;

      .chart-card {
        &.full-width {
          grid-column: 1 / -1;
        }
      }
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

      &.full-width canvas {
        max-height: 400px;
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
  @ViewChild('timelineChart', { static: false }) timelineCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('expensesByCategoryChart', { static: false }) expensesByCategoryCanvas!: ElementRef<HTMLCanvasElement>;
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
  previousCommissionSummary: CommissionSummaryEntry[] = []; // Para comparação de períodos
  startDate = '';
  endDate = '';
  loading = false;
  incomeExpenseChart: Chart | null = null;
  dreChart: Chart | null = null;
  schedulePieChart: Chart | null = null;
  commissionChart: Chart<'bar', number[], string> | null = null;
  timelineChart: Chart | null = null;
  expensesByCategoryChart: Chart | null = null;
  
  // Dados de comparação com período anterior
  comparisonData: {
    incomeChange: number;
    expenseChange: number;
    profitChange: number;
  } | null = null;
  
  // Filtros rápidos
  quickFilters = [
    { label: 'Hoje', days: 0, active: false },
    { label: '7 dias', days: 7, active: false },
    { label: '30 dias', days: 30, active: true },
    { label: 'Mês Atual', type: 'currentMonth', active: false },
    { label: 'Mês Anterior', type: 'lastMonth', active: false },
    { label: 'Trimestre', type: 'quarter', active: false },
    { label: 'Ano', type: 'year', active: false }
  ];

  isProvider = false;

  constructor(
    private financialService: FinancialService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    // Verificar se o usuário é provider
    this.isProvider = this.authService.hasRole('provider');
    
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
    if (this.timelineChart) {
      this.timelineChart.destroy();
    }
    if (this.expensesByCategoryChart) {
      this.expensesByCategoryChart.destroy();
    }
  }

  async loadData() {
    this.loading = true;
    try {
      // Se for provider, carregar apenas dados de comissões
      if (this.isProvider) {
        // Carregar resumo de comissões do período atual (já filtrado pelo backend para o provider)
        const commissionResponse = await this.financialService.getCommissionSummary(
          this.startDate,
          this.endDate
        ).toPromise();

        if (commissionResponse?.success) {
          // Garantir que apenas as comissões do provider logado sejam exibidas
          const currentUser = this.authService.currentUser;
          if (currentUser?.id) {
            // Filtrar apenas as comissões do provider logado
            this.commissionSummary = (commissionResponse.data || []).filter(
              item => item.professionalId === currentUser.id
            );
            console.log('[Financial Dashboard] Dados de comissões filtrados para o provider:', this.commissionSummary);
          } else {
            // Se não conseguir identificar o usuário, usar apenas a primeira entrada (deve ser a única)
            this.commissionSummary = commissionResponse.data?.slice(0, 1) || [];
            console.log('[Financial Dashboard] Dados de comissões recebidos (primeira entrada):', this.commissionSummary);
          }
        } else {
          console.warn('[Financial Dashboard] Resposta de comissões sem sucesso:', commissionResponse);
          this.commissionSummary = [];
        }

        // Calcular período anterior para comparação
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        const previousEnd = new Date(start);
        previousEnd.setDate(previousEnd.getDate() - 1);
        const previousStart = new Date(previousEnd);
        previousStart.setDate(previousStart.getDate() - daysDiff);

        // Carregar comissões do período anterior
        const previousCommissionResponse = await this.financialService.getCommissionSummary(
          previousStart.toISOString().split('T')[0],
          previousEnd.toISOString().split('T')[0]
        ).toPromise();

        if (previousCommissionResponse?.success) {
          // Garantir que apenas as comissões do provider logado sejam exibidas
          const currentUser = this.authService.currentUser;
          if (currentUser?.id) {
            // Filtrar apenas as comissões do provider logado
            this.previousCommissionSummary = (previousCommissionResponse.data || []).filter(
              item => item.professionalId === currentUser.id
            );
            console.log('[Financial Dashboard] Dados de comissões anteriores filtrados para o provider:', this.previousCommissionSummary);
          } else {
            // Se não conseguir identificar o usuário, usar apenas a primeira entrada (deve ser a única)
            this.previousCommissionSummary = previousCommissionResponse.data?.slice(0, 1) || [];
            console.log('[Financial Dashboard] Dados de comissões anteriores recebidos (primeira entrada):', this.previousCommissionSummary);
          }
        } else {
          console.warn('[Financial Dashboard] Resposta de comissões anteriores sem sucesso:', previousCommissionResponse);
          this.previousCommissionSummary = [];
        }

        // Atualizar apenas gráfico de comissões
        setTimeout(() => {
          this.updateCommissionChart();
        }, 100);
      } else {
        // Carregar totais (apenas para admin)
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

        if (entriesResponse?.success && entriesResponse.data) {
          const entries = Array.isArray(entriesResponse.data) ? entriesResponse.data : [];
          console.log('[Financial Dashboard] Entradas recebidas para cálculo de custos:', entries.length);
          if (entriesResponse.meta) {
            console.log('[Financial Dashboard] Meta:', entriesResponse.meta);
          }
          this.calculateOperationalCosts(entries);
        } else {
          console.warn('[Financial Dashboard] Resposta de entradas inválida ou sem dados:', entriesResponse);
          this.calculateOperationalCosts([]);
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

        // Calcular comparação com período anterior
        await this.calculateComparison();

        // Atualizar gráficos
        setTimeout(() => {
          this.updateCharts();
        }, 100);
      }
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
    this.updateTimelineChart();
    this.updateExpensesByCategoryChart();
  }

  /**
   * Aplica filtro rápido
   */
  applyQuickFilter(filter: any) {
    // Desativa todos os filtros
    this.quickFilters.forEach(f => f.active = false);
    filter.active = true;

    const end = new Date();
    const start = new Date();

    if (filter.days !== undefined) {
      start.setDate(start.getDate() - filter.days);
    } else if (filter.type === 'currentMonth') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else if (filter.type === 'lastMonth') {
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
    } else if (filter.type === 'quarter') {
      const quarter = Math.floor(end.getMonth() / 3);
      start.setMonth(quarter * 3);
      start.setDate(1);
      end.setMonth((quarter + 1) * 3);
      end.setDate(0);
    } else if (filter.type === 'year') {
      start.setMonth(0);
      start.setDate(1);
      end.setMonth(11);
      end.setDate(31);
    }

    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];
    this.loadData();
  }

  /**
   * Calcula comparação com período anterior
   */
  async calculateComparison() {
    try {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calcular período anterior
      const previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - daysDiff);

      const previousTotalsResponse = await this.financialService.getFinancialTotals(
        previousStart.toISOString().split('T')[0],
        previousEnd.toISOString().split('T')[0]
      ).toPromise();

      if (previousTotalsResponse?.success) {
        const previous = previousTotalsResponse.data;
        const current = this.totals;

        this.comparisonData = {
          incomeChange: previous.totalIncome > 0 
            ? ((current.totalIncome - previous.totalIncome) / previous.totalIncome) * 100 
            : 0,
          expenseChange: previous.totalExpenses > 0 
            ? ((current.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 100 
            : 0,
          profitChange: previous.netProfit !== 0 
            ? ((current.netProfit - previous.netProfit) / Math.abs(previous.netProfit)) * 100 
            : (current.netProfit > 0 ? 100 : -100)
        };
      }
    } catch (error) {
      console.error('[Financial Dashboard] Erro ao calcular comparação:', error);
      this.comparisonData = null;
    }
  }

  /**
   * Atualiza gráfico de evolução temporal
   */
  async updateTimelineChart() {
    if (!this.timelineCanvas?.nativeElement) return;

    if (this.timelineChart) {
      this.timelineChart.destroy();
    }

    try {
      // Buscar entradas para agrupar por data
      const entriesResponse = await this.financialService.getLedgerEntries({
        startDate: this.startDate,
        endDate: this.endDate
      }).toPromise();

      if (entriesResponse?.success && entriesResponse.data) {
        const entries = Array.isArray(entriesResponse.data) ? entriesResponse.data : [];
        const groupedByDate: { [key: string]: { income: number; expense: number } } = {};

        entries.forEach(entry => {
          const date = entry.transaction_date.split('T')[0];
          if (!groupedByDate[date]) {
            groupedByDate[date] = { income: 0, expense: 0 };
          }
          const value = (entry.amount || 0) / 100;
          if (entry.transaction_type === 'INCOME') {
            groupedByDate[date].income += value;
          } else {
            groupedByDate[date].expense += value;
          }
        });

        const dates = Object.keys(groupedByDate).sort();
        
        // Se não há dados suficientes, criar pontos baseados nos totais
        if (dates.length === 0) {
          dates.push(this.startDate, this.endDate);
          groupedByDate[this.startDate] = { income: 0, expense: 0 };
          groupedByDate[this.endDate] = { 
            income: this.totals.totalIncome, 
            expense: this.totals.totalExpenses 
          };
        }

        const incomeData = dates.map(date => groupedByDate[date]?.income || 0);
        const expenseData = dates.map(date => groupedByDate[date]?.expense || 0);
        const profitData = dates.map(date => (groupedByDate[date]?.income || 0) - (groupedByDate[date]?.expense || 0));

        this.timelineChart = new Chart(this.timelineCanvas.nativeElement, {
          type: 'line',
          data: {
            labels: dates.map(date => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
            datasets: [
              {
                label: 'Receitas',
                data: incomeData,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
              },
              {
                label: 'Despesas',
                data: expenseData,
                borderColor: '#f44336',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
              },
              {
                label: 'Lucro',
                data: profitData,
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false
            },
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                  label: (context: any) => {
                    const value = context.parsed?.y ?? 0;
                    return `${context.dataset.label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => {
                    return 'R$ ' + Number(value).toLocaleString('pt-BR');
                  }
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('[Financial Dashboard] Erro ao atualizar gráfico temporal:', error);
    }
  }

  /**
   * Atualiza gráfico de despesas por categoria
   */
  updateExpensesByCategoryChart() {
    if (!this.expensesByCategoryCanvas?.nativeElement) return;

    if (this.expensesByCategoryChart) {
      this.expensesByCategoryChart.destroy();
    }

    const categories = [
      { key: 'gatewayFee', label: 'Taxa Gateway', color: '#ff9800' },
      { key: 'productCost', label: 'Custo Produtos', color: '#9c27b0' },
      { key: 'commissions', label: 'Comissões', color: '#2196f3' },
      { key: 'taxes', label: 'Impostos', color: '#f44336' },
      { key: 'operationalExpenses', label: 'Despesas Operacionais', color: '#607d8b' }
    ];

    const data = categories.map(cat => this.operationalCosts[cat.key as keyof typeof this.operationalCosts] as number);
    const labels = categories.map(cat => cat.label);
    const colors = categories.map(cat => cat.color);

    this.expensesByCategoryChart = new Chart(this.expensesByCategoryCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Despesas (R$)',
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c + 'dd'),
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.parsed?.y ?? 0;
                return `${context.label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return 'R$ ' + Number(value).toLocaleString('pt-BR');
              }
            }
          }
        }
      }
    });
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

    // Se for provider, mostrar comparação entre períodos
    if (this.isProvider) {
      // Pegar apenas as comissões do provider logado (deve ser apenas uma entrada)
      const currentCommission = this.commissionSummary.length > 0 ? this.commissionSummary[0] : null;
      const previousCommission = this.previousCommissionSummary.length > 0 ? this.previousCommissionSummary[0] : null;

      if (!currentCommission && !previousCommission) {
        console.warn('[Financial Dashboard] Não há dados de comissões para renderizar');
        return;
      }

      const currentValue = currentCommission ? (currentCommission.totalCommission || 0) / 100 : 0;
      const previousValue = previousCommission ? (previousCommission.totalCommission || 0) / 100 : 0;

      // Calcular período atual formatado
      const startDate = new Date(this.startDate);
      const endDate = new Date(this.endDate);
      const startFormatted = startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const endFormatted = endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const currentPeriodLabel = `${startFormatted} - ${endFormatted}`;

      // Calcular período anterior formatado
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const previousEnd = new Date(startDate);
      previousEnd.setDate(previousEnd.getDate() - 1);
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - daysDiff);
      const previousStartFormatted = previousStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const previousEndFormatted = previousEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const previousPeriodLabel = `${previousStartFormatted} - ${previousEndFormatted}`;

      this.commissionChart = new Chart<"bar", number[], string>(this.commissionCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: [previousPeriodLabel, currentPeriodLabel],
          datasets: [{
            label: 'Minhas Comissões (R$)',
            data: [previousValue, currentValue],
            backgroundColor: ['#9e9e9e', '#ff9800'],
            borderColor: ['#757575', '#f57c00'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const value = context.parsed?.y ?? 0;
                  return `${context.dataset.label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  return 'R$ ' + Number(value).toLocaleString('pt-BR');
                }
              }
            }
          }
        }
      });
    } else {
      // Para admin, mostrar todos os colaboradores
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

      console.log('[Financial Dashboard] Dados do gráfico de comissões:', { labels, data: data[0]?.toFixed(2) });
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
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const value = context.parsed?.y ?? 0;
                  return `${context.dataset.label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  return 'R$ ' + Number(value).toLocaleString('pt-BR');
                }
              }
            }
          }
        }
      });
    }
  }

  /**
   * Calcula o total de comissões do provider
   */
  getTotalCommissions(): number {
    if (!this.commissionSummary || this.commissionSummary.length === 0) {
      return 0;
    }
    // totalCommission vem em centavos, converter para reais
    // Para provider, deve haver apenas uma entrada (a dele)
    return (this.commissionSummary[0]?.totalCommission || 0) / 100;
  }

  /**
   * Calcula a variação percentual das comissões em relação ao período anterior
   */
  getCommissionComparison(): number | null {
    if (!this.isProvider) {
      return null;
    }

    const currentCommission = this.commissionSummary.length > 0 ? this.commissionSummary[0] : null;
    const previousCommission = this.previousCommissionSummary.length > 0 ? this.previousCommissionSummary[0] : null;

    if (!currentCommission || !previousCommission) {
      return null;
    }

    const currentValue = (currentCommission.totalCommission || 0) / 100;
    const previousValue = (previousCommission.totalCommission || 0) / 100;

    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }

    return ((currentValue - previousValue) / previousValue) * 100;
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
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed?.y ?? 0;
                return `${label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
              }
            }
          }
        }
      }
    });
  }
}

