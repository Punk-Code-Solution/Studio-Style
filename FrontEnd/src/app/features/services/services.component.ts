import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicesService, Service } from '../../core/services/services.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ServiceFormModalComponent } from './service-form-modal/service-form-modal.component';
import { ServiceDeleteModalComponent } from './service-delete-modal/service-delete-modal.component';
import { ServiceViewModalComponent } from './service-view-modal/service-view-modal.component';
import { TableUtilsService, TableSort } from '../../core/services/table-utils.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ServiceFormModalComponent, ServiceDeleteModalComponent, ServiceViewModalComponent],
  template: `
    <div class="page-container">
      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Carregando serviços...</span>
      </div>

      <!-- Header Section -->
      <div class="header">
        <div class="header-left">
          <h2>Serviços</h2>
          <div class="search">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Buscar serviços..." 
              [(ngModel)]="searchTerm" 
              (input)="filterServices()"
              [disabled]="isLoading"
            >
          </div>
        </div>

        <div class="header-right">
          <button 
            *ngIf="isAdmin"
            class="add-btn" 
            (click)="openCreateModal()" 
            [disabled]="isLoading"
          >
            <i class="fas fa-plus"></i>
            Novo Serviço
          </button>
        </div>
      </div>

      <!-- Services Grid -->
      <div class="services-grid" *ngIf="!isLoading">
        <div class="services-table">
          <table>
            <thead>
              <tr>
                <th (click)="onSort('service')" class="sortable">
                  Serviço
                  <i class="fas" [ngClass]="getSortIcon('service')"></i>
                </th>
                <th (click)="onSort('price')" class="sortable">
                  Preço
                  <i class="fas" [ngClass]="getSortIcon('price')"></i>
                </th>
                <th (click)="onSort('commission_rate')" class="sortable">
                  Comissão Colaborador
                  <i class="fas" [ngClass]="getSortIcon('commission_rate')"></i>
                </th>
                <th (click)="onSort('duration')" class="sortable">
                  Duração
                  <i class="fas" [ngClass]="getSortIcon('duration')"></i>
                </th>
                <th>Limite por Hora</th>
                <th>Comentários</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let service of paginatedServices">
                <td>{{ service.service }}</td>
                <td>R$ {{ formatPrice(service.price) }}</td>
                <td>
                  {{ formatCommission(service.commission_rate) }}
                </td>
                <td>{{ formatDuration(service.duration) }}</td>
                <td>
                  <span class="badge" [class.badge-warning]="service.single_per_hour" [class.badge-info]="!service.single_per_hour">
                    {{ service.single_per_hour ? '1 por hora' : '3 por hora' }}
                  </span>
                </td>
                <td>{{ service.additionalComments || '-' }}</td>
                <td>
                  <div class="actions">
                    <button class="action-btn view-btn" (click)="openViewModal(service)" title="Visualizar serviço">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" (click)="openEditModal(service)" title="Editar serviço" *ngIf="isAdmin">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" (click)="confirmDelete(service)" title="Excluir serviço" *ngIf="isAdmin">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredServices.length === 0">
                <td [attr.colspan]="7" class="empty-state">
                  <p>Nenhum serviço encontrado</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="!isLoading && sortedServices.length > 0">
        <div class="pagination-controls">
          <label for="pageSize">Itens por página:</label>
          <select id="pageSize" [(ngModel)]="itemsPerPage" (change)="onPageSizeChange()">
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
            <option [value]="200">200</option>
          </select>
          <span class="page-info">
            Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, sortedServices.length) }} de {{ sortedServices.length }}
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

      <!-- Service Form Modal -->
      <app-service-form-modal
        *ngIf="isModalOpen"
        [service]="selectedService"
        [loading]="isSubmitting"
        (close)="closeModal()"
        (save)="onSaveService($event)"
      ></app-service-form-modal>

      <!-- Service Delete Modal -->
      <app-service-delete-modal
        *ngIf="isDeleteModalOpen"
        [service]="selectedService"
        [loading]="isDeleteLoading"
        (close)="onCloseDeleteModal()"
        (confirm)="onConfirmDelete()"
      ></app-service-delete-modal>

      <!-- Service View Modal -->
      <app-service-view-modal
        *ngIf="isViewModalOpen"
        [service]="selectedService"
        [canEdit]="isAdmin"
        (close)="onCloseViewModal()"
        (edit)="onEditFromView($event)"
      ></app-service-view-modal>
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

    .add-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .add-btn:hover:not(:disabled) {
      opacity: 0.9;
    }

    .add-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .services-grid {
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .services-table {
      overflow-x: auto;
    }

    .services-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .services-table th,
    .services-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    .services-table th {
      background-color: #f5f5f5;
      color: #333;
      font-weight: 500;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
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

    .services-table td {
      color: #333;
      font-size: 0.875rem;
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
      background-color: rgba(25, 118, 210, 0.1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }

    .action-btn.view-btn {
      color: #1976d2;
    }

    .action-btn.view-btn:hover {
      color: #1565c0;
      background-color: rgba(25, 118, 210, 0.15);
    }

    .action-btn.delete-btn {
      color: #f44336;
    }

    .action-btn.delete-btn:hover {
      color: #d32f2f;
      background-color: rgba(244, 67, 54, 0.1);
    }

    .action-btn:not(.view-btn):not(.delete-btn):hover {
      color: #1976d2;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-warning {
      background-color: #ff9800;
      color: white;
    }

    .badge-info {
      background-color: #2196f3;
      color: white;
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
  `]
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  sortedServices: Service[] = [];
  paginatedServices: Service[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  pageSizeOptions = [10, 25, 50, 200];
  totalPages = 1;
  isLoading = false;
  isModalOpen = false;
  isSubmitting = false;
  selectedService: Service | null = null;
  isDeleteModalOpen = false;
  isDeleteLoading = false;
  isViewModalOpen = false;
  isAdmin = false;
  sortConfig: TableSort = { column: '', direction: '' };
  Math = Math;

  constructor(
    private servicesService: ServicesService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private tableUtils: TableUtilsService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.hasRole('admin');
    this.loadServices();
  }

  loadServices() {
    this.isLoading = true;
    this.servicesService.getAllServices().subscribe({
      next: (services) => {
        this.services = services || [];
        this.filterServices();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.notificationService.error('Erro ao carregar serviços. Por favor, tente novamente.');
        this.services = [];
        this.filterServices();
        this.isLoading = false;
      }
    });
  }

  filterServices() {
    let filtered = [...this.services];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.service?.toLowerCase().includes(search) ||
        service.additionalComments?.toLowerCase().includes(search)
      );
    }

    // Aplicar ordenação
    this.sortedServices = this.tableUtils.sortData(filtered, this.sortConfig.column, this.sortConfig.direction);
    this.filteredServices = this.sortedServices; // Mantém para compatibilidade
    
    // Recalcular paginação
    this.totalPages = this.tableUtils.calculateTotalPages(this.sortedServices.length, this.itemsPerPage);
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
    
    // Aplicar paginação
    this.paginatedServices = this.tableUtils.paginateData(this.sortedServices, this.currentPage, this.itemsPerPage);
  }

  onSort(column: string): void {
    this.sortConfig = this.tableUtils.toggleSort(this.sortConfig, column);
    this.filterServices();
  }

  getSortIcon(column: string): string {
    if (this.sortConfig.column !== column) {
      return 'fa-sort';
    }
    return this.sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.filterServices();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.filterServices();
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',');
  }

  formatCommission(rate?: number): string {
    const value = rate !== undefined && rate !== null ? rate * 100 : 0;
    return `${value.toFixed(2).replace('.', ',')} %`;
  }

  formatDuration(duration?: number): string {
    if (!duration) {
      return '60 min';
    }
    if (duration < 60) {
      return `${duration} min`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}min`;
  }

  openCreateModal(): void {
    this.selectedService = null;
    this.isModalOpen = true;
  }

  openViewModal(service: Service): void {
    this.selectedService = service;
    this.isViewModalOpen = true;
  }

  onCloseViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedService = null;
  }

  onEditFromView(service: Service): void {
    this.isViewModalOpen = false;
    this.openEditModal(service);
  }

  openEditModal(service: Service): void {
    this.selectedService = service;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedService = null;
  }

  confirmDelete(service: Service) {
    this.selectedService = service;
    this.isDeleteModalOpen = true;
  }

  onCloseDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedService = null;
  }

  onConfirmDelete(): void {
    if (!this.selectedService) return;

    this.isDeleteLoading = true;
    this.servicesService.deleteService(this.selectedService.id).subscribe({
      next: () => {
        this.notificationService.success('Serviço excluído com sucesso!');
        this.onCloseDeleteModal();
        this.loadServices();
        this.isDeleteLoading = false;
      },
      error: (error) => {
        // Não recarregar a tabela em caso de erro
        this.isDeleteLoading = false;
        
        // Tratar erro específico de registros relacionados (409) - usar warning ao invés de error
        if (error?.status === 409) {
          const errorMsg = error?.error?.message || 'Este serviço possui registros associados e não pode ser excluído.';
          this.notificationService.warning(errorMsg, 'Atenção');
        } else {
          // Tratar outros erros
          const errorMsg = error?.error?.message || error?.message || 'Não foi possível excluir o serviço. Por favor, tente novamente.';
          this.notificationService.error(errorMsg);
        }
        // Garantir que o modal permaneça aberto para o usuário ver a mensagem
      }
    });
  }

  onSaveService(serviceData: Partial<Service>): void {
    if (!serviceData.service || serviceData.price === undefined || serviceData.price === null) {
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isSubmitting = true;
    
    // Garantir que os campos obrigatórios estão presentes para satisfazer o TypeScript
    const createRequest = {
      service: serviceData.service,
      additionalComments: serviceData.additionalComments,
      price: serviceData.price,
      commission_rate: serviceData.commission_rate,
      duration: serviceData.duration || 60,
      single_per_hour: serviceData.single_per_hour || false
    };

    if (this.selectedService?.id) {
      // Update
      const updateRequest = {
        id: this.selectedService.id,
        service: serviceData.service,
        additionalComments: serviceData.additionalComments,
        price: serviceData.price,
        commission_rate: serviceData.commission_rate,
        duration: serviceData.duration || 60,
        single_per_hour: serviceData.single_per_hour !== undefined ? serviceData.single_per_hour : false
      };
      this.servicesService.updateService(updateRequest).subscribe({
        next: () => {
          this.notificationService.success('Serviço atualizado com sucesso!');
          this.closeModal();
          this.loadServices();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notificationService.error('Erro ao atualizar serviço. Por favor, tente novamente.');
          this.isSubmitting = false;
        }
      });
    } else {
      // Create
      this.servicesService.createService(createRequest).subscribe({
        next: () => {
          this.notificationService.success('Serviço criado com sucesso!');
          this.closeModal();
          this.loadServices();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.notificationService.error('Erro ao criar serviço. Por favor, tente novamente.');
          this.isSubmitting = false;
        }
      });
    }
  }
}

