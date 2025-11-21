import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicesService, Service } from '../../core/services/services.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ServiceFormModalComponent } from './service-form-modal/service-form-modal.component';
import { ServiceDeleteModalComponent } from './service-delete-modal/service-delete-modal.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ServiceFormModalComponent, ServiceDeleteModalComponent],
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
                <th>Serviço</th>
                <th>Preço</th>
                <th>Comentários</th>
                <th *ngIf="isAdmin">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let service of paginatedServices">
                <td>{{ service.service }}</td>
                <td>R$ {{ formatPrice(service.price) }}</td>
                <td>{{ service.additionalComments || '-' }}</td>
                <td *ngIf="isAdmin">
                  <div class="actions">
                    <button class="action-btn" (click)="openEditModal(service)" title="Editar serviço">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" (click)="confirmDelete(service)" title="Excluir serviço">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredServices.length === 0">
                <td [attr.colspan]="isAdmin ? 4 : 3" class="empty-state">
                  <p>Nenhum serviço encontrado</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="!isLoading && filteredServices.length > 0">
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
  `]
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;
  isModalOpen = false;
  isSubmitting = false;
  selectedService: Service | null = null;
  isDeleteModalOpen = false;
  isDeleteLoading = false;
  isAdmin = false;

  constructor(
    private servicesService: ServicesService,
    public authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.hasRole('admin');
    this.loadServices();
  }

  loadServices() {
    this.isLoading = true;
    this.servicesService.getAllServices().subscribe({
      next: (services) => {
        console.log('Services loaded:', services);
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

  get paginatedServices(): Service[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredServices.slice(start, end);
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

    this.filteredServices = filtered;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',');
  }

  openCreateModal(): void {
    this.selectedService = null;
    this.isModalOpen = true;
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
        this.notificationService.error('Erro ao excluir serviço. Por favor, tente novamente.');
        this.isDeleteLoading = false;
      }
    });
  }

  onSaveService(serviceData: Partial<Service>): void {
    if (!serviceData.service || serviceData.price === undefined || serviceData.price === null) {
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isSubmitting = true;
    const request = {
      service: serviceData.service,
      additionalComments: serviceData.additionalComments,
      price: serviceData.price
    };

    if (this.selectedService?.id) {
      // Update
      this.servicesService.updateService({ id: this.selectedService.id, ...request }).subscribe({
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
      this.servicesService.createService(request).subscribe({
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

