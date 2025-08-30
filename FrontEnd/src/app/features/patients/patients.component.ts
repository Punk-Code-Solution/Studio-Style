import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';
import { Patient } from '../../core/models/patient.model';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="patients-container">
      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Carregando pacientes...</span>
      </div>

      <!-- Error Message -->
      <div class="error-message" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
        <button class="retry-btn" (click)="retryLoading()">
          <i class="fas fa-redo"></i>
          Tentar Novamente
        </button>
      </div>

      <!-- Header Section -->
      <div class="header">
        <div class="header-left">
          <h2>Pacientes</h2>
          <div class="search">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Buscar pacientes..." 
              [(ngModel)]="searchTerm" 
              (input)="filterPatients()"
              [disabled]="isLoading"
            >
          </div>
        </div>

        <div class="header-right">
          <button class="filter-btn" (click)="toggleFilter()" [disabled]="isLoading">
            <i class="fas fa-filter"></i>
            Filtros
          </button>
          <button class="add-btn" routerLink="/patients/new" [disabled]="isLoading">
            <i class="fas fa-plus"></i>
            Novo Paciente
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
                (change)="filterPatients()"
              >
              <span>Ativos</span>
            </label>
            <label class="checkbox">
              <input 
                type="checkbox" 
                [(ngModel)]="filters.status.inactive" 
                (change)="filterPatients()"
              >
              <span>Inativos</span>
            </label>
          </div>
        </div>

        <div class="filter-actions">
          <button class="clear-btn" (click)="clearFilters()">Limpar Filtros</button>
        </div>
      </div>

      <!-- Patients Table -->
      <div class="patients-table" *ngIf="!isLoading">
        <div class="table-header">
          <span class="results-count">
            {{ filteredPatients.length }} paciente{{ filteredPatients.length !== 1 ? 's' : '' }} encontrado{{ filteredPatients.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Última Visita</th>
              <th>Próxima Consulta</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredPatients.length === 0">
              <td colspan="7" class="empty-state">
                <i class="fas fa-user-slash"></i>
                <p>Nenhum paciente encontrado</p>
                <small *ngIf="searchTerm || selectedStatus">
                  Tente ajustar os filtros de busca
                </small>
              </td>
            </tr>
            <tr *ngFor="let patient of paginatedPatients">
              <td>
                <div class="patient-info">
                  <img [src]="patient.avatar || 'assets/images/default-avatar.png'" [alt]="patient.nome" class="avatar">
                  <span>{{ patient.nome }}</span>
                </div>
              </td>
              <td>{{ patient.email }}</td>
              <td>{{ patient.telefone }}</td>
              <td>
                <span class="status-badge" [class]="getStatusClass(patient.status)">
                  {{ getStatusLabel(patient.status) }}
                </span>
              </td>
              <td>{{ formatDate(patient.ultimaVisita) }}</td>
              <td>{{ formatDate(patient.proximaConsulta) }}</td>
              <td>
                <div class="actions">
                  <button class="action-btn" [routerLink]="['/patients', patient.id]" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="action-btn" [routerLink]="['/patients', patient.id, 'edit']" title="Editar paciente">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn delete" (click)="deletePatient(patient)" title="Excluir paciente">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && filteredPatients.length === 0">
        <i class="fas fa-users"></i>
        <h3>Nenhum paciente encontrado</h3>
        <p>Tente ajustar os filtros ou realizar uma nova busca</p>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="!isLoading && filteredPatients.length > 0">
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
    .patients-container {
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

      h2 {
        margin: 0;
        color: #1976d2;
      }
    }

    .search {
      position: relative;
      width: 300px;

      i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
      }

      input {
        width: 100%;
        padding: 0.5rem 1rem 0.5rem 2.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;

        &:focus {
          outline: none;
          border-color: #1976d2;
        }

        &:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
      }
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

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .filter-btn {
      background: #f5f5f5;
      color: #333;

      &:hover:not(:disabled) {
        background: #e0e0e0;
      }
    }

    .add-btn {
      background: #1976d2;
      color: white;

      &:hover:not(:disabled) {
        background: #1565c0;
      }
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

      i {
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

        &:hover {
          background: rgba(211, 47, 47, 0.1);
        }
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      color: #666;

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
    }

    .filter-panel {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: none;

      &.show {
        display: block;
      }
    }

    .filter-group {
      margin-bottom: 1.5rem;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        color: #333;
        font-weight: 500;
        margin-bottom: 0.5rem;
      }
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

      input {
        width: 16px;
        height: 16px;
      }

      span {
        color: #333;
      }
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
      transition: all 0.2s;

      &:hover {
        background: #f5f5f5;
      }
    }

    .patients-table {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .table-header {
      padding: 1rem;
      border-bottom: 1px solid #ddd;
      background: #f5f5f5;
    }

    .results-count {
      color: #666;
      font-size: 0.875rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      background: #f5f5f5;
      font-weight: 500;
      color: #333;
    }

    td {
      color: #333;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);

      i {
        font-size: 3rem;
        color: #ddd;
        margin-bottom: 1rem;
      }

      h3 {
        color: #333;
        margin: 0 0 0.5rem;
      }

      p {
        color: #666;
        margin: 0;
      }
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
    }

    .page-btn {
      padding: 0.5rem;
      background: transparent;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #f5f5f5;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .page-info {
      color: #333;
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

      .patients-table {
        overflow-x: auto;
      }

      .action-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  searchTerm: string = '';
  selectedStatus: string = '';
  isFilterOpen = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  filters = {
    status: {
      active: true,
      inactive: true
    }
  };

  constructor(
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.patientService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.filterPatients();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar pacientes:', error);
        this.errorMessage = 'Não foi possível carregar a lista de pacientes. Por favor, tente novamente.';
        this.isLoading = false;
      }
    });
  }

  retryLoading(): void {
    this.loadPatients();
  }

  filterPatients(): void {
    let filtered = [...this.patients];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.nome.toLowerCase().includes(search) ||
        patient.email.toLowerCase().includes(search) ||
        patient.telefone.includes(search)
      );
    }

    // Status filter
    if (!this.filters.status.active || !this.filters.status.inactive) {
      filtered = filtered.filter(patient => {
        if (this.filters.status.active && patient.status === 'ativo') return true;
        if (this.filters.status.inactive && patient.status === 'inativo') return true;
        return false;
      });
    }

    this.filteredPatients = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      status: {
        active: true,
        inactive: true
      }
    };
    this.filterPatients();
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  deletePatient(patient: Patient): void {
    if (confirm(`Tem certeza que deseja excluir o paciente ${patient.nome}?`)) {
      this.isLoading = true;
      this.patientService.deletePatient(patient.id).subscribe({
        next: () => {
          this.loadPatients();
        },
        error: (error) => {
          console.error('Erro ao excluir paciente:', error);
          this.errorMessage = 'Não foi possível excluir o paciente. Por favor, tente novamente.';
          this.isLoading = false;
        }
      });
    }
  }

  getStatusLabel(status: Patient['status']): string {
    return status === 'ativo' ? 'Ativo' : 'Inativo';
  }

  getStatusClass(status: Patient['status']): string {
    return status === 'ativo' ? 'active' : 'inactive';
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }

  get paginatedPatients() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPatients.slice(start, end);
  }
}

