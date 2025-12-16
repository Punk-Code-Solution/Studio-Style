import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService, Employee } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { EmployeeFormModalComponent } from './employee-form-modal/employee-form-modal.component';
import { EmployeeViewModalComponent } from './employee-view-modal/employee-view-modal.component';
import { EmployeeDeleteModalComponent } from './employee-delete-modal/employee-delete-modal.component';
import { TableUtilsService, TableSort } from '../../core/services/table-utils.service';

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
  imports: [CommonModule, RouterModule, FormsModule, EmployeeFormModalComponent, EmployeeViewModalComponent, EmployeeDeleteModalComponent],
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
                <th (click)="onSort('name')" class="sortable">
                  Nome
                  <i class="fas" [ngClass]="getSortIcon('name')"></i>
                </th>
                <th (click)="onSort('email')" class="sortable">
                  E-mail
                  <i class="fas" [ngClass]="getSortIcon('email')"></i>
                </th>
                <th>Telefone</th>
                <th (click)="onSort('TypeAccount.type')" class="sortable">
                  Cargo
                  <i class="fas" [ngClass]="getSortIcon('TypeAccount.type')"></i>
                </th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let employee of paginatedEmployees">
                <td>
                  <div class="user-info">
                    <div class="employee-details">
                      <span>{{ employee.name }}</span>
                      <span>{{ employee.lastname }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ employee.email || 'N/A' }}</td>
                <td>{{ getEmployeePhone(employee) || 'N/A' }}</td>
                <td>{{ getRoleLabel(employee.TypeAccount.type) }}</td>
                <td>
                  <span class="status-badge" [class]="getStatusClass(employee)">
                    {{ getStatusLabel(employee) }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="action-btn" (click)="openViewModal(employee)" title="Visualizar funcionário">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" (click)="openEditModal(employee)" title="Editar funcionário">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" (click)="confirmDelete(employee)" title="Excluir funcionário">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="paginatedEmployees.length === 0">
                <td colspan="6" class="empty-state">
                  <p>Nenhum funcionário encontrado</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="!isLoading && sortedEmployees.length > 0">
        <div class="pagination-controls">
          <label for="pageSize">Itens por página:</label>
          <select id="pageSize" [(ngModel)]="itemsPerPage" (change)="onPageSizeChange()">
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
            <option [value]="200">200</option>
          </select>
          <span class="page-info">
            Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, sortedEmployees.length) }} de {{ sortedEmployees.length }}
          </span>
        </div>
        <div class="pagination-buttons">
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

      <!-- Employee Form Modal -->
      <app-employee-form-modal
        *ngIf="isModalOpen"
        [employee]="selectedEmployee"
        [loading]="isSubmitting"
        (close)="closeModal()"
        (save)="onSaveEmployee($event)"
      ></app-employee-form-modal>

      <!-- Employee View Modal -->
      <app-employee-view-modal
        *ngIf="isViewModalOpen"
        [employee]="selectedEmployee"
        (close)="onCloseViewModal()"
        (edit)="onEditFromViewModal()"
      ></app-employee-view-modal>

      <!-- Employee Delete Modal -->
      <app-employee-delete-modal
        *ngIf="isDeleteModalOpen"
        [employee]="selectedEmployee"
        [loading]="isDeleteLoading"
        (close)="onCloseDeleteModal()"
        (confirm)="onConfirmDelete()"
      ></app-employee-delete-modal>
    </div>
  `,
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  sortedEmployees: Employee[] = [];
  paginatedEmployees: Employee[] = [];
  searchTerm = '';
  isFilterOpen = false;
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions = [10, 25, 50, 200];
  totalPages = 1;
  isLoading = false;
  errorMessage: string | null = null;
  sortConfig: TableSort = { column: '', direction: '' };
  Math = Math;
  isModalOpen = false;
  isSubmitting = false;
  selectedEmployee: Employee | null = null;
  isViewModalOpen = false;
  isDeleteModalOpen = false;
  isDeleteLoading = false;

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
      client: false
    }
  };

  constructor(
    private employeeService: EmployeeService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private tableUtils: TableUtilsService
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
    filtered = filtered.filter(employee => {
      const status = employee.status || (employee.deleted ? 'inactive' : 'active');

      if (status === 'on_leave') {
        return this.filters.status.on_leave;
      }

      if (status === 'inactive') {
        return this.filters.status.inactive;
      }

      // Default to active
      return this.filters.status.active;
    });

    // Role filter
    const activeRoles = Object.entries(this.filters.roles)
      .filter(([_, isActive]) => isActive)
      .map(([role]) => role as EmployeeRole);

    if (activeRoles.length > 0) {
      filtered = filtered.filter(employee => activeRoles.includes(employee.TypeAccount.type));
    }

    // Aplicar ordenação
    this.sortedEmployees = this.tableUtils.sortData(filtered, this.sortConfig.column, this.sortConfig.direction);
    this.filteredEmployees = this.sortedEmployees; // Mantém para compatibilidade
    
    // Recalcular paginação
    this.totalPages = this.tableUtils.calculateTotalPages(this.sortedEmployees.length, this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
    
    // Aplicar paginação
    this.paginatedEmployees = this.tableUtils.paginateData(this.sortedEmployees, this.currentPage, this.itemsPerPage);
  }

  onSort(column: string): void {
    this.sortConfig = this.tableUtils.toggleSort(this.sortConfig, column);
    this.filterEmployees();
  }

  getSortIcon(column: string): string {
    if (this.sortConfig.column !== column) {
      return 'fa-sort';
    }
    return this.sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.filterEmployees();
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
    this.currentPage = 1;
    this.filterEmployees();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.filterEmployees();
  }

  getRoleLabel(role: EmployeeRole): string {
    const roleObj = this.roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  }

  getStatusLabel(employee: Employee): string {
    const status = employee.status || (employee.deleted ? 'inactive' : 'active');

    switch (status) {
      case 'inactive':
        return 'Inativo';
      case 'on_leave':
        return 'Em licença';
      default:
        return 'Ativo';
    }
  }

  getStatusClass(employee: Employee): string {
    const status = employee.status || (employee.deleted ? 'inactive' : 'active');

    if (status === 'on_leave') {
      return 'on-leave';
    }

    return status === 'inactive' ? 'inactive' : 'active';
  }

  getEmployeePhone(employee: Employee): string | null {
    // Se já tem phone mapeado, usar
    if (employee.phone) {
      return employee.phone;
    }
    
    // Caso contrário, tentar extrair do array Phones (aceita tanto Phones quanto phones)
    const phonesArray = (employee as any).Phones || (employee as any).phones || [];
    if (phonesArray && phonesArray.length > 0) {
      const phoneObj = phonesArray[0];
      
      // Se phoneObj já é uma string, usar diretamente
      if (typeof phoneObj === 'string') {
        return phoneObj;
      }
      
      // Se phoneObj é um objeto (Phones é any[], então usamos type assertion)
      if (phoneObj && typeof phoneObj === 'object') {
        const phoneNumber = (phoneObj as any).phone;
        const ddd = (phoneObj as any).ddd;
        
        if (ddd && phoneNumber) {
          return `(${ddd}) ${phoneNumber}`;
        } else if (phoneNumber) {
          return String(phoneNumber);
        }
      }
    }
    
    return null;
  }

  confirmDelete(employee: Employee) {
    this.selectedEmployee = employee;
    this.isDeleteModalOpen = true;
  }

  onCloseDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedEmployee = null;
  }

  onConfirmDelete(): void {
    if (!this.selectedEmployee) return;

    this.isDeleteLoading = true;
    this.employeeService.deleteEmployee(this.selectedEmployee.id).subscribe({
      next: () => {
        this.notificationService.success('Funcionário excluído com sucesso!');
        this.onCloseDeleteModal();
        this.loadEmployees();
        this.isDeleteLoading = false;
      },
      error: (error) => {
        // Não recarregar a tabela em caso de erro
        this.isDeleteLoading = false;
        
        // Tratar erro específico de registros relacionados (409) - usar warning ao invés de error
        if (error?.status === 409) {
          const errorMsg = error?.error?.message || 'Este funcionário possui registros associados e não pode ser excluído.';
          this.notificationService.warning(errorMsg, 'Atenção');
        } else {
          // Tratar outros erros
          const errorMsg = error?.error?.message || error?.message || 'Não foi possível excluir o funcionário. Por favor, tente novamente.';
          this.notificationService.error(errorMsg);
        }
        // Garantir que o modal permaneça aberto para o usuário ver a mensagem
      }
    });
  }

  openCreateModal(): void {
    this.selectedEmployee = null;
    this.isModalOpen = true;
  }

  openViewModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.isViewModalOpen = true;
  }

  onCloseViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedEmployee = null;
  }

  onEditFromViewModal(): void {
    // Garantir que o selectedEmployee está definido antes de abrir o modal de edição
    if (this.selectedEmployee) {
      this.onCloseViewModal();
      // Abrir modal de edição com o colaborador selecionado
      this.openEditModal(this.selectedEmployee);
    }
  }

  openEditModal(employee: Employee): void {
    this.selectedEmployee = employee;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedEmployee = null;
  }

  onSaveEmployee(employeeData: Partial<Employee>): void {
    if (!employeeData.name || !employeeData.lastname || !employeeData.email || !employeeData.role) {
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isSubmitting = true;
    const request: Partial<Employee> = {
      name: employeeData.name,
      lastname: employeeData.lastname,
      email: employeeData.email,
      password: (employeeData as any).password,
      phone: employeeData.phone,
      role: employeeData.role,
      address: employeeData.address
    };

    // Incluir CPF se estiver disponível (para atualização)
    if (this.selectedEmployee?.cpf) {
      request.cpf = this.selectedEmployee.cpf;
    }

    // Verificar se está editando (selectedEmployee existe) ou criando novo
    const employeeId = this.selectedEmployee?.id;

    if (employeeId) {
      // Atualizar funcionário existente
      this.employeeService.updateEmployee(employeeId, request).subscribe({
        next: () => {
          this.notificationService.success('Funcionário atualizado com sucesso!');
          this.closeModal();
          this.loadEmployees();
          this.isSubmitting = false;
        },
        error: (error: any) => {
          let errorMsg = 'Erro ao atualizar funcionário. Por favor, tente novamente.';
          
          if (error.status === 400 || error.status === 422) {
            // Erro de validação
            if (error.error?.message) {
              errorMsg = error.error.message;
            } else if (error.error?.errors && Array.isArray(error.error.errors)) {
              const validationErrors = error.error.errors.map((e: any) => e.message || e.msg).join(', ');
              errorMsg = `Erro de validação: ${validationErrors}`;
            } else {
              errorMsg = 'Erro de validação. Verifique os dados informados.';
            }
          } else if (error.status === 409) {
            errorMsg = error.error?.message || 'Este funcionário já existe. Por favor, use um e-mail diferente.';
          } else if (error.error?.message) {
            errorMsg = error.error.message;
          }
          
          console.error('Erro ao atualizar funcionário:', error);
          this.notificationService.error(errorMsg);
          this.isSubmitting = false;
        }
      });
    } else {
      // Criar novo funcionário
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
            errorMsg = error.error?.message || 'Este funcionário já existe. Por favor, use um e-mail diferente.';
          } else if (error.error?.message) {
            errorMsg = error.error.message;
          }
          
          this.notificationService.error(errorMsg);
          this.isSubmitting = false;
        }
      });
    }
  }
}
