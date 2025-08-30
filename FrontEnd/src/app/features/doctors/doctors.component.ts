import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  crm: string;
  specialty: string;
  status: 'active' | 'inactive';
  avatar: string;
  schedule: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
}

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="doctors">
      <div class="doctors-header">
        <div class="header-left">
          <h1>Médicos</h1>
          <div class="search">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar médicos..." [(ngModel)]="searchTerm" (input)="filterDoctors()">
          </div>
        </div>

        <div class="header-right">
          <button class="filter-btn" (click)="toggleFilter()">
            <i class="fas fa-filter"></i>
            Filtros
          </button>
          <button class="add-btn" (click)="openDoctorModal()">
            <i class="fas fa-plus"></i>
            Novo Médico
          </button>
        </div>
      </div>

      <div class="filter-panel" [class.show]="isFilterOpen">
        <div class="filter-group">
          <label>Status</label>
          <div class="filter-options">
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.active" (change)="filterDoctors()">
              <span>Ativos</span>
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="filters.status.inactive" (change)="filterDoctors()">
              <span>Inativos</span>
            </label>
          </div>
        </div>

        <div class="filter-group">
          <label>Especialidade</label>
          <div class="filter-options">
            <label class="checkbox" *ngFor="let specialty of specialties">
              <input type="checkbox" [(ngModel)]="filters.specialties[specialty]" (change)="filterDoctors()">
              <span>{{ specialty }}</span>
            </label>
          </div>
        </div>

        <div class="filter-actions">
          <button class="clear-btn" (click)="clearFilters()">Limpar Filtros</button>
        </div>
      </div>

      <div class="doctors-grid">
        <div class="doctors-table">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CRM</th>
                <th>Especialidade</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doctor of filteredDoctors">
                <td>
                  <div class="doctor-info">
                    <img [src]="doctor.avatar" [alt]="doctor.name" class="avatar">
                    <span>{{ doctor.name }}</span>
                  </div>
                </td>
                <td>{{ doctor.crm }}</td>
                <td>{{ doctor.specialty }}</td>
                <td>{{ doctor.email }}</td>
                <td>{{ doctor.phone }}</td>
                <td>
                  <span class="status-badge" [class]="doctor.status">
                    {{ doctor.status === 'active' ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="action-btn" (click)="viewDoctor(doctor)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" (click)="editDoctor(doctor)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" (click)="deleteDoctor(doctor)">
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

    .doctors {
      padding: $spacing-lg;
    }

    .doctors-header {
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

    .doctors-grid {
      background-color: $background-light;
      border: 1px solid $border-color;
      border-radius: $border-radius-lg;
      overflow: hidden;
    }

    .doctors-table {
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

    .doctor-info {
      @include flex(row, flex-start, center);
      gap: $spacing-sm;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: $border-radius-full;
      object-fit: cover;
    }

    .status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      @include typography($font-size-sm, $font-weight-medium);
      text-transform: capitalize;

      &.active {
        background-color: rgba($success-color, 0.1);
        color: $success-color;
      }

      &.inactive {
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
      .doctors-header {
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
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  searchTerm = '';
  isFilterOpen = false;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  specialties = [
    'Clínico Geral',
    'Cardiologia',
    'Dermatologia',
    'Endocrinologia',
    'Ginecologia',
    'Neurologia',
    'Oftalmologia',
    'Ortopedia',
    'Pediatria',
    'Psiquiatria'
  ];

  filters = {
    status: {
      active: true,
      inactive: false
    },
    specialties: this.specialties.reduce((acc, specialty) => {
      acc[specialty] = true;
      return acc;
    }, {} as { [key: string]: boolean })
  };

  constructor() {}

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    // Simulated data
    this.doctors = [
      {
        id: 1,
        name: 'Dr. João Santos',
        email: 'joao.santos@email.com',
        phone: '(11) 99999-9999',
        crm: '12345',
        specialty: 'Clínico Geral',
        status: 'active',
        avatar: 'https://via.placeholder.com/32x32',
        schedule: {
          monday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
          tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
          wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
          thursday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
          friday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
          saturday: [],
          sunday: []
        }
      },
      {
        id: 2,
        name: 'Dra. Ana Costa',
        email: 'ana.costa@email.com',
        phone: '(11) 98888-8888',
        crm: '67890',
        specialty: 'Cardiologia',
        status: 'active',
        avatar: 'https://via.placeholder.com/32x32',
        schedule: {
          monday: ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00'],
          tuesday: ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00'],
          wednesday: ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00'],
          thursday: ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00'],
          friday: ['08:00', '09:00', '10:00', '13:00', '14:00', '15:00'],
          saturday: [],
          sunday: []
        }
      },
      {
        id: 3,
        name: 'Dr. Carlos Oliveira',
        email: 'carlos.oliveira@email.com',
        phone: '(11) 97777-7777',
        crm: '54321',
        specialty: 'Neurologia',
        status: 'inactive',
        avatar: 'https://via.placeholder.com/32x32',
        schedule: {
          monday: ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
          tuesday: ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
          wednesday: ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
          thursday: ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
          friday: ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],
          saturday: [],
          sunday: []
        }
      }
    ];

    this.filterDoctors();
  }

  filterDoctors(): void {
    let filtered = [...this.doctors];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(search) ||
        doctor.email.toLowerCase().includes(search) ||
        doctor.phone.includes(search) ||
        doctor.crm.includes(search) ||
        doctor.specialty.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (!this.filters.status.active || !this.filters.status.inactive) {
      filtered = filtered.filter(doctor => {
        if (this.filters.status.active && doctor.status === 'active') return true;
        if (this.filters.status.inactive && doctor.status === 'inactive') return true;
        return false;
      });
    }

    // Specialty filter
    const selectedSpecialties = Object.entries(this.filters.specialties)
      .filter(([_, selected]) => selected)
      .map(([specialty]) => specialty);

    if (selectedSpecialties.length > 0) {
      filtered = filtered.filter(doctor => selectedSpecialties.includes(doctor.specialty));
    }

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredDoctors = filtered.slice(start, start + this.itemsPerPage);
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      status: {
        active: true,
        inactive: false
      },
      specialties: this.specialties.reduce((acc, specialty) => {
        acc[specialty] = true;
        return acc;
      }, {} as { [key: string]: boolean })
    };
    this.filterDoctors();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.filterDoctors();
  }

  openDoctorModal(): void {
    // Implement doctor modal
  }

  viewDoctor(doctor: Doctor): void {
    // Implement view doctor
  }

  editDoctor(doctor: Doctor): void {
    // Implement edit doctor
  }

  deleteDoctor(doctor: Doctor): void {
    // Implement delete doctor
  }
} 