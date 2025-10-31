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

      <!-- Loading indicator -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Carregando agendamentos...</span>
        </div>
      </div>

      <!-- Error message -->
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
              <tr *ngFor="let schedule of filteredSchedules">
                <td>
                  <div class="user-info">
                    <div class="doctor-details">
                      <span>{{ schedule.client?.name || 'N/A' }}</span>
                      <span>{{ schedule.client?.lastname || '' }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="user-info">
                    <div class="doctor-details">
                      <span>{{ schedule.provider?.name || 'N/A' }}</span>
                      <span>{{ schedule.provider?.lastname || '' }}</span>
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

    <!-- Modais -->
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
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .schedules {
      padding: $spacing-lg;
      background-color: $background-color;
      min-height: 100%;
    }

    .schedules-header {
      @include flex(row, space-between, center);
      margin-bottom: $spacing-xl;
    }

    .header-left {
      @include flex(row, flex-start, center);
      gap: $spacing-xl;

      h1 {
        color: $primary-color;
        margin: 0;
      }
    }

    .search {
      position: relative;
      width: 300px;

      i {
        position: absolute;
        left: $spacing-sm;
        top: 50%;
        transform: translateY(-50%);
        color: $text-secondary;
      }

      input {
        width: 100%;
        padding: $spacing-sm $spacing-sm $spacing-sm $spacing-xl;
        border: 1px solid $border-color;
        border-radius: $border-radius-lg;
        background-color: $background-light;
        @include typography($font-size-base);

        &:focus {
          outline: none;
          border-color: $primary-color;
        }
      }
    }

    .header-right {
      @include flex(row, flex-end, center);
      gap: $spacing-md;
    }

    .filter-btn, .add-btn {
      @include button;
      @include flex(row, center, center);
      gap: $spacing-sm;
      padding: $spacing-sm $spacing-md;
    }

    .filter-btn {
      background-color: $background-light;
      color: $text-primary;
      border: 1px solid $border-color;

      &:hover {
        background-color: $background-dark;
      }
    }

    .add-btn {
      background-color: $primary-color;
      color: $text-light;
      border: 1px solid $border-color;
      box-shadow: $shadow-sm;

      &:hover {
        background-color: $primary-dark;
        transform: translateY(-2px);
      }
    }

    .filter-panel {
      background-color: $background-light;
      border: 1px solid $border-color;
      border-radius: $border-radius-lg;
      padding: $spacing-lg;
      margin-bottom: $spacing-xl;
      display: none;
      box-shadow: $shadow-sm;

      &.show {
        display: block;
      }
    }

    .filter-group {
      margin-bottom: $spacing-lg;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        color: $text-primary;
        @include typography($font-size-base, $font-weight-medium);
        margin-bottom: $spacing-sm;
      }
    }

    .filter-options {
      @include flex(row, flex-start, center);
      gap: $spacing-lg;
      flex-wrap: wrap;
    }

    .checkbox {
      @include flex(row, flex-start, center);
      gap: $spacing-sm;
      cursor: pointer;

      input {
        width: 16px;
        height: 16px;
      }

      span {
        color: $text-primary;
        @include typography($font-size-base);
      }
    }

    .date-range {
      @include flex(row, flex-start, center);
      gap: $spacing-md;

      input {
        padding: $spacing-sm;
        border: 1px solid $border-color;
        border-radius: $border-radius-sm;
        background-color: $background-light;
        @include typography($font-size-base);

        &:focus {
          outline: none;
          border-color: $primary-color;
        }
      }

      span {
        color: $text-secondary;
        @include typography($font-size-base);
      }
    }

    .filter-actions {
      @include flex(row, flex-end, center);
      margin-top: $spacing-lg;
    }

    .clear-btn {
      @include button(transparent, $text-primary);
      border: 1px solid $border-color;

      &:hover {
        background-color: $background-dark;
      }
    }

    .schedules-grid {
      background-color: $background-light;
      border: 1px solid $border-color;
      border-radius: $border-radius-lg;
      overflow: hidden;
      box-shadow: $shadow-sm;
    }

    .schedules-table {
      overflow-x: auto;

      &::-webkit-scrollbar {
        height: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: $primary-color;
        border-radius: 4px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        padding: $spacing-md;
        text-align: left;
        border-bottom: 1px solid $border-color;
      }

      th {
        background-color: $background-dark;
        color: $text-primary;
        @include typography($font-size-base, $font-weight-medium);
      }

      td {
        color: $text-primary;
        @include typography($font-size-base);
      }
    }

    .user-info {
      @include flex(row, flex-start, center);
      gap: $spacing-sm;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: $border-radius-full;
      object-fit: cover;
    }

    .doctor-details {
      @include flex(column, flex-start, flex-start);
      gap: $spacing-xs;

      small {
        color: $text-secondary;
        @include typography($font-size-sm);
      }
    }

    .type-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      @include typography($font-size-sm, $font-weight-medium);

      &.first_visit {
        background-color: rgba($primary-color, 0.1);
        color: $primary-color;
      }

      &.follow_up {
        background-color: rgba($info-color, 0.1);
        color: $info-color;
      }

      &.exam {
        background-color: rgba($warning-color, 0.1);
        color: $warning-color;
      }

      &.procedure {
        background-color: rgba($success-color, 0.1);
        color: $success-color;
      }
    }

    .status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      @include typography($font-size-sm, $font-weight-medium);

      &.scheduled {
        background-color: rgba($info-color, 0.1);
        color: $info-color;
      }

      &.confirmed {
        background-color: rgba($primary-color, 0.1);
        color: $primary-color;
      }

      &.completed {
        background-color: rgba($success-color, 0.1);
        color: $success-color;
      }

      &.cancelled {
        background-color: rgba($error-color, 0.1);
        color: $error-color;
      }
    }

    .actions {
      @include flex(row, flex-start, center);
      gap: $spacing-sm;
    }

    .action-btn {
      @include button(transparent, $text-secondary);
      padding: $spacing-xs;
      font-size: $font-size-base;

      &:hover {
        color: $primary-color;
        background-color: rgba($primary-color, 0.1);
        box-shadow: $shadow-sm;
        transform: translateY(-1px);
      }
    }

    .pagination {
      @include flex(row, center, center);
      gap: $spacing-md;
      margin-top: $spacing-xl;
    }

    .page-btn {
      @include button(transparent, $text-primary);
      padding: $spacing-sm;
      border: 1px solid $border-color;
      border-radius: $border-radius-sm;
      box-shadow: $shadow-sm;

      &:hover:not(:disabled) {
        background-color: $background-dark;
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .page-info {
      color: $text-primary;
      @include typography($font-size-base);
    }

    .loading-container {
      @include flex(column, center, center);
      padding: $spacing-xl;
      text-align: center;
    }

    .loading-spinner {
      @include flex(row, center, center);
      gap: $spacing-md;
      color: $text-secondary;
      @include typography($font-size-base);

      i {
        font-size: $font-size-large;
        color: $primary-color;
      }
    }

    .error-message {
      @include flex(row, center, center);
      gap: $spacing-md;
      padding: $spacing-lg;
      background-color: rgba($error-color, 0.1);
      border: 1px solid rgba($error-color, 0.3);
      border-radius: $border-radius-lg;
      color: $error-color;
      @include typography($font-size-base);

      i {
        font-size: $font-size-large;
      }

      .retry-btn {
        @include button($error-color, $text-light);
        padding: $spacing-xs $spacing-sm;
        font-size: $font-size-small;
        margin-left: $spacing-md;
      }
    }

    .services-list {
      @include flex(row, flex-start, center);
      gap: $spacing-xs;
      flex-wrap: wrap;
    }

    .service-badge {
      padding: $spacing-xs $spacing-sm;
      background-color: rgba($primary-color, 0.1);
      color: $primary-color;
      border-radius: $border-radius-sm;
      @include typography($font-size-small, $font-weight-medium);
    }

    .no-services {
      color: $text-secondary;
      @include typography($font-size-small);
      font-style: italic;
    }

    .status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      @include typography($font-size-small, $font-weight-medium);

      &.active {
        background-color: rgba($info-color, 0.1);
        color: $info-color;
      }

      &.completed {
        background-color: rgba($success-color, 0.1);
        color: $success-color;
      }

      &.cancelled {
        background-color: rgba($error-color, 0.1);
        color: $error-color;
      }
    }

    @include responsive(lg) {
      .header-left {
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-md;
      }

      .search {
        width: 100%;
      }
    }

    @include responsive(md) {
      .schedules-header {
        flex-direction: column;
        gap: $spacing-md;
      }

      .header-right {
        width: 100%;
        justify-content: space-between;
      }

      .filter-options {
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-sm;
      }

      .date-range {
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-sm;

        span {
          display: none;
        }
      }
    }
  `]
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
        this.providers = users.filter(user => user.TypeAccount.type === 'provider');
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
