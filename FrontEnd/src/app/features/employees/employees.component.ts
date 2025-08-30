import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService, Employee } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

type EmployeeRole = Employee['role'];

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
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Carregando funcionários...</span>
      </div>

      <!-- Error Message -->
      <div class="error-message" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
        <button class="retry-btn" (click)="loadEmployees()">
          <i class="fas fa-redo"></i>
          Tentar Novamente
        </button>
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
            routerLink="/employees/new" 
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

      <!-- Employees List -->
      <div class="employees-list" *ngIf="!isLoading">
        <div class="table-header">
          <span class="results-count">
            {{ filteredEmployees.length }} funcionário{{ filteredEmployees.length !== 1 ? 's' : '' }} encontrado{{ filteredEmployees.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <div class="employee-card" *ngFor="let employee of paginatedEmployees">
          <div class="employee-info">
            <div class="status-indicator" [class]="employee.status"></div>
            <h3>{{ employee.name }}</h3>
            <p class="role">{{ getRoleLabel(employee.role) }}</p>
            <p class="email">{{ employee.email }}</p>
            <p class="phone">{{ employee.phone }}</p>
            <p class="department">{{ getDepartmentLabel(employee.department) }}</p>
          </div>
          <div class="employee-actions">
            <button 
              class="edit-btn" 
              [routerLink]="['/employees/', employee.id]"
              title="Editar funcionário"
              *ngIf="authService.canAccessRoute('employees/:id')"
            >
              <i class="fas fa-edit"></i>
              Editar
            </button>
            <button 
              class="status-btn" 
              [class.inactive]="employee.status === 'inactive'" 
              [class.on-leave]="employee.status === 'on_leave'"
              (click)="toggleStatus(employee)"
              title="Alterar status"
              *ngIf="authService.canAccessRoute('employees/:id')"
            >
              <i class="fas" [class]="getStatusIcon(employee.status)"></i>
              {{ getStatusLabel(employee.status) }}
            </button>
            <button 
              class="delete-btn" 
              (click)="confirmDelete(employee)"
              title="Excluir funcionário"
              *ngIf="authService.canAccessRoute('employees/:id')"
            >
              <i class="fas fa-trash"></i>
              Excluir
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="filteredEmployees.length === 0">
          <i class="fas fa-users"></i>
          <h3>Nenhum funcionário encontrado</h3>
          <p>Tente ajustar os filtros ou realizar uma nova busca</p>
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

    .employees-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .table-header {
      grid-column: 1 / -1;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .results-count {
      color: #666;
      font-size: 0.875rem;
    }

    .employee-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: relative;
    }

    .status-indicator {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-indicator.active {
      background: #4caf50;
    }

    .status-indicator.inactive {
      background: #f44336;
    }

    .employee-info h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .role {
      color: #1976d2;
      font-weight: 500;
      margin: 0 0 1rem 0;
    }

    .email, .phone, .crm {
      color: #666;
      margin: 0.25rem 0;
    }

    .employee-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }

    .employee-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .edit-btn {
      background: #f5f5f5;
      color: #666;
    }

    .status-btn {
      background: #4caf50;
      color: white;
    }

    .status-btn.inactive {
      background: #f44336;
    }

    .delete-btn {
      background: #f44336;
      color: white;
    }

    .employee-actions button:hover {
      opacity: 0.9;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .empty-state i {
      font-size: 3rem;
      color: #ddd;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #333;
      margin: 0 0 0.5rem;
    }

    .empty-state p {
      color: #666;
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
    }

    .page-btn:hover:not(:disabled) {
      background: #f5f5f5;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #333;
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

  roles: RoleOption[] = [
    { value: 'medico', label: 'Médico' },
    { value: 'enfermeiro', label: 'Enfermeiro' },
    { value: 'recepcionista', label: 'Recepcionista' },
    { value: 'administrativo', label: 'Administrativo' }
  ];

  departments = {
    clinica: 'Clínica Geral',
    pediatria: 'Pediatria',
    cardiologia: 'Cardiologia',
    neurologia: 'Neurologia',
    ortopedia: 'Ortopedia',
    administrativo: 'Administrativo'
  };

  filters: Filters = {
    status: {
      active: true,
      inactive: true,
      on_leave: true
    },
    roles: {
      medico: true,
      enfermeiro: true,
      recepcionista: true,
      administrativo: true
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
        this.employees = employees;
        this.filterEmployees();
        this.isLoading = false;
      },
      error: (error) => {
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
        employee.name.toLowerCase().includes(search) ||
        employee.email.toLowerCase().includes(search) ||
        employee.phone.includes(search)
      );
    }

    // Status filter
    const activeStatuses = Object.entries(this.filters.status)
      .filter(([_, isActive]) => isActive)
      .map(([status]) => status);

    if (activeStatuses.length > 0) {
      filtered = filtered.filter(employee => activeStatuses.includes(employee.status));
    }

    // Role filter
    const activeRoles = Object.entries(this.filters.roles)
      .filter(([_, isActive]) => isActive)
      .map(([role]) => role as EmployeeRole);

    if (activeRoles.length > 0) {
      filtered = filtered.filter(employee => activeRoles.includes(employee.role));
    }

    this.filteredEmployees = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
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

  getDepartmentLabel(department: string): string {
    return this.departments[department as keyof typeof this.departments] || department;
  }

  getStatusLabel(status: Employee['status']): string {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'on_leave': return 'Em Licença';
      default: return status;
    }
  }

  getStatusIcon(status: Employee['status']): string {
    switch (status) {
      case 'active': return 'fa-check';
      case 'inactive': return 'fa-times';
      case 'on_leave': return 'fa-clock';
      default: return 'fa-question';
    }
  }

  toggleStatus(employee: Employee) {
    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    this.employeeService.updateEmployee(employee.id, { status: newStatus }).subscribe({
      next: () => {
        this.notificationService.success(
          `Funcionário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`
        );
        this.loadEmployees();
      },
      error: (error) => {
        this.notificationService.error(
          'Erro ao alterar status do funcionário. Por favor, tente novamente.'
        );
      }
    });
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
}
