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
        <div class="header-left">
          <h1>Controle de Entradas e Saídas</h1>
        </div>
        <div class="header-right">
          <button 
            class="add-btn" 
            (click)="openCreateModal()"
            *ngIf="isAdmin()"
            [title]="'Apenas administradores podem criar entradas'">
            <i class="fas fa-plus"></i>
            Nova Entrada/Saída
          </button>
        </div>
      </div>

      <!-- Resumo -->
      <div class="summary" *ngIf="!loading">
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

      <!-- Filtros -->
      <div class="filter-panel">
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
        <div class="filter-actions">
          <button class="clear-btn" (click)="clearFilters()">
            <i class="fas fa-times"></i>
            Limpar Filtros
          </button>
        </div>
      </div>

      <!-- Tabela de Entradas/Saídas -->
      <div class="ledger-grid">
        <div class="ledger-table">
          <table>
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
                <div class="actions" *ngIf="isAdmin()">
                  <button 
                    class="action-btn" 
                    (click)="openEditModal(entry)" 
                    [disabled]="isVirtualEntry(entry)"
                    [title]="isVirtualEntry(entry) ? 'Entradas virtuais não podem ser editadas' : 'Editar entrada'"
                    [class.disabled]="isVirtualEntry(entry)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="action-btn delete-btn" 
                    (click)="confirmDelete(entry)" 
                    [disabled]="isVirtualEntry(entry)"
                    [title]="isVirtualEntry(entry) ? 'Entradas virtuais não podem ser excluídas' : 'Excluir entrada'"
                    [class.disabled]="isVirtualEntry(entry)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
                <div class="actions" *ngIf="!isAdmin()">
                  <span class="no-actions-text">Apenas administradores podem editar</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
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
  styleUrls: ['./financial-ledger.component.scss']
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
      startDate: this.filters.startDate && this.filters.startDate.trim() ? this.filters.startDate : undefined,
      endDate: this.filters.endDate && this.filters.endDate.trim() ? this.filters.endDate : undefined,
      transactionType: this.filters.transactionType && this.filters.transactionType.trim() ? (this.filters.transactionType as 'INCOME' | 'EXPENSE') : undefined,
      category: this.filters.category && this.filters.category.trim() ? this.filters.category : undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.entries = Array.isArray(response.data) ? response.data : [];
          this.applySortAndPagination();
          this.calculateTotals();
        } else {
          this.entries = [];
          this.applySortAndPagination();
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
    // Garantir que entries seja um array
    const entries = Array.isArray(this.entries) ? this.entries : [];
    
    // Aplicar ordenação
    this.sortedEntries = this.tableUtils.sortData(entries, this.sortConfig.column, this.sortConfig.direction);
    
    // Garantir que sortedEntries seja um array
    if (!Array.isArray(this.sortedEntries)) {
      this.sortedEntries = [];
    }
    
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
    // Verificar se é uma entrada virtual
    if (this.isVirtualEntry(entry)) {
      this.notificationService.warning(
        'Entradas virtuais não podem ser editadas. Elas são geradas automaticamente a partir de agendamentos finalizados.',
        'Atenção'
      );
      return;
    }
    
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
          const errorMsg = err?.error?.message || err?.message || 'Erro ao atualizar entrada. Por favor, tente novamente.';
          this.notificationService.error(errorMsg);
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
          const errorMsg = err?.error?.message || err?.message || 'Erro ao criar entrada. Por favor, tente novamente.';
          this.notificationService.error(errorMsg);
          console.error('Error creating entry:', err);
          this.saving = false;
        }
      });
    }
  }

  confirmDelete(entry: FinancialLedgerEntry) {
    // Verificar se é uma entrada virtual
    if (this.isVirtualEntry(entry)) {
      this.notificationService.warning(
        'Entradas virtuais não podem ser excluídas. Elas são geradas automaticamente a partir de agendamentos finalizados.',
        'Atenção'
      );
      return;
    }
    
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
        // Não recarregar a tabela em caso de erro
        this.deleting = false;
        
        // Tratar erro específico de registros relacionados (409) - usar warning ao invés de error
        if (err?.status === 409) {
          const errorMsg = err?.error?.message || 'Esta entrada possui registros associados e não pode ser excluída.';
          this.notificationService.warning(errorMsg, 'Atenção');
        } else {
          // Tratar outros erros
          const errorMsg = err?.error?.message || err?.message || 'Não foi possível excluir a entrada. Por favor, tente novamente.';
          console.error('Error deleting entry:', err);
          this.notificationService.error(errorMsg);
        }
        // Garantir que o modal permaneça aberto para o usuário ver a mensagem
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

  /**
   * Verifica se uma entrada é virtual (gerada automaticamente)
   */
  isVirtualEntry(entry: FinancialLedgerEntry): boolean {
    if (!entry || !entry.id) {
      return false;
    }
    const id = String(entry.id);
    return id.startsWith('virtual-income-') || id.startsWith('virtual-expense-') || entry.isVirtual === true;
  }

  /**
   * Verifica se o usuário atual é administrador
   */
  isAdmin(): boolean {
    return this.authService.hasRole('admin');
  }
}

