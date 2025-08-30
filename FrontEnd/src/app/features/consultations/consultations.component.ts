import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Consultation {
  id: number;
  patient: {
    id: number;
    name: string;
    avatar: string;
  };
  doctor: {
    id: number;
    name: string;
    avatar: string;
  };
  date: string;
  time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type: 'first_visit' | 'follow_up' | 'emergency';
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  attachments?: string[];
}

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="consultations">
      <div class="consultations-header">
        <div class="header-left">
          <h2>Consultas</h2>
          <div class="search">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar consultas..." [(ngModel)]="searchTerm" (input)="filterConsultations()">
          </div>
        </div>

        <div class="header-right">
          <button class="filter-btn" (click)="toggleFilter()">
            <i class="fas fa-filter"></i>
            Filtros
          </button>
          <button class="add-btn" (click)="openConsultationModal()">
            <i class="fas fa-plus"></i>
            Nova Consulta
          </button>
        </div>
      </div>

      <div class="filter-panel" [class.show]="isFilterOpen">
        <div class="filter-group">
          <label>Status</label>
          <div class="filter-options">
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.scheduled" (change)="filterConsultations()">
              <span>Agendadas</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.in_progress" (change)="filterConsultations()">
              <span>Em Andamento</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.completed" (change)="filterConsultations()">
              <span>Concluídas</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.cancelled" (change)="filterConsultations()">
              <span>Canceladas</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label>Tipo</label>
          <div class="filter-options">
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.type.first_visit" (change)="filterConsultations()">
              <span>Primeira Consulta</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.type.follow_up" (change)="filterConsultations()">
              <span>Retorno</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.type.emergency" (change)="filterConsultations()">
              <span>Emergência</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label>Data</label>
          <div class="filter-options">
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.date.today" (change)="filterConsultations()">
              <span>Hoje</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.date.week" (change)="filterConsultations()">
              <span>Esta Semana</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.date.month" (change)="filterConsultations()">
              <span>Este Mês</span>
            </label>
          </div>
        </div>

        <div class="filter-actions">
          <button class="clear-btn" (click)="clearFilters()">Limpar Filtros</button>
        </div>
      </div>

      <div class="consultations-grid">
        <div class="consultations-table">
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
              <tr *ngFor="let consultation of filteredConsultations">
                <td>
                  <div class="user-info">
                    <img [src]="consultation.patient.avatar" [alt]="consultation.patient.name" class="avatar">
                    <span>{{ consultation.patient.name }}</span>
                  </div>
                </td>
                <td>
                  <div class="user-info">
                    <img [src]="consultation.doctor.avatar" [alt]="consultation.doctor.name" class="avatar">
                    <span>{{ consultation.doctor.name }}</span>
                  </div>
                </td>
                <td>{{ consultation.date }}</td>
                <td>{{ consultation.time }}</td>
                <td>
                  <span class="type-badge" [class]="consultation.type">
                    {{ getTypeLabel(consultation.type) }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class]="consultation.status">
                    {{ getStatusLabel(consultation.status) }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="action-btn" (click)="viewConsultation(consultation)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <!-- <button class="action-btn" (click)="editConsultation(consultation)">
                      <i class="fas fa-edit"></i>
                    </button> -->
                    <button class="action-btn" (click)="deleteConsultation(consultation)">
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
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .consultations {
      padding: $spacing-lg;
    }

    .consultations-header {
      @include flex(row, space-between, center);
      margin-bottom: $spacing-xl;
    }

    .header-left {
      @include flex(row, flex-start, center);
      gap: $spacing-xl;

      h2 {
        color: #1976d2;;
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

    .consultations-grid {
      background-color: $background-light;
      border: 1px solid $border-color;
      border-radius: $border-radius-lg;
      overflow: hidden;
    }

    .consultations-table {
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

    .type-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      @include typography($font-size-sm, $font-weight-medium);
      text-transform: capitalize;

      &.first_visit {
        background-color: rgba($primary-color, 0.1);
        color: $primary-color;
      }

      &.follow_up {
        background-color: rgba($info-color, 0.1);
        color: $info-color;
      }

      &.emergency {
        background-color: rgba($error-color, 0.1);
        color: $error-color;
      }
    }

    .status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      @include typography($font-size-sm, $font-weight-medium);
      text-transform: capitalize;

      &.scheduled {
        background-color: rgba($info-color, 0.1);
        color: $info-color;
      }

      &.in_progress {
        background-color: rgba($warning-color, 0.1);
        color: $warning-color;
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
      .consultations-header {
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
    }
  `]
})
export class ConsultationsComponent implements OnInit {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  searchTerm = '';
  isFilterOpen = false;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  filters = {
    status: {
      scheduled: true,
      in_progress: true,
      completed: true,
      cancelled: false
    },
    type: {
      first_visit: true,
      follow_up: true,
      emergency: true
    },
    date: {
      today: false,
      week: false,
      month: false
    }
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations(): void {
    // Simulated data
    this.consultations = [
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
          avatar: 'https://via.placeholder.com/32x32'
        },
        date: '2024-03-20',
        time: '14:00',
        status: 'scheduled',
        type: 'first_visit'
      },
      {
        id: 2,
        patient: {
          id: 2,
          name: 'João Oliveira',
          avatar: 'https://via.placeholder.com/32x32'
        },
        doctor: {
          id: 2,
          name: 'Dra. Ana Costa',
          avatar: 'https://via.placeholder.com/32x32'
        },
        date: '2024-03-20',
        time: '15:30',
        status: 'in_progress',
        type: 'follow_up',
        symptoms: 'Dor de cabeça e febre',
        diagnosis: 'Gripe',
        prescription: 'Paracetamol 500mg',
        notes: 'Paciente apresentou melhora após 3 dias',
        attachments: ['exame_sangue.pdf', 'raio_x.jpg']
      },
      {
        id: 3,
        patient: {
          id: 3,
          name: 'Carlos Souza',
          avatar: 'https://via.placeholder.com/32x32'
        },
        doctor: {
          id: 1,
          name: 'Dr. João Santos',
          avatar: 'https://via.placeholder.com/32x32'
        },
        date: '2024-03-21',
        time: '09:00',
        status: 'completed',
        type: 'emergency',
        symptoms: 'Dor no peito',
        diagnosis: 'Ansiedade',
        prescription: 'Ansiolítico',
        notes: 'Paciente com quadro de ansiedade',
        attachments: ['eletrocardiograma.pdf']
      }
    ];

    this.filterConsultations();
  }

  filterConsultations(): void {
    let filtered = [...this.consultations];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(consultation =>
        consultation.patient.name.toLowerCase().includes(search) ||
        consultation.doctor.name.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (!this.filters.status.scheduled || !this.filters.status.in_progress || 
        !this.filters.status.completed || !this.filters.status.cancelled) {
      filtered = filtered.filter(consultation => {
        if (this.filters.status.scheduled && consultation.status === 'scheduled') return true;
        if (this.filters.status.in_progress && consultation.status === 'in_progress') return true;
        if (this.filters.status.completed && consultation.status === 'completed') return true;
        if (this.filters.status.cancelled && consultation.status === 'cancelled') return true;
        return false;
      });
    }

    // Type filter
    if (!this.filters.type.first_visit || !this.filters.type.follow_up || !this.filters.type.emergency) {
      filtered = filtered.filter(consultation => {
        if (this.filters.type.first_visit && consultation.type === 'first_visit') return true;
        if (this.filters.type.follow_up && consultation.type === 'follow_up') return true;
        if (this.filters.type.emergency && consultation.type === 'emergency') return true;
        return false;
      });
    }

    // Date filter
    const now = new Date();
    if (this.filters.date.today || this.filters.date.week || this.filters.date.month) {
      filtered = filtered.filter(consultation => {
        const consultationDate = new Date(consultation.date);
        if (this.filters.date.today) {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          if (consultationDate >= today && consultationDate < tomorrow) return true;
        }
        if (this.filters.date.week) {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (consultationDate >= weekAgo) return true;
        }
        if (this.filters.date.month) {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (consultationDate >= monthAgo) return true;
        }
        return false;
      });
    }

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredConsultations = filtered.slice(start, start + this.itemsPerPage);
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      status: {
        scheduled: true,
        in_progress: true,
        completed: true,
        cancelled: false
      },
      type: {
        first_visit: true,
        follow_up: true,
        emergency: true
      },
      date: {
        today: false,
        week: false,
        month: false
      }
    };
    this.filterConsultations();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.filterConsultations();
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'first_visit': 'Primeira Consulta',
      'follow_up': 'Retorno',
      'emergency': 'Emergência'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'scheduled': 'Agendada',
      'in_progress': 'Em Andamento',
      'completed': 'Concluída',
      'cancelled': 'Cancelada'
    };
    return labels[status] || status;
  }

  openConsultationModal(): void {
    this.router.navigate(['/consultations/new']);
  }

  viewConsultation(consultation: Consultation): void {
    this.router.navigate(['/consultations/', consultation.id]);
  }

  editConsultation(consultation: Consultation): void {
    this.router.navigate(['/consultations/edit', consultation.id]);
  }

  deleteConsultation(consultation: Consultation): void {
    this.router.navigate(['/consultations/delete', consultation.id]);
  }
} 