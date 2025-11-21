import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HairTypeService, HairType } from '../../core/services/hair-type.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { HairTypeFormModalComponent } from './hair-type-form-modal/hair-type-form-modal.component';
import { HairTypeDeleteModalComponent } from './hair-type-delete-modal/hair-type-delete-modal.component';

@Component({
  selector: 'app-hair-types',
  standalone: true,
  imports: [CommonModule, FormsModule, HairTypeFormModalComponent, HairTypeDeleteModalComponent],
  template: `
    <div class="page-container">
      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Carregando tipos de cabelo...</span>
      </div>

      <!-- Header Section -->
      <div class="header">
        <div class="header-left">
          <h2>Tipos de Cabelo</h2>
          <div class="search">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Buscar tipos de cabelo..." 
              [(ngModel)]="searchTerm" 
              (input)="filterHairTypes()"
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
            Novo Tipo de Cabelo
          </button>
        </div>
      </div>

      <!-- Hair Types Grid -->
      <div class="hair-types-grid" *ngIf="!isLoading">
        <div class="hair-types-table">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nível</th>
                <th>Letra</th>
                <th *ngIf="isAdmin">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let hairType of paginatedHairTypes">
                <td>{{ hairType.type }}</td>
                <td>{{ hairType.level || '-' }}</td>
                <td>{{ hairType.letter || '-' }}</td>
                <td *ngIf="isAdmin">
                  <div class="actions">
                    <button class="action-btn" (click)="openEditModal(hairType)" title="Editar tipo de cabelo">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" (click)="confirmDelete(hairType)" title="Excluir tipo de cabelo">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredHairTypes.length === 0">
                <td [attr.colspan]="isAdmin ? 4 : 3" class="empty-state">
                  <p>Nenhum tipo de cabelo encontrado</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="!isLoading && filteredHairTypes.length > 0">
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

      <!-- Hair Type Form Modal -->
      <app-hair-type-form-modal
        *ngIf="isModalOpen"
        [hairType]="selectedHairType"
        [loading]="isSubmitting"
        (close)="closeModal()"
        (save)="onSaveHairType($event)"
      ></app-hair-type-form-modal>

      <!-- Hair Type Delete Modal -->
      <app-hair-type-delete-modal
        *ngIf="isDeleteModalOpen"
        [hairType]="selectedHairType"
        [loading]="isDeleteLoading"
        (close)="onCloseDeleteModal()"
        (confirm)="onConfirmDelete()"
      ></app-hair-type-delete-modal>
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

    .hair-types-grid {
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .hair-types-table {
      overflow-x: auto;
    }

    .hair-types-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .hair-types-table th,
    .hair-types-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    .hair-types-table th {
      background-color: #f5f5f5;
      color: #333;
      font-weight: 500;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hair-types-table td {
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
export class HairTypesComponent implements OnInit {
  hairTypes: HairType[] = [];
  filteredHairTypes: HairType[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;
  isModalOpen = false;
  isSubmitting = false;
  selectedHairType: HairType | null = null;
  isDeleteModalOpen = false;
  isDeleteLoading = false;
  isAdmin = false;

  constructor(
    private hairTypeService: HairTypeService,
    public authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.hasRole('admin');
    this.loadHairTypes();
  }

  loadHairTypes() {
    this.isLoading = true;
    this.hairTypeService.getAllHairTypes().subscribe({
      next: (hairTypes) => {
        console.log('Hair types loaded:', hairTypes);
        this.hairTypes = hairTypes || [];
        this.filterHairTypes();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading hair types:', error);
        this.notificationService.error('Erro ao carregar tipos de cabelo. Por favor, tente novamente.');
        this.hairTypes = [];
        this.filterHairTypes();
        this.isLoading = false;
      }
    });
  }

  get paginatedHairTypes(): HairType[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredHairTypes.slice(start, end);
  }

  filterHairTypes() {
    let filtered = [...this.hairTypes];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(hairType =>
        hairType.type?.toLowerCase().includes(search) ||
        hairType.letter?.toLowerCase().includes(search) ||
        hairType.level?.toString().includes(search)
      );
    }

    this.filteredHairTypes = filtered;
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  openCreateModal(): void {
    this.selectedHairType = null;
    this.isModalOpen = true;
  }

  openEditModal(hairType: HairType): void {
    this.selectedHairType = hairType;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedHairType = null;
  }

  confirmDelete(hairType: HairType) {
    this.selectedHairType = hairType;
    this.isDeleteModalOpen = true;
  }

  onCloseDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedHairType = null;
  }

  onConfirmDelete(): void {
    if (!this.selectedHairType) return;

    this.isDeleteLoading = true;
    this.hairTypeService.deleteHairType(this.selectedHairType.id).subscribe({
      next: () => {
        this.notificationService.success('Tipo de cabelo excluído com sucesso!');
        this.onCloseDeleteModal();
        this.loadHairTypes();
        this.isDeleteLoading = false;
      },
      error: (error) => {
        this.notificationService.error('Erro ao excluir tipo de cabelo. Por favor, tente novamente.');
        this.isDeleteLoading = false;
      }
    });
  }

  onSaveHairType(hairTypeData: Partial<HairType>): void {
    if (!hairTypeData.type) {
      this.notificationService.error('Por favor, preencha o tipo de cabelo.');
      return;
    }

    this.isSubmitting = true;
    const request = {
      type: hairTypeData.type,
      level: hairTypeData.level || null,
      letter: hairTypeData.letter || null
    };

    if (this.selectedHairType?.id) {
      // Update
      this.hairTypeService.updateHairType({ id: this.selectedHairType.id, ...request }).subscribe({
        next: (result) => {
          console.log('Hair type updated:', result);
          this.notificationService.success('Tipo de cabelo atualizado com sucesso!');
          this.closeModal();
          this.loadHairTypes();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error updating hair type:', error);
          const errorMsg = error.error?.message || error.message || 'Erro ao atualizar tipo de cabelo. Por favor, tente novamente.';
          this.notificationService.error(errorMsg);
          this.isSubmitting = false;
        }
      });
    } else {
      // Create
      this.hairTypeService.createHairType(request).subscribe({
        next: (result) => {
          console.log('Hair type created:', result);
          this.notificationService.success('Tipo de cabelo criado com sucesso!');
          this.closeModal();
          this.loadHairTypes();
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error creating hair type:', error);
          const errorMsg = error.error?.message || error.message || 'Erro ao criar tipo de cabelo. Por favor, tente novamente.';
          this.notificationService.error(errorMsg);
          this.isSubmitting = false;
        }
      });
    }
  }
}

