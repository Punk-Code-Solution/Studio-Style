import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SchedulesService, Schedule, Service, CreateScheduleRequest } from '../../core/services/schedules.service';
import { ScheduleViewModalComponent } from './schedule-view-modal/schedule-view-modal.component';
import { ScheduleFormModalComponent } from './schedule-form-modal/schedule-form-modal.component';
import { ScheduleDeleteModalComponent } from './schedule-delete-modal/schedule-delete-modal.component';
import { User, UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ScheduleViewModalComponent,
    ScheduleFormModalComponent,
    ScheduleDeleteModalComponent
  ],
  template: `
    <div class="schedules">
      <div class="schedules-header">
        <div class="header-left">
          <h1>Agendamentos</h1>
          <div class="search">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar agendamentos..." [(ngModel)]="searchTerm" (ngModelChange)="filterSchedules()">
          </div>
        </div>

        <div class="header-right">
          <button class="filter-btn" (click)="toggleFilter()">
            <i class="fas fa-filter"></i>
            Filtros
          </button>
          <button class="add-btn" (click)="openScheduleModal()">
            <i class="fas fa-plus"></i>
            Novo Agendamento
          </button>
        </div>
      </div>

      <div class="filter-panel" [class.show]="isFilterOpen">
        <div class="filter-group">
          <label>Status</label>
          <div class="filter-options">
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.active" (ngModelChange)="filterSchedules()">
              <span>Ativo</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.finished" (ngModelChange)="filterSchedules()">
              <span>Finalizado</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.cancelled" (ngModelChange)="filterSchedules()">
              <span>Cancelado</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label>Data</label>
          <div class="date-range">
            <input type="date" [(ngModel)]="filters.dateRange.start" (ngModelChange)="filterSchedules()">
            <span>até</span>
            <input type="date" [(ngModel)]="filters.dateRange.end" (ngModelChange)="filterSchedules()">
          </div>
        </div>

        <div class="filter-actions">
          <button class="clear-btn" (click)="clearFilters()">Limpar Filtros</button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Carregando agendamentos...</span>
        </div>
      </div>

      <div *ngIf="error" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ error }}</span>
        <button class="retry-btn" (click)="loadSchedules()">Tentar novamente</button>
      </div>

      <div class="schedules-grid" *ngIf="!loading && !error">
        <div class="schedules-table">
          <table>
            <thead>
              <tr>
                <th>Prestador</th>
                <th>Cliente</th>
                <th>Data/Hora</th>
                <th>Serviços</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="filteredSchedules.length === 0">
                <td colspan="6" class="empty-state">
                  <p>Nenhum agendamento encontrado</p>
                </td>
              </tr>
              <tr *ngFor="let schedule of filteredSchedules">
                <td>
                  <div class="user-info">
                    <div class="doctor-details">
                      <span>{{ schedule.provider?.name || 'N/A' }}</span>
                      <span>{{ schedule.provider?.lastname || '' }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="user-info">
                    <div class="doctor-details">
                      <span>{{ schedule.name_client || 'N/A' }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ schedule.date_and_houres | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <div class="services-list" *ngIf="schedule.Services && schedule.Services.length > 0">
                    <span *ngFor="let service of schedule.Services" class="service-badge">
                      {{ service.service }}
                    </span>
                  </div>
                  <span *ngIf="!schedule.Services || schedule.Services.length === 0" class="no-services">
                    Nenhum serviço
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class]="getStatusClass(schedule)">
                    {{ getStatusText(schedule) }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="action-btn" (click)="viewSchedule(schedule)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" (click)="editSchedule(schedule)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" (click)="deleteSchedule(schedule)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="pagination">
        <button class="page-btn" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <button class="page-btn" [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <app-schedule-view-modal
      *ngIf="showViewModal"
      [schedule]="selectedSchedule"
      (close)="closeViewModal()"
      (edit)="openEditModal($event)"
    ></app-schedule-view-modal>

    <app-schedule-form-modal
      *ngIf="showFormModal"
      [schedule]="editingSchedule"
      [availableServices]="availableServices"
      [providers]="providers"
      [clients]="clients"
      [loading]="formLoading"
      (close)="closeFormModal()"
      (save)="saveSchedule($event)"
    ></app-schedule-form-modal>

    <app-schedule-delete-modal
      *ngIf="showDeleteModal"
      [schedule]="scheduleToDelete"
      [loading]="deleteLoading"
      (close)="closeDeleteModal()"
      (confirm)="confirmDelete($event)"
    ></app-schedule-delete-modal>
  `,
  styleUrls: ['./schedules.component.scss']
})
export class SchedulesComponent implements OnInit {
  schedules: Schedule[] = [];
  filteredSchedules: Schedule[] = [];
  searchTerm = '';
  isFilterOpen = false;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  loading = false;
  error = '';

  // Modal states
  showViewModal = false;
  showFormModal = false;
  showDeleteModal = false;
  selectedSchedule: Schedule | null = null;
  editingSchedule: Schedule | null = null;
  scheduleToDelete: Schedule | null = null;
  formLoading = false;
  deleteLoading = false;

  // Data for forms
  availableServices: Service[] = [];
  providers: User[] = [];
  clients: User[] = [];

  filters = {
    status: {
      active: true,
      finished: true,
      cancelled: false
    },
    dateRange: {
      start: '',
      end: ''
    }
  };

  constructor(
    private schedulesService: SchedulesService,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadSchedules();
    this.loadFormData();
    
    // Verifica query params para abrir modais automaticamente
    this.route.queryParams.subscribe(params => {
      if (params['new'] === 'true') {
        this.openScheduleModal();
        // Remove query param após abrir o modal
        this.router.navigate([], { 
          relativeTo: this.route, 
          queryParams: { new: null },
          queryParamsHandling: 'merge'
        });
      } else if (params['id']) {
        // Buscar o agendamento pelo ID e abrir o modal de visualização
        this.schedulesService.getScheduleById(params['id']).subscribe({
          next: (schedule) => {
            this.viewSchedule(schedule);
            // Remove query param após abrir o modal
            this.router.navigate([], { 
              relativeTo: this.route, 
              queryParams: { id: null },
              queryParamsHandling: 'merge'
            });
          },
          error: (error) => {
            console.error('Erro ao carregar agendamento:', error);
            // Remove query param em caso de erro
            this.router.navigate([], { 
              relativeTo: this.route, 
              queryParams: { id: null },
              queryParamsHandling: 'merge'
            });
          }
        });
      }
    });
  }

  loadFormData(): void {
    // Carregar serviços disponíveis diretamente da API de serviços
    this.schedulesService.getAllServices().subscribe({
      next: (services) => {
        this.availableServices = services;
      },
      error: (error) => {
        this.availableServices = [];
      }
    });

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.providers = users.filter(user => user.TypeAccount.type === 'provider' || user.TypeAccount.type === 'admin');
        this.clients = users.filter(user => user.TypeAccount.type === 'client');
      },
      error: (error) => {
        console.error('❌ Erro ao carregar usuários:', error);
        this.providers = [];
        this.clients = [];
      }
    });
  }

  loadSchedules(): void {
    this.loading = true;
    this.error = '';

    this.schedulesService.getAllSchedules().subscribe({
      next: (schedules) => {
        this.schedules = Array.isArray(schedules) ? schedules : [];
        this.filterSchedules();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erro ao carregar agendamentos';
        this.schedules = [];
        this.filterSchedules();
        this.loading = false;
      }
    });
  }

  filterSchedules(): void {
    let filtered = [...this.schedules];

    // Search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(schedule =>
        schedule.name_client?.toLowerCase().includes(search) ||
        (schedule.provider?.name && schedule.provider.name.toLowerCase().includes(search)) ||
        (schedule.client?.name && schedule.client.name.toLowerCase().includes(search)) ||
        (schedule.Services && schedule.Services.some(service =>
          service.service?.toLowerCase().includes(search)
        ))
      );
    }

    // Status filter - aplica apenas se não todos estão marcados
    const allStatusSelected = this.filters.status.active && this.filters.status.finished && this.filters.status.cancelled;
    if (!allStatusSelected) {
      filtered = filtered.filter(schedule => {
        // Ativo: active=true e finished=false
        if (this.filters.status.active && schedule.active && !schedule.finished) return true;
        // Finalizado: finished=true
        if (this.filters.status.finished && schedule.finished) return true;
        // Cancelado: active=false e finished=false
        if (this.filters.status.cancelled && !schedule.active && !schedule.finished) return true;
        return false;
      });
    }

    // Date range filter - funciona com apenas uma data também
    if (this.filters.dateRange.start || this.filters.dateRange.end) {
      filtered = filtered.filter(schedule => {
        const scheduleDate = new Date(schedule.date_and_houres);
        scheduleDate.setHours(0, 0, 0, 0);
        
        if (this.filters.dateRange.start && this.filters.dateRange.end) {
          const start = new Date(this.filters.dateRange.start);
          start.setHours(0, 0, 0, 0);
          const end = new Date(this.filters.dateRange.end);
          end.setHours(23, 59, 59, 999);
          return scheduleDate >= start && scheduleDate <= end;
        } else if (this.filters.dateRange.start) {
          const start = new Date(this.filters.dateRange.start);
          start.setHours(0, 0, 0, 0);
          return scheduleDate >= start;
        } else if (this.filters.dateRange.end) {
          const end = new Date(this.filters.dateRange.end);
          end.setHours(23, 59, 59, 999);
          return scheduleDate <= end;
        }
        return true;
      });
    }

    // Recalcular paginação
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
    
    // Aplicar paginação
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    // Criar novo array para garantir detecção de mudanças do Angular
    this.filteredSchedules = [...filtered.slice(start, end)];
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      status: {
        active: true,
        finished: true,
        cancelled: false
      },
      dateRange: {
        start: '',
        end: ''
      }
    };
    this.currentPage = 1;
    this.filterSchedules();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.filterSchedules();
  }

  openScheduleModal(): void {
    this.editingSchedule = null;
    this.showFormModal = true;
    // Recarregar dados do formulário para garantir que os serviços estejam atualizados
    this.loadFormData();
  }

  viewSchedule(schedule: Schedule): void {
    this.selectedSchedule = schedule;
    this.showViewModal = true;
  }

  editSchedule(schedule: Schedule): void {
    this.editingSchedule = schedule;
    this.showFormModal = true;
    // Recarregar dados do formulário para garantir que os serviços estejam atualizados
    this.loadFormData();
  }

  deleteSchedule(schedule: Schedule): void {
    this.scheduleToDelete = schedule;
    this.showDeleteModal = true;
  }

  // Modal methods
  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedSchedule = null;
  }

  openEditModal(schedule: Schedule): void {
    this.closeViewModal();
    this.editSchedule(schedule);
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingSchedule = null;
    this.formLoading = false;
  }

  saveSchedule(scheduleData: CreateScheduleRequest): void {
    this.formLoading = true;

    if (this.editingSchedule) {
      // Update existing schedule
      this.schedulesService.updateSchedule(this.editingSchedule.id, scheduleData).subscribe({
        next: () => {
          console.log('Agendamento atualizado com sucesso');
          this.loadSchedules();
          this.closeFormModal();
        },
        error: (error) => {
          this.error = 'Erro ao atualizar agendamento';
          console.error('Erro ao atualizar agendamento:', error);
          this.formLoading = false;
        }
      });
    } else {
      // Create new schedule
      this.schedulesService.createSchedule(scheduleData).subscribe({
        next: () => {
          console.log('Agendamento criado com sucesso');
          this.loadSchedules();
          this.closeFormModal();
        },
        error: (error) => {
          this.error = 'Erro ao criar agendamento';
          console.error('Erro ao criar agendamento:', error);
          this.formLoading = false;
        }
      });
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.scheduleToDelete = null;
    this.deleteLoading = false;
  }

  confirmDelete(schedule: Schedule): void {
    this.deleteLoading = true;

    this.schedulesService.deleteSchedule(schedule.id).subscribe({
      next: () => {
        console.log('Agendamento excluído com sucesso');
        this.loadSchedules();
        this.closeDeleteModal();
      },
      error: (error) => {
        this.error = 'Erro ao excluir agendamento';
        console.error('Erro ao excluir agendamento:', error);
        this.deleteLoading = false;
      }
    });
  }

  getStatusClass(schedule: Schedule): string {
    if (schedule.finished) return 'completed';
    if (!schedule.active) return 'cancelled';
    return 'active';
  }

  getStatusText(schedule: Schedule): string {
    if (schedule.finished) return 'Finalizado';
    if (!schedule.active) return 'Cancelado';
    return 'Ativo';
  }
}