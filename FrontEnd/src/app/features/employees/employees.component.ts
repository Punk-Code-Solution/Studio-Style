import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService, Employee } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { EmployeeFormModalComponent } from './employee-form-modal/employee-form-modal.component';

type EmployeeRole = Employee['TypeAccount']['type'];

interface RoleOption {
  value: EmployeeRole;
  label: string;
}

interface StatusFilters {
  active: boolean;
  inactive: boolean;
  on_leave: boolean;
}

type RoleFilters = Record<EmployeeRole, boolean>;

interface Filters {
  status: StatusFilters;
  roles: RoleFilters;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EmployeeFormModalComponent],
  template: `
    <div class="page-container">
      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Carregando funcionários...</span>
      </div>

      <!-- Header Section -->
      <div class="header">
        <div class="header-left">
          <h2>Funcionários</h2>
          <div class="search">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Buscar funcionários..." 
              [(ngModel)]="searchTerm" 
              (input)="filterEmployees()"
              [disabled]="isLoading"
            >
          </div>
        </div>

        <div class="header-right">
          <button class="filter-btn" (click)="toggleFilter()" [disabled]="isLoading">
            <i class="fas fa-filter"></i>
            Filtros
          </button>
          <button 
            class="add-btn" 
            (click)="openCreateModal()" 
            [disabled]="isLoading"
          >
            <i class="fas fa-plus"></i>
            Novo Funcionário
          </button>
        </div>
      </div>

      <!-- Filter Panel -->
      <div class="filter-panel" [class.show]="isFilterOpen" *ngIf="!isLoading">
        <div class="filter-group">
          <label>Status</label>
          <div class="filter-options">
            <label class="checkbox">
              <input 
                type="checkbox" 
                [(ngModel)]="filters.status.active" 
                (change)="filterEmployees()"
              >
              <span>Ativos</span>
            </label>
            <label class="checkbox">
              <input 
                type="checkbox" 
                [(ngModel)]="filters.status.inactive" 
                (change)="filterEmployees()"
              >
              <span>Inativos</span>
            </label>
            <label class="checkbox">
              <input 
                type="checkbox" 
                [(ngModel)]="filters.status.on_leave" 
                (change)="filterEmployees()"
              >
              <span>Em Licença</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label>Cargo</label>
          <div class="filter-options">
            <label class="checkbox" *ngFor="let role of roles">
              <input 
                type="checkbox" 
                [(ngModel)]="filters.roles[role.value]" 
                (change)="filterEmployees()"
              >
              <span>{{ role.label }}</span>
            </label>
          </div>
        </div>

        <div class="filter-actions">
          <button class="clear-btn" (click)="clearFilters()">Limpar Filtros</button>
        </div>
      </div>

      <!-- Employees Grid -->
      <div class="employees-grid" *ngIf="!isLoading">
        <div class="employees-table">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let employee of employees">
                <td>
                  <div class="user-info">
                    <div class="employee-details">
                      <span>{{ employee.name }}</span>
                      <span>{{ employee.lastname }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ employee.Emails || 'N/A' }}</td>
                <td>{{ getRoleLabel(employee.TypeAccount.type) }}</td>
                <td>
                  <span class="status-badge" [class]="getStatusClass(employee)">
                    {{ getStatusLabel(employee.deleted) }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="action-btn" [routerLink]="['/employees/', employee.id]" title="Editar funcionário">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" (click)="confirmDelete(employee)" title="Excluir funcionário">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="employees.length === 0">
                <td colspan="5" class="empty-state">
                  <p>Nenhum funcionário encontrado</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="!isLoading && filteredEmployees.length > 0">
        <button 
          class="page-btn" 
          [disabled]="currentPage === 1" 
          (click)="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <button 
          class="page-btn" 
          [disabled]="currentPage === totalPages" 
          (click)="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <!-- Employee Form Modal -->
      <app-employee-form-modal
        *ngIf="isModalOpen"
        [employee]="selectedEmployee"
        [loading]="isSubmitting"
        (close)="closeModal()"
        (save)="onSaveEmployee($event)"
      ></app-employee-form-modal>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    h2 {
      color: #1976d2;
      margin: 0;
    }

    .search {
      position: relative;
      width: 300px;
    }

    .search i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    .search input {
      width: 100%;
      padding: 0.5rem 1rem 0.5rem 2.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .search input:focus {
      outline: none;
      border-color: #1976d2;
    }

    .header-right {
      display: flex;
      gap: 1rem;
    }

    .filter-btn, .add-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn {
      background: #f5f5f5;
      color: #333;
    }

    .add-btn {
      background: #1976d2;
      color: white;
    }

    .filter-btn:hover, .add-btn:hover {
      opacity: 0.9;
    }

    .filter-panel {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: none;
    }

    .filter-panel.show {
      display: block;
    }

    .filter-group {
      margin-bottom: 1.5rem;
    }

    .filter-group label {
      display: block;
      color: #333;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .filter-options {
      display: flex;
      gap: 2rem;
    }

    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox input {
      width: 16px;
      height: 16px;
    }

    .filter-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .clear-btn {
      padding: 0.5rem 1rem;
      background: transparent;
      color: #333;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
    }

    .clear-btn:hover {
      background: #f5f5f5;
    }

    .employees-grid {
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .employees-table {
      overflow-x: auto;
    }

    .employees-table::-webkit-scrollbar {
      height: 8px;
    }

    .employees-table::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .employees-table::-webkit-scrollbar-thumb {
      background: #1976d2;
      border-radius: 4px;
    }

    .employees-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .employees-table th,
    .employees-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    .employees-table th {
      background-color: #f5f5f5;
      color: #333;
      font-weight: 500;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .employees-table td {
      color: #333;
      font-size: 0.875rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .employee-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .employee-details span {
      color: #333;
    }

    .employee-details span:first-child {
      font-weight: 500;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.active {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .status-badge.inactive {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .status-badge.on-leave {
      background-color: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .action-btn {
      background: transparent;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 0.25rem;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .action-btn:hover {
      color: #1976d2;
      background-color: rgba(25, 118, 210, 0.1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .empty-state p {
      margin: 0;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .page-btn {
      padding: 0.5rem;
      background: transparent;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #f5f5f5;
      transform: translateY(-1px);
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #333;
      font-size: 0.875rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      color: #666;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      background: #ffebee;
      color: #d32f2f;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .error-message i {
      font-size: 1.25rem;
    }

    .retry-btn {
      margin-left: auto;
      background: transparent;
      border: 1px solid #d32f2f;
      color: #d32f2f;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .retry-btn:hover {
      background: rgba(211, 47, 47, 0.1);
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 1rem;
      }

      .header-left {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .search {
        width: 100%;
      }

      .header-right {
        width: 100%;
        justify-content: space-between;
      }

      .filter-options {
        flex-direction: column;
        gap: 0.5rem;
      }

      .employees-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  searchTerm = '';
  isFilterOpen = false;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;
  errorMessage: string | null = null;
  isModalOpen = false;
  isSubmitting = false;
  selectedEmployee: Employee | null = null;

  roles: RoleOption[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'provider', label: 'Colaborador' }
  ];

  filters: Filters = {
    status: {
      active: true,
      inactive: true,
      on_leave: true
    },
    roles: {
      admin: true,
      provider: true,
      client: false,
      ninguem: false
    }
  };

  constructor(
    private employeeService: EmployeeService,
    public authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.isLoading = true;
    this.errorMessage = null;

    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        console.log('Employees loaded:', employees);
        this.employees = employees;
        this.filterEmployees();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.errorMessage = 'Erro ao carregar funcionários. Por favor, tente novamente.';
        this.isLoading = false;
      }
    });
  }

  get paginatedEmployees(): Employee[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredEmployees.slice(start, end);
  }

  filterEmployees() {
    let filtered = [...this.employees];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(employee =>
        (employee.name?.toLowerCase?.() ?? '').includes(search) ||
        (employee.Emails ?? '') ||
        (employee.Phones?.includes(search) ?? false)
      );
    }

    // Status filter
    const activeStatuses = Object.entries(this.filters.status)
      .filter(([_, isActive]) => isActive)
      .map(([status, _]) => status as Employee['TypeAccount']['type']);

    if (activeStatuses.length > 0) {
      filtered = filtered.filter(employee => activeStatuses.includes(employee.TypeAccount.type));
    }

    // Role filter
    const activeRoles = Object.entries(this.filters.roles)
      .filter(([_, isActive]) => isActive)
      .map(([role]) => role as EmployeeRole);

    if (activeRoles.length > 0) {
      filtered = filtered.filter(employee => activeRoles.includes(employee.TypeAccount.type));
    }

    this.filteredEmployees = filtered;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters() {
    this.searchTerm = '';
    this.filters.status.active = true;
    this.filters.status.inactive = true;
    this.filters.status.on_leave = true;
    Object.keys(this.filters.roles).forEach(role => {
      this.filters.roles[role as EmployeeRole] = true;
    });
    this.filterEmployees();
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  getRoleLabel(role: EmployeeRole): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  getStatusLabel(status: Employee['deleted']): string {
    if (status === null) {return 'Ativo'}
    else {return 'Inativo';}
  }

  getStatusClass(employee: Employee): string {
    if (employee.deleted != null) {return 'active';}
    else{ return "inactive";}
  }

  confirmDelete(employee: Employee) {
    if (confirm(`Tem certeza que deseja excluir o funcionário ${employee.name}?`)) {
      this.employeeService.deleteEmployee(employee.id).subscribe({
        next: () => {
          this.notificationService.success('Funcionário excluído com sucesso!');
          this.loadEmployees();
        },
        error: (error) => {
          this.notificationService.error(
            'Erro ao excluir funcionário. Por favor, tente novamente.'
          );
        }
      });
    }
  }

  openCreateModal(): void {
    this.selectedEmployee = null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedEmployee = null;
  }

  onSaveEmployee(employeeData: Partial<Employee>): void {
    if (!employeeData.name || !employeeData.lastname || !employeeData.Emails?.find(e => e.email)|| !employeeData.TypeAccount?.type) {
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isSubmitting = true;
    const request: Partial<Employee> = {
      ...employeeData,
      deleted: 'active'
    };

    this.employeeService.createEmployee(request).subscribe({
      next: () => {
        this.notificationService.success('Funcionário criado com sucesso!');
        this.closeModal();
        this.loadEmployees();
        this.isSubmitting = false;
      },
      error: (error: any) => {
        let errorMsg = 'Erro ao criar funcionário. Por favor, tente novamente.';
        
        if (error.status === 409) {
          errorMsg = 'Este funcionário já existe. Por favor, use um e-mail diferente.';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }
        
        this.notificationService.error(errorMsg);
        this.isSubmitting = false;
      }
    });
  }
}
