import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HairType } from '../../../core/services/hair-type.service';

interface HairTypeFormData {
  type: string;
  level: number | null;
  letter: string;
}

@Component({
  selector: 'app-hair-type-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas" [class.fa-edit]="isEditMode" [class.fa-plus]="!isEditMode"></i>
            {{ isEditMode ? 'Editar Tipo de Cabelo' : 'Novo Tipo de Cabelo' }}
          </h3>
          <button class="close-btn" (click)="closeModal()" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form (ngSubmit)="onSubmit(hairTypeForm)" #hairTypeForm="ngForm" novalidate>
            <div class="form-group">
              <label for="type">
                <i class="fas fa-tag"></i>
                Tipo de Cabelo *
              </label>
              <input
                type="text"
                id="type"
                [(ngModel)]="hairTypeData.type"
                name="type"
                required
                minlength="2"
                placeholder="Digite o tipo de cabelo"
                #typeField="ngModel"
              >
              <div class="error-message" *ngIf="typeField.invalid && typeField.touched">
                <span *ngIf="typeField.errors?.['required']">Tipo de cabelo é obrigatório</span>
                <span *ngIf="typeField.errors?.['minlength']">Tipo deve ter pelo menos 2 caracteres</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="level">
                  <i class="fas fa-sort-numeric-up"></i>
                  Nível
                </label>
                <input
                  type="number"
                  id="level"
                  [(ngModel)]="hairTypeData.level"
                  name="level"
                  min="0"
                  placeholder="Digite o nível (opcional)"
                >
              </div>

              <div class="form-group">
                <label for="letter">
                  <i class="fas fa-font"></i>
                  Letra
                </label>
                <input
                  type="text"
                  id="letter"
                  [(ngModel)]="hairTypeData.letter"
                  name="letter"
                  maxlength="1"
                  placeholder="Digite a letra (opcional)"
                >
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeModal()">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button type="submit" class="btn-primary" [disabled]="loading" (click)="onSubmit(hairTypeForm)">
            <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
            <i class="fas" [class.fa-save]="isEditMode" [class.fa-plus]="!isEditMode" *ngIf="!loading"></i>
            {{ loading ? 'Salvando...' : (isEditMode ? 'Salvar' : 'Criar') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #ddd;
      background-color: #f5f5f5;
    }

    .modal-header h3 {
      margin: 0;
      color: #1976d2;
      font-size: 1.25rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #666;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
    }

    .close-btn:hover {
      color: #f44336;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
    }

    .form-group i {
      color: #1976d2;
      width: 16px;
    }

    input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .error-message {
      color: #f44336;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #ddd;
      background-color: #f5f5f5;
    }

    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      min-width: 120px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #666;
      color: white;
      border: 1px solid #666;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #555;
      transform: translateY(-1px);
    }

    .btn-primary {
      background-color: #1976d2;
      color: white;
      border: 1px solid #1976d2;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #1565c0;
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .modal-container {
        width: 95%;
        margin: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .modal-footer {
        flex-direction: column;
      }

      button {
        width: 100%;
      }
    }
  `]
})
export class HairTypeFormModalComponent implements OnInit {
  @Input() hairType: HairType | null = null;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<HairType>>();

  isEditMode = false;
  hairTypeData: HairTypeFormData = {
    type: '',
    level: null,
    letter: ''
  };

  constructor() {}

  ngOnInit(): void {
    if (this.hairType) {
      this.isEditMode = true;
      this.hairTypeData = {
        type: this.hairType.type || '',
        level: this.hairType.level || null,
        letter: this.hairType.letter || ''
      };
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  onSubmit(form?: NgForm): void {
    if (!form || form.invalid) {
      return;
    }

    const dataToSend: Partial<HairType> = {
      type: this.hairTypeData.type,
      level: this.hairTypeData.level || undefined,
      letter: this.hairTypeData.letter || undefined
    };

    this.save.emit(dataToSend);
  }
}

