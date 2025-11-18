import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Patient } from '../../core/models/patient.model';
import { PatientService, CreatePatientRequest } from '../../core/services/patient.service';
import { NotificationService } from '../../core/services/notification.service';
import { PatientViewModalComponent } from './patient-view-modal/patient-view-modal.component';
import { PatientFormModalComponent } from './patient-form-modal/patient-form-modal.component';
import { PatientDeleteModalComponent } from './patient-delete-modal/patient-delete-modal.component';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PatientViewModalComponent,
    PatientFormModalComponent,
    PatientDeleteModalComponent,
  ],
  template: `
    <div class="patients">
      <div class="patients-header">
        <div class="header-left">
          <h1>Clientes</h1>
          <div class="search">
            <i class="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar clientes..."
              [(ngModel)]="searchTerm"
              (ngModelChange)="filterPatients()"
            />
          </div>
        </div>

        <div class="header-right">
          <button class="filter-btn" (click)="toggleFilter()">
            <i class="fas fa-filter"></i>
            Filtros
          </button>
          <button class="add-btn" (click)="openPatientModal()">
            <i class="fas fa-plus"></i>
            Novo Cliente
          </button>
        </div>
      </div>

      <div class="filter-panel" [class.show]="isFilterOpen">
        <div class="filter-group">
          <label>Status</label>
          <div class="filter-options">
            <label class="checkbox">
              <input
                type="checkbox"
                [(ngModel)]="filters.status.active"
                (ngModelChange)="filterPatients()"
              />
              <span>Ativo</span>
            </label>
            <label class="checkbox">
              <input
                type="checkbox"
                [(ngModel)]="filters.status.deleted"
                (ngModelChange)="filterPatients()"
              />
              <span>Excluído</span>
            </label>
          </div>
        </div>

        <div class="filter-actions">
          <button class="clear-btn" (click)="clearFilters()">
            Limpar Filtros
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Carregando clientes...</span>
        </div>
      </div>

      <div *ngIf="error" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ error }}</span>
        <button class="retry-btn" (click)="loadPatients()">
          Tentar novamente
        </button>
      </div>

      <div class="patients-grid" *ngIf="!loading && !error">
        <div class="patients-table">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let patient of filteredPatients">
                <td>
                  <div class="user-info">
                    <div class="patient-details">
                      <span>{{ patient.name }}</span>
                      <span>{{ patient.lastname }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ getPatientEmail(patient) || 'N/A' }}</td>
                <td>{{ getPatientPhone(patient) || 'N/A' }}</td>
                <td>
                  <span class="status-badge" [class]="getStatusClass(patient)">
                    {{ getStatusText(patient) }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="action-btn" (click)="viewPatient(patient)">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" (click)="editPatient(patient)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" (click)="deletePatient(patient)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredPatients.length === 0">
                <td colspan="5" class="empty-state">
                  <p>Nenhum cliente encontrado</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="pagination">
        <button
          class="page-btn"
          [disabled]="currentPage === 1"
          (click)="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info"
          >Página {{ currentPage }} de {{ totalPages }}</span
        >
        <button
          class="page-btn"
          [disabled]="currentPage === totalPages"
          (click)="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <app-patient-view-modal
      *ngIf="showViewModal"
      [patient]="selectedPatient"
      (close)="closeViewModal()"
      (edit)="openEditModal($event)"
    ></app-patient-view-modal>

    <app-patient-form-modal
      *ngIf="showFormModal"
      [patient]="editingPatient"
      [loading]="formLoading"
      (close)="closeFormModal()"
      (save)="savePatient($event)"
    ></app-patient-form-modal>

    <app-patient-delete-modal
      *ngIf="showDeleteModal"
      [patient]="patientToDelete"
      [loading]="deleteLoading"
      (close)="closeDeleteModal()"
      (confirm)="confirmDelete($event)"
    ></app-patient-delete-modal>
  `,
  styles: [
    `
      @use '../../../styles/variables' as *;
      @use '../../../styles/mixins' as *;

      .patients {
        padding: $spacing-lg;
        background-color: $background-color;
        min-height: 100%;
      }

      .patients-header {
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

      .filter-btn,
      .add-btn {
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

      .patients-grid {
        background-color: $background-light;
        border: 1px solid $border-color;
        border-radius: $border-radius-lg;
        overflow: hidden;
        box-shadow: $shadow-sm;
      }

      .patients-table {
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

        th,
        td {
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

      .patient-details {
        @include flex(column, flex-start, flex-start);
        gap: $spacing-xs;
      }

      .type-badge {
        padding: $spacing-xs $spacing-sm;
        background-color: rgba($primary-color, 0.1);
        color: $primary-color;
        border-radius: $border-radius-sm;
        @include typography($font-size-sm, $font-weight-medium);
      }

      .status-badge {
        padding: $spacing-xs $spacing-sm;
        border-radius: $border-radius-sm;
        @include typography($font-size-sm, $font-weight-medium);

        &.active {
          background-color: rgba($success-color, 0.1);
          color: $success-color;
        }

        &.deleted {
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

      .empty-state {
        text-align: center;
        padding: $spacing-xl;
        color: $text-secondary;

        p {
          margin: 0;
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
        .patients-header {
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
    `,
  ],
})
export class PatientsComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
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
  selectedPatient: Patient | null = null;
  editingPatient: Patient | null = null;
  patientToDelete: Patient | null = null;
  formLoading = false;
  deleteLoading = false;

  filters = {
    status: {
      active: true,
      deleted: false,
    },
  };

  constructor(
    private patientService: PatientService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPatients();

    // Verifica query params para abrir modais automaticamente
    this.route.queryParams.subscribe((params) => {
      if (params['new'] === 'true') {
        this.openPatientModal();
        // Remove query param após abrir o modal
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { new: null },
          queryParamsHandling: 'merge',
        });
      } else if (params['id']) {
        // Buscar o paciente pelo ID e abrir o modal de visualização
        this.patientService.getPatientById(params['id']).subscribe({
          next: (patient) => {
            this.viewPatient(patient);
            // Remove query param após abrir o modal
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { id: null },
              queryParamsHandling: 'merge',
            });
          },
          error: (error) => {
            console.error('Erro ao carregar cliente:', error);
            // Remove query param em caso de erro
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { id: null },
              queryParamsHandling: 'merge',
            });
          },
        });
      }
    });
  }

  loadPatients(): void {
    this.loading = true;
    this.error = '';

    this.patientService.getAllPatients().subscribe({
      next: (patients) => {
        this.patients = Array.isArray(patients) ? patients : [];
        this.filterPatients();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erro ao carregar clientes';
        this.patients = [];
        this.filterPatients();
        this.loading = false;
        this.notificationService.error('Erro ao carregar clientes. Por favor, tente novamente.');
      },
    });
  }

  filterPatients(): void {
    let filtered = [...this.patients];

    // MODIFICADO (Ponto 4): Este filtro já não é necessário, pois a API já traz apenas 'client'
    filtered = filtered.filter((patient) => {
      const accountType = patient.TypeAccount?.type?.toLowerCase();
      return accountType === 'client';
    });

    // Search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (cliente) =>
          cliente.name?.toLowerCase().includes(search) ||
          cliente.lastname?.toLowerCase().includes(search) ||
          this.getPatientEmail(cliente)?.toLowerCase().includes(search) // MODIFICADO: Usa a função helper
      );
    }

    // Status filter - aplica apenas se não todos estão marcados
    const allStatusSelected =
      this.filters.status.active && this.filters.status.deleted;
    if (!allStatusSelected) {
      filtered = filtered.filter((patient) => {
        // Ativo: deleted=false ou deleted não definido
        if (this.filters.status.active && !patient.deleted) return true;
        // Excluído: deleted=true
        if (this.filters.status.deleted && patient.deleted === true)
          return true;
        return false;
      });
    }

    // Recalcular paginação
    this.totalPages = Math.max(
      1,
      Math.ceil(filtered.length / this.itemsPerPage)
    );
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));

    // Aplicar paginação
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.filteredPatients = [...filtered.slice(start, end)];
  }

  toggleFilter(): void {
    this.isFilterOpen = !this.isFilterOpen;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filters = {
      status: {
        active: true,
        deleted: false,
      },
    };
    this.currentPage = 1;
    this.filterPatients();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.filterPatients();
  }

  openPatientModal(): void {
    this.editingPatient = null;
    this.showFormModal = true;
  }

  viewPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.showViewModal = true;
  }

  editPatient(patient: Patient): void {
    this.editingPatient = patient;
    this.showFormModal = true;
  }

  deletePatient(patient: Patient): void {
    this.patientToDelete = patient;
    this.showDeleteModal = true;
  }

  // Modal methods
  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedPatient = null;
  }

  openEditModal(patient: Patient): void {
    this.closeViewModal();
    this.editPatient(patient);
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingPatient = null;
    this.formLoading = false;
  }

  savePatient(patientData: CreatePatientRequest): void {
    this.formLoading = true;
    this.error = '';

    if (this.editingPatient) {
      // Update existing patient
      this.patientService
        .updatePatient(this.editingPatient.id, patientData)
        .subscribe({
          next: (response) => {
            this.notificationService.success('Cliente atualizado com sucesso!');
            this.loadPatients();
            this.closeFormModal();
          },
          error: (error) => {
            const errorMsg = error?.error?.message || error?.message || 'Erro desconhecido';
            this.error = 'Erro ao atualizar paciente: ' + errorMsg;
            this.formLoading = false;
            this.notificationService.error(`Erro ao atualizar cliente: ${errorMsg}`);
          },
        });
    } else {
      this.patientService.createPatient(patientData).subscribe({
        next: (response) => {
          this.notificationService.success('Cliente criado com sucesso!');
          this.error = '';
          this.loadPatients();
          this.closeFormModal();
        },
        error: (error) => {
          const errorMsg = error?.error?.message || error?.message || 'Erro desconhecido';
          this.error = 'Erro ao criar Cliente: ' + errorMsg;
          this.formLoading = false;
          this.notificationService.error(`Erro ao criar cliente: ${errorMsg}`);
        },
      });
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.patientToDelete = null;
    this.deleteLoading = false;
  }

  confirmDelete(patient: Patient): void {
    this.deleteLoading = true;

    this.patientService.deletePatient(patient.id).subscribe({
      next: () => {
        this.notificationService.success('Cliente excluído com sucesso!');
        this.loadPatients();
        this.closeDeleteModal();
      },
      error: (error) => {
        const errorMsg = error?.error?.message || error?.message || 'Erro desconhecido';
        this.error = 'Erro ao excluir cliente';
        console.error('Erro ao excluir cliente:', error);
        this.deleteLoading = false;
        this.notificationService.error(`Erro ao excluir cliente: ${errorMsg}`);
      },
    });
  }

  getStatusClass(patient: Patient): string {
    if (patient.deleted) return 'deleted';
    return 'active';
  }

  getStatusText(patient: Patient): string {
    if (patient.deleted) return 'Excluído';
    return 'Ativo';
  }

  getPatientPhone(patient: Patient): string | null {
    // Se já tem phone mapeado, usar
    if (patient.phone) {
      return patient.phone;
    }
    
    // Caso contrário, tentar extrair do array Phones
    if (patient.Phones && patient.Phones.length > 0) {
      const phoneObj = patient.Phones[0];
      
      // Se phoneObj já é uma string, usar diretamente
      if (typeof phoneObj === 'string') {
        return phoneObj;
      }
      
      // Se phoneObj é um objeto
      if (phoneObj && typeof phoneObj === 'object') {
        const phoneNumber = phoneObj.phone;
        const ddd = phoneObj.ddd;
        
        if (ddd && phoneNumber) {
          return `(${ddd}) ${phoneNumber}`;
        } else if (phoneNumber) {
          return String(phoneNumber);
        }
      }
    }
    
    return null;
  }

  getPatientEmail(patient: Patient): string {
    // Primeiro tenta pegar do array de Emails
    if (patient.Emails && patient.Emails.length > 0) {
      return patient.Emails[0].email;
    }
    // Se não tiver array, tenta o campo direto (legado)
    if (patient.email) {
      return patient.email;
    }
    return '';
  }
}