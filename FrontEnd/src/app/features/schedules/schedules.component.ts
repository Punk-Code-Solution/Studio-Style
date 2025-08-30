import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Schedule {
  id: number;
  patient: {
    id: number;
    name: string;
    avatar: string;
  };
  doctor: {
    id: number;
    name: string;
    specialty: string;
    avatar: string;
  };
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  type: 'first_visit' | 'follow_up' | 'exam' | 'procedure';
  notes?: string;
}

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="schedules">
      <div class="schedules-header">
        <div class="header-left">
          <h1>Agendamentos</h1>
          <div class="search">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar agendamentos..." [(ngModel)]="searchTerm" (input)="filterSchedules()">
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
              <input type="checkbox" [(ngModel)]="filters.status.scheduled" (change)="filterSchedules()">
              <span>Agendado</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.confirmed" (change)="filterSchedules()">
              <span>Confirmado</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.completed" (change)="filterSchedules()">
              <span>Concluído</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.cancelled" (change)="filterSchedules()">
              <span>Cancelado</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label>Tipo</label>
          <div class="filter-options">
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.type.first_visit" (change)="filterSchedules()">
              <span>Primeira Consulta</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.type.follow_up" (change)="filterSchedules()">
              <span>Retorno</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.type.exam" (change)="filterSchedules()">
              <span>Exame</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.type.procedure" (change)="filterSchedules()">
              <span>Procedimento</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label>Data</label>
          <div class="date-range">
            <input type="date" [(ngModel)]="filters.dateRange.start" (change)="filterSchedules()">
            <span>até</span>
            <input type="date" [(ngModel)]="filters.dateRange.end" (change)="filterSchedules()">
          </div>
        </div>

        <div class="filter-actions">
          <button class="clear-btn" (click)="clearFilters()">Limpar Filtros</button>
        </div>
      </div>

      <div class="schedules-grid">
        <div class="schedules-table">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let schedule of filteredSchedules">
                <td>
                  <div class="user-info">
                    <img [src]="schedule.patient.avatar" [alt]="schedule.patient.name" class="avatar">
                    <span>{{ schedule.patient.name }}</span>
                  </div>
                </td>
                <td>
                  <div class="user-info">
                    <img [src]="schedule.doctor.avatar" [alt]="schedule.doctor.name" class="avatar">
                    <div class="doctor-details">
                      <span>{{ schedule.doctor.name }}</span>
                      <small>{{ schedule.doctor.specialty }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ schedule.date | date:'dd/MM/yyyy' }}</td>
                <td>{{ schedule.time }}</td>
                <td>
                  <span class="type-badge" [class]="schedule.type">
                    {{ schedule.type === 'first_visit' ? 'Primeira Consulta' :
                       schedule.type === 'follow_up' ? 'Retorno' :
                       schedule.type === 'exam' ? 'Exame' : 'Procedimento' }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class]="schedule.status">
                    {{ schedule.status === 'scheduled' ? 'Agendado' :
                       schedule.status === 'confirmed' ? 'Confirmado' :
                       schedule.status === 'completed' ? 'Concluído' : 'Cancelado' }}
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
  `,
  styles: [`
    @import '../../../styles/variables';
    @import '../../../styles/mixins';

    .schedules {
      padding: $spacing-lg;
    }

    .schedules-header {
      @include flex(row, space-between, center);
      margin-bottom: $spacing-xl;
    }

    .header-left {
      @include flex(row, flex-start, center);
      gap: $spacing-xl;

      h1 {
        color: $text-primary;
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

      &:hover {
        background-color: $primary-dark;
      }
    }

    .filter-panel {
      background-color: $background-light;
      border: 1px solid $border-color;
      border-radius: $border-radius-lg;
      padding: $spacing-lg;
      margin-bottom: $spacing-xl;
      display: none;

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
    }

    .schedules-table {
      overflow-x: auto;

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

      &:hover:not(:disabled) {
        background-color: $background-dark;
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

  filters = {
    status: {
      scheduled: true,
      confirmed: true,
      completed: true,
      cancelled: false
    },
    type: {
      first_visit: true,
      follow_up: true,
      exam: true,
      procedure: true
    },
    dateRange: {
      start: '',
      end: ''
    }
  };

  constructor() {}

  ngOnInit(): void {
    this.loadSchedules();
  }

  loadSchedules(): void {
    // Simulated data
    this.schedules = [
      {
        id: 1,
        patient: {
          id: 1,
          name: 'Maria Silva',
          avatar: 'https://via.placeholder.com/32x32'
        },
        doctor: {
          id: 1,
          name: 'Dr. João Santos',
          specialty: 'Clínico Geral',
          avatar: 'https://via.placeholder.com/32x32'
        },
        date: '2024-03-20',
        time: '09:00',
        status: 'scheduled',
        type: 'first_visit',
        notes: 'Primeira consulta de rotina'
      },
      {
        id: 2,
        patient: {
          id: 2,
          name: 'João Santos',
          avatar: 'https://via.placeholder.com/32x32'
        },
        doctor: {
          id: 2,
          name: 'Dra. Ana Costa',
          specialty: 'Cardiologia',
          avatar: 'https://via.placeholder.com/32x32'
        },
        date: '2024-03-20',
        time: '10:00',
        status: 'confirmed',
        type: 'follow_up',
        notes: 'Retorno para avaliação de exames'
      },
      {
        id: 3,
        patient: {
          id: 3,
          name: 'Ana Costa',
          avatar: 'https://via.placeholder.com/32x32'
        },
        doctor: {
          id: 3,
          name: 'Dr. Carlos Oliveira',
          specialty: 'Neurologia',
          avatar: 'https://via.placeholder.com/32x32'
        },
        date: '2024-03-21',
        time: '14:00',
        status: 'completed',
        type: 'exam',
        notes: 'Eletroencefalograma'
      }
    ];

    this.filterSchedules();
  }

  filterSchedules(): void {
    let filtered = [...this.schedules];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(schedule =>
        schedule.patient.name.toLowerCase().includes(search) ||
        schedule.doctor.name.toLowerCase().includes(search) ||
        schedule.doctor.specialty.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (!this.filters.status.scheduled || !this.filters.status.confirmed || !this.filters.status.completed || !this.filters.status.cancelled) {
      filtered = filtered.filter(schedule => {
        if (this.filters.status.scheduled && schedule.status === 'scheduled') return true;
        if (this.filters.status.confirmed && schedule.status === 'confirmed') return true;
        if (this.filters.status.completed && schedule.status === 'completed') return true;
        if (this.filters.status.cancelled && schedule.status === 'cancelled') return true;
        return false;
      });
    }

    // Type filter
    if (!this.filters.type.first_visit || !this.filters.type.follow_up || !this.filters.type.exam || !this.filters.type.procedure) {
      filtered = filtered.filter(schedule => {
        if (this.filters.type.first_visit && schedule.type === 'first_visit') return true;
        if (this.filters.type.follow_up && schedule.type === 'follow_up') return true;
        if (this.filters.type.exam && schedule.type === 'exam') return true;
        if (this.filters.type.procedure && schedule.type === 'procedure') return true;
        return false;
      });
    }

    // Date range filter
    if (this.filters.dateRange.start && this.filters.dateRange.end) {
      const start = new Date(this.filters.dateRange.start);
      const end = new Date(this.filters.dateRange.end);
      filtered = filtered.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= start && scheduleDate <= end;
      });
    }

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredSchedules = filtered.slice(start, start + this.itemsPerPage);
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      status: {
        scheduled: true,
        confirmed: true,
        completed: true,
        cancelled: false
      },
      type: {
        first_visit: true,
        follow_up: true,
        exam: true,
        procedure: true
      },
      dateRange: {
        start: '',
        end: ''
      }
    };
    this.filterSchedules();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.filterSchedules();
  }

  openScheduleModal(): void {
    // Implement schedule modal
  }

  viewSchedule(schedule: Schedule): void {
    // Implement view schedule
  }

  editSchedule(schedule: Schedule): void {
    // Implement edit schedule
  }

  deleteSchedule(schedule: Schedule): void {
    // Implement delete schedule
  }
} 