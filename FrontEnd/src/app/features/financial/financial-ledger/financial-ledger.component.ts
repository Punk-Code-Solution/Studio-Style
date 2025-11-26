import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancialService, FinancialLedgerEntry } from '../../../core/services/financial.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { TableUtilsService, TableSort } from '../../../core/services/table-utils.service';

@Component({
  selector: 'app-financial-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="financial-ledger">
      <div class="header">
        <h1>
          <i class="fas fa-book"></i>
          Controle de Entradas e Saídas
        </h1>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="fas fa-plus"></i>
          Nova Entrada/Saída
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <div class="filter-group">
          <label for="startDate">De:</label>
          <input type="date" id="startDate" [(ngModel)]="filters.startDate" (change)="loadEntries()">
        </div>
        <div class="filter-group">
          <label for="endDate">Até:</label>
          <input type="date" id="endDate" [(ngModel)]="filters.endDate" (change)="loadEntries()">
        </div>
        <div class="filter-group">
          <label for="transactionType">Tipo:</label>
          <select id="transactionType" [(ngModel)]="filters.transactionType" (change)="loadEntries()">
            <option value="">Todos</option>
            <option value="INCOME">Entradas</option>
            <option value="EXPENSE">Saídas</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="category">Categoria:</label>
          <select id="category" [(ngModel)]="filters.category" (change)="loadEntries()">
            <option value="">Todas</option>
            <option value="SERVICE_PAYMENT">Pagamento de Serviço</option>
            <option value="COMMISSION_PAYMENT">Comissão</option>
            <option value="TAX_PAYMENT">Impostos</option>
            <option value="GATEWAY_FEE">Taxa Gateway</option>
            <option value="PRODUCT_COST">Custo de Produtos</option>
            <option value="FIXED_EXPENSE">Despesa Fixa</option>
            <option value="VARIABLE_EXPENSE">Despesa Variável</option>
            <option value="OTHER">Outros</option>
          </select>
        </div>
        <button class="btn btn-secondary" (click)="clearFilters()">
          <i class="fas fa-times"></i>
          Limpar Filtros
        </button>
      </div>

      <!-- Tabela de Entradas/Saídas -->
      <div class="table-container">
        <table class="ledger-table">
            <thead>
            <tr>
              <th (click)="onSort('transaction_date')" class="sortable">
                Data
                <i class="fas" [ngClass]="getSortIcon('transaction_date')"></i>
              </th>
              <th (click)="onSort('transaction_type')" class="sortable">
                Tipo
                <i class="fas" [ngClass]="getSortIcon('transaction_type')"></i>
              </th>
              <th (click)="onSort('category')" class="sortable">
                Categoria
                <i class="fas" [ngClass]="getSortIcon('category')"></i>
              </th>
              <th>Descrição</th>
              <th (click)="onSort('amount')" class="sortable">
                Valor
                <i class="fas" [ngClass]="getSortIcon('amount')"></i>
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="loading">
              <td colspan="6" class="loading-row">
                <i class="fas fa-spinner fa-spin"></i>
                Carregando...
              </td>
            </tr>
            <tr *ngIf="!loading && paginatedEntries.length === 0">
              <td colspan="6" class="empty-row">
                Nenhuma entrada encontrada
              </td>
            </tr>
            <tr *ngFor="let entry of paginatedEntries" [class.income]="entry.transaction_type === 'INCOME'" [class.expense]="entry.transaction_type === 'EXPENSE'">
              <td>{{ entry.transaction_date | date:'dd/MM/yyyy' }}</td>
              <td>
                <span class="badge" [class.badge-income]="entry.transaction_type === 'INCOME'" [class.badge-expense]="entry.transaction_type === 'EXPENSE'">
                  {{ entry.transaction_type === 'INCOME' ? 'Entrada' : 'Saída' }}
                </span>
              </td>
              <td>{{ getCategoryLabel(entry.category) }}</td>
              <td>{{ entry.description || '-' }}</td>
              <td [class.income-amount]="entry.transaction_type === 'INCOME'" [class.expense-amount]="entry.transaction_type === 'EXPENSE'">
                {{ entry.transaction_type === 'INCOME' ? '+' : '-' }}{{ (entry.amount / 100) | currency:'BRL' }}
              </td>
              <td>
                <button class="btn btn-sm btn-edit" (click)="openEditModal(entry)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-delete" (click)="confirmDelete(entry)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="!loading && sortedEntries.length > 0">
        <div class="pagination-controls">
          <label for="pageSize">Itens por página:</label>
          <select id="pageSize" [(ngModel)]="itemsPerPage" (change)="onPageSizeChange()">
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
            <option [value]="200">200</option>
          </select>
          <span class="page-info">
            Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, sortedEntries.length) }} de {{ sortedEntries.length }}
          </span>
        </div>
        <div class="pagination-buttons">
          <button class="page-btn" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button class="page-btn" [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Resumo -->
      <div class="summary">
        <div class="summary-card income">
          <h3>Total de Entradas</h3>
          <p>{{ totalIncome | currency:'BRL' }}</p>
        </div>
        <div class="summary-card expense">
          <h3>Total de Saídas</h3>
          <p>{{ totalExpense | currency:'BRL' }}</p>
        </div>
        <div class="summary-card profit" [class.negative]="netProfit < 0">
          <h3>Saldo</h3>
          <p>{{ netProfit | currency:'BRL' }}</p>
        </div>
      </div>

      <!-- Modal de Criação/Edição -->
      <div class="modal" *ngIf="showModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingEntry ? 'Editar' : 'Nova' }} Entrada/Saída</h2>
            <button class="btn-close" (click)="closeModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form (ngSubmit)="saveEntry()" class="modal-body">
            <div class="form-group">
              <label for="modalTransactionType">Tipo *</label>
              <select id="modalTransactionType" [(ngModel)]="formData.transactionType" name="transactionType" required>
                <option value="INCOME">Entrada</option>
                <option value="EXPENSE">Saída</option>
              </select>
            </div>
            <div class="form-group">
              <label for="modalCategory">Categoria *</label>
              <select id="modalCategory" [(ngModel)]="formData.category" name="category" required>
                <option value="SERVICE_PAYMENT">Pagamento de Serviço</option>
                <option value="COMMISSION_PAYMENT">Comissão</option>
                <option value="TAX_PAYMENT">Impostos</option>
                <option value="GATEWAY_FEE">Taxa Gateway</option>
                <option value="PRODUCT_COST">Custo de Produtos</option>
                <option value="FIXED_EXPENSE">Despesa Fixa</option>
                <option value="VARIABLE_EXPENSE">Despesa Variável</option>
                <option value="OTHER">Outros</option>
              </select>
            </div>
            <div class="form-group">
              <label for="modalAmount">Valor (R$) *</label>
              <input type="number" id="modalAmount" [(ngModel)]="formData.amount" name="amount" step="0.01" min="0" required>
            </div>
            <div class="form-group">
              <label for="modalDescription">Descrição</label>
              <textarea id="modalDescription" [(ngModel)]="formData.description" name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label for="modalDate">Data *</label>
              <input type="date" id="modalDate" [(ngModel)]="formData.transactionDate" name="transactionDate" required>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                <i class="fas fa-spinner fa-spin" *ngIf="saving"></i>
                {{ saving ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal de Confirmação de Exclusão -->
      <div class="modal" *ngIf="showDeleteModal" (click)="closeDeleteModal($event)">
        <div class="modal-content modal-small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirmar Exclusão</h2>
            <button class="btn-close" (click)="closeDeleteModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p>Tem certeza que deseja excluir esta entrada?</p>
            <p class="entry-info">
              <strong>{{ entryToDelete?.transaction_type === 'INCOME' ? 'Entrada' : 'Saída' }}</strong> - 
              {{ entryToDelete?.description || 'Sem descrição' }} - 
              {{ entryToDelete ? (entryToDelete.amount / 100 | currency:'BRL') : '' }}
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeDeleteModal()">Cancelar</button>
            <button type="button" class="btn btn-danger" (click)="deleteEntry()" [disabled]="deleting">
              <i class="fas fa-spinner fa-spin" *ngIf="deleting"></i>
              {{ deleting ? 'Excluindo...' : 'Excluir' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .financial-ledger {
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      align-items: flex-end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .filter-group input,
    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .table-container {
      overflow-x: auto;
      margin-bottom: 2rem;
    }

    .ledger-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .ledger-table th {
      background: #f5f5f5;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #ddd;
      
      &.sortable {
        cursor: pointer;
        user-select: none;
        position: relative;
        padding-right: 2rem;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: #e8e8e8;
        }
        
        i {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          font-size: 0.875rem;
          transition: color 0.2s;
        }
        
        &:hover i {
          color: #1976d2;
        }
      }
    }

    .ledger-table td {
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }

    .ledger-table tr:hover {
      background: #f9f9f9;
    }

    .ledger-table tr.income {
      border-left: 4px solid #4caf50;
    }

    .ledger-table tr.expense {
      border-left: 4px solid #f44336;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge-income {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge-expense {
      background: #ffebee;
      color: #c62828;
    }

    .income-amount {
      color: #4caf50;
      font-weight: 600;
    }

    .expense-amount {
      color: #f44336;
      font-weight: 600;
    }

    .loading-row,
    .empty-row {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 2rem;
    }

    .summary-card {
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .summary-card.income {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
    }

    .summary-card.expense {
      background: #ffebee;
      border-left: 4px solid #f44336;
    }

    .summary-card.profit {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
    }

    .summary-card.profit.negative {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
    }

    .summary-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: #666;
    }

    .summary-card p {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #2196f3;
      color: white;
    }

    .btn-primary:hover {
      background: #1976d2;
    }

    .btn-secondary {
      background: #757575;
      color: white;
    }

    .btn-secondary:hover {
      background: #616161;
    }

    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      margin: 0 0.25rem;
    }

    .btn-edit {
      background: #ff9800;
      color: white;
    }

    .btn-edit:hover {
      background: #f57c00;
    }

    .btn-delete {
      background: #f44336;
      color: white;
    }

    .btn-delete:hover {
      background: #d32f2f;
    }

    .btn-danger {
      background: #f44336;
      color: white;
    }

    .btn-danger:hover {
      background: #d32f2f;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-small {
      max-width: 400px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-group textarea {
      resize: vertical;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #eee;
    }

    .entry-info {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      margin: 1rem 0;
    }

    .pagination {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 2rem;
      
      .pagination-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 8px;
        
        label {
          color: #333;
          font-weight: 500;
        }
        
        select {
          padding: 0.25rem 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
          
          &:focus {
            outline: none;
            border-color: #1976d2;
          }
        }
        
        .page-info {
          color: #666;
          font-size: 0.875rem;
        }
      }
      
      .pagination-buttons {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
      }
      
      .page-btn {
        padding: 0.5rem;
        background: transparent;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover:not(:disabled) {
          background: #f5f5f5;
          transform: translateY(-1px);
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  `]
})
export class FinancialLedgerComponent implements OnInit {
  entries: FinancialLedgerEntry[] = [];
  sortedEntries: FinancialLedgerEntry[] = [];
  paginatedEntries: FinancialLedgerEntry[] = [];
  loading = false;
  showModal = false;
  showDeleteModal = false;
  editingEntry: FinancialLedgerEntry | null = null;
  entryToDelete: FinancialLedgerEntry | null = null;
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions = [10, 25, 50, 200];
  totalPages = 1;
  sortConfig: TableSort = { column: '', direction: '' };
  Math = Math;
  saving = false;
  deleting = false;

  filters = {
    startDate: '',
    endDate: '',
    transactionType: '',
    category: ''
  };

  formData = {
    transactionType: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: 'OTHER',
    amount: 0,
    description: '',
    transactionDate: new Date().toISOString().split('T')[0]
  };

  totalIncome = 0;
  totalExpense = 0;
  netProfit = 0;

  constructor(
    private financialService: FinancialService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private tableUtils: TableUtilsService
  ) {
    // Define datas padrão (últimos 30 dias)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.filters.endDate = end.toISOString().split('T')[0];
    this.filters.startDate = start.toISOString().split('T')[0];
  }

  ngOnInit() {
    setTimeout(() => {
      this.loadEntries();
    }, 0);
  }

  loadEntries() {
    this.loading = true;
    this.financialService.getLedgerEntries({
      startDate: this.filters.startDate || undefined,
      endDate: this.filters.endDate || undefined,
      transactionType: this.filters.transactionType as 'INCOME' | 'EXPENSE' || undefined,
      category: this.filters.category || undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.entries = response.data;
          this.applySortAndPagination();
          this.calculateTotals();
        }
        this.loading = false;
      },
      error: (err) => {
        this.notificationService.error('Erro ao carregar entradas.');
        console.error('Error loading entries:', err);
        this.loading = false;
      }
    });
  }

  applySortAndPagination() {
    // Aplicar ordenação
    this.sortedEntries = this.tableUtils.sortData(this.entries, this.sortConfig.column, this.sortConfig.direction);
    
    // Recalcular paginação
    this.totalPages = this.tableUtils.calculateTotalPages(this.sortedEntries.length, this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
    
    // Aplicar paginação
    this.paginatedEntries = this.tableUtils.paginateData(this.sortedEntries, this.currentPage, this.itemsPerPage);
  }

  onSort(column: string): void {
    this.sortConfig = this.tableUtils.toggleSort(this.sortConfig, column);
    this.applySortAndPagination();
  }

  getSortIcon(column: string): string {
    if (this.sortConfig.column !== column) {
      return 'fa-sort';
    }
    return this.sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.applySortAndPagination();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.applySortAndPagination();
  }

  calculateTotals() {
    this.totalIncome = this.entries
      .filter(e => e.transaction_type === 'INCOME')
      .reduce((sum, e) => sum + (e.amount / 100), 0);
    
    this.totalExpense = this.entries
      .filter(e => e.transaction_type === 'EXPENSE')
      .reduce((sum, e) => sum + (e.amount / 100), 0);
    
    this.netProfit = this.totalIncome - this.totalExpense;
  }

  clearFilters() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.filters = {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      transactionType: '',
      category: ''
    };
    this.loadEntries();
  }

  openCreateModal() {
    this.editingEntry = null;
    this.formData = {
      transactionType: 'INCOME',
      category: 'OTHER',
      amount: 0,
      description: '',
      transactionDate: new Date().toISOString().split('T')[0]
    };
    this.showModal = true;
  }

  openEditModal(entry: FinancialLedgerEntry) {
    this.editingEntry = entry;
    this.formData = {
      transactionType: entry.transaction_type,
      category: entry.category,
      amount: entry.amount / 100, // Converter de centavos para reais
      description: entry.description || '',
      transactionDate: new Date(entry.transaction_date).toISOString().split('T')[0]
    };
    this.showModal = true;
  }

  closeModal(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal')) {
      this.showModal = false;
    } else if (!event) {
      this.showModal = false;
    }
  }

  saveEntry() {
    if (!this.formData.transactionType || !this.formData.category || !this.formData.amount) {
      this.notificationService.error('Preencha todos os campos obrigatórios.');
      return;
    }

    this.saving = true;
    const user = this.authService.currentUser;

    if (this.editingEntry) {
      // Atualizar
      this.financialService.updateLedgerEntry(this.editingEntry.id, {
        transactionType: this.formData.transactionType,
        category: this.formData.category,
        amount: this.formData.amount,
        description: this.formData.description,
        transactionDate: this.formData.transactionDate
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Entrada atualizada com sucesso!');
            this.closeModal();
            this.loadEntries();
          }
          this.saving = false;
        },
        error: (err) => {
          this.notificationService.error('Erro ao atualizar entrada.');
          console.error('Error updating entry:', err);
          this.saving = false;
        }
      });
    } else {
      // Criar
      this.financialService.createLedgerEntry({
        transactionType: this.formData.transactionType,
        category: this.formData.category,
        amount: this.formData.amount,
        description: this.formData.description,
        transactionDate: this.formData.transactionDate,
        createdBy: user?.id
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Entrada criada com sucesso!');
            this.closeModal();
            this.loadEntries();
          }
          this.saving = false;
        },
        error: (err) => {
          this.notificationService.error('Erro ao criar entrada.');
          console.error('Error creating entry:', err);
          this.saving = false;
        }
      });
    }
  }

  confirmDelete(entry: FinancialLedgerEntry) {
    this.entryToDelete = entry;
    this.showDeleteModal = true;
  }

  closeDeleteModal(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal')) {
      this.showDeleteModal = false;
    } else if (!event) {
      this.showDeleteModal = false;
    }
    this.entryToDelete = null;
  }

  deleteEntry() {
    if (!this.entryToDelete) return;

    this.deleting = true;
    this.financialService.deleteLedgerEntry(this.entryToDelete.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Entrada excluída com sucesso!');
          this.closeDeleteModal();
          this.loadEntries();
        }
        this.deleting = false;
      },
      error: (err) => {
        this.notificationService.error('Erro ao excluir entrada.');
        console.error('Error deleting entry:', err);
        this.deleting = false;
      }
    });
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'SERVICE_PAYMENT': 'Pagamento de Serviço',
      'COMMISSION_PAYMENT': 'Comissão',
      'TAX_PAYMENT': 'Impostos',
      'GATEWAY_FEE': 'Taxa Gateway',
      'PRODUCT_COST': 'Custo de Produtos',
      'FIXED_EXPENSE': 'Despesa Fixa',
      'VARIABLE_EXPENSE': 'Despesa Variável',
      'OTHER': 'Outros'
    };
    return labels[category] || category;
  }
}

