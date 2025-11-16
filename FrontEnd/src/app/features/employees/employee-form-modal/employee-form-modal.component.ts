import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { EmployeeService, Employee } from '../../../core/services/employee.service';

interface EmployeeFormData {
  name: string;
  lastname: string;
  email: string;
  password: string;
  phone: string;
  role: 'enfermeiro' | 'recepcionista' | 'administrativo' | 'admin' | 'provider' | '';
  address: string;
}

@Component({
  selector: 'app-employee-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas" [class.fa-edit]="isEditMode" [class.fa-plus]="!isEditMode"></i>
            {{ isEditMode ? 'Editar Funcionário' : 'Novo Funcionário' }}
          </h3>
          <button class="close-btn" (click)="closeModal()" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form (ngSubmit)="onSubmit(employeeForm)" #employeeForm="ngForm" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label for="name">
                  <i class="fas fa-user"></i>
                  Nome *
                </label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="employeeData.name"
                  name="name"
                  required
                  minlength="3"
                  placeholder="Digite o nome"
                  #nameField="ngModel"
                >
                <div class="error-message" *ngIf="nameField.invalid && nameField.touched">
                  <span *ngIf="nameField.errors?.['required']">Nome é obrigatório</span>
                  <span *ngIf="nameField.errors?.['minlength']">Nome deve ter pelo menos 3 caracteres</span>
                </div>
              </div>

              <div class="form-group">
                <label for="lastname">
                  <i class="fas fa-user"></i>
                  Sobrenome *
                </label>
                <input
                  type="text"
                  id="lastname"
                  [(ngModel)]="employeeData.lastname"
                  name="lastname"
                  required
                  minlength="2"
                  placeholder="Digite o sobrenome"
                  #lastnameField="ngModel"
                >
                <div class="error-message" *ngIf="lastnameField.invalid && lastnameField.touched">
                  <span *ngIf="lastnameField.errors?.['required']">Sobrenome é obrigatório</span>
                  <span *ngIf="lastnameField.errors?.['minlength']">Sobrenome deve ter pelo menos 2 caracteres</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">
                  <i class="fas fa-envelope"></i>
                  E-mail *
                </label>
                <input
                  type="email"
                  id="email"
                  [(ngModel)]="employeeData.email"
                  name="email"
                  required
                  email
                  placeholder="Digite o e-mail"
                  #emailField="ngModel"
                >
                <div class="error-message" *ngIf="emailField.invalid && emailField.touched">
                  <span *ngIf="emailField.errors?.['required']">E-mail é obrigatório</span>
                  <span *ngIf="emailField.errors?.['email']">E-mail inválido</span>
                </div>
              </div>

              <div class="form-group">
                <label for="phone">
                  <i class="fas fa-phone"></i>
                  Telefone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  [(ngModel)]="employeeData.phone"
                  name="phone"
                  required
                  placeholder="(00) 00000-0000"
                  #phoneField="ngModel"
                >
                <div class="error-message" *ngIf="phoneField.invalid && phoneField.touched">
                  Telefone é obrigatório
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="role">
                  <i class="fas fa-briefcase"></i>
                  Cargo *
                </label>
                <select
                  id="role"
                  [(ngModel)]="employeeData.role"
                  name="role"
                  required
                  #roleField="ngModel"
                >
                  <option value="">Selecione um cargo</option>
                  <option value="provider">Prestador de Serviço</option>
                  <option value="admin">Administrador</option>
                  <option value="enfermeiro">Enfermeiro</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="administrativo">Administrativo</option>
                </select>
                <div class="error-message" *ngIf="roleField.invalid && roleField.touched">
                  Cargo é obrigatório
                </div>
              </div>

              <div class="form-group">
                <label for="password">
                  <i class="fas fa-lock"></i>
                  Senha {{ isEditMode ? '(opcional)' : '*' }}
                </label>
                <input
                  type="password"
                  id="password"
                  [(ngModel)]="employeeData.password"
                  name="password"
                  [required]="!isEditMode"
                  minlength="6"
                  placeholder="Digite a senha"
                  #passwordField="ngModel"
                >
                <div class="error-message" *ngIf="passwordField.invalid && passwordField.touched">
                  <span *ngIf="passwordField.errors?.['required']">Senha é obrigatória</span>
                  <span *ngIf="passwordField.errors?.['minlength']">Senha deve ter pelo menos 6 caracteres</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="address">
                <i class="fas fa-map-marker-alt"></i>
                Endereço (Opcional)
              </label>
              <input
                type="text"
                id="address"
                [(ngModel)]="employeeData.address"
                name="address"
                placeholder="Digite o endereço completo"
              >
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeModal()">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button type="submit" class="btn-primary" [disabled]="loading" (click)="onSubmit(employeeForm)">
            <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
            <i class="fas" [class.fa-save]="isEditMode" [class.fa-plus]="!isEditMode" *ngIf="!loading"></i>
            {{ loading ? 'Salvando...' : (isEditMode ? 'Salvar' : 'Criar') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use 'sass:color';
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      @include flex(column, center, center);
      z-index: 1000;
    }

    .modal-container {
      background: white;
      border-radius: $border-radius-lg;
      box-shadow: $shadow-lg;
      max-width: 700px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      @include flex(column, flex-start, stretch);
    }

    .modal-header {
      @include flex(row, space-between, center);
      padding: $spacing-lg;
      border-bottom: 1px solid $border-color;
      background-color: $background-light;

      h3 {
        margin: 0;
        color: $primary-color;
        @include typography($font-size-lg, $font-weight-medium);
        @include flex(row, flex-start, center);
        gap: $spacing-sm;

        i {
          color: $primary-color;
        }
      }

      .close-btn {
        @include button(transparent, $text-secondary);
        padding: $spacing-xs;
        font-size: $font-size-lg;
        border: none;
        cursor: pointer;

        &:hover {
          color: $error-color;
        }
      }
    }

    .modal-body {
      padding: $spacing-lg;
      overflow-y: auto;
      flex: 1;

      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: $primary-color;
        border-radius: 4px;
      }
    }

    .form-group {
      margin-bottom: $spacing-lg;

      label {
        @include flex(row, flex-start, center);
        gap: $spacing-sm;
        margin-bottom: $spacing-sm;
        color: $text-primary;
        @include typography($font-size-base, $font-weight-medium);

        i {
          color: $primary-color;
          width: 16px;
        }
      }

      input, select, textarea {
        width: 100%;
        padding: $spacing-sm;
        border: 1px solid $border-color;
        border-radius: $border-radius-sm;
        @include typography($font-size-base);
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: $primary-color;
          box-shadow: 0 0 0 2px rgba($primary-color, 0.1);
        }

        &.error {
          border-color: $error-color;
        }
      }

      .error-message {
        color: $error-color;
        @include typography($font-size-sm);
        margin-top: $spacing-xs;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: $spacing-md;
    }

    .modal-footer {
      @include flex(row, flex-end, center);
      gap: $spacing-md;
      padding: $spacing-lg;
      border-top: 1px solid $border-color;
      background-color: $background-light;

      button {
        @include flex(row, center, center);
        gap: $spacing-sm;
        padding: $spacing-sm $spacing-md;
        min-width: 120px;
        border: 1px solid $border-color;
        box-shadow: $shadow-sm;
        cursor: pointer;
        @include typography($font-size-base, $font-weight-medium);
        border-radius: $border-radius-sm;
        transition: all 0.2s ease;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .btn-secondary {
        background-color: $text-secondary;
        color: $text-light;
        border: 1px solid $text-secondary;

        &:hover:not(:disabled) {
          background-color: color.adjust($text-secondary, $lightness: -10%);
          transform: translateY(-1px);
        }
      }

      .btn-primary {
        background-color: $primary-color;
        color: $text-light;
        border: 1px solid $primary-color;

        &:hover:not(:disabled) {
          background-color: $primary-dark;
          transform: translateY(-1px);
        }
      }
    }

    @media (max-width: 768px) {
      .modal-container {
        width: 95%;
        margin: $spacing-sm;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .modal-footer {
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }
  `]
})
export class EmployeeFormModalComponent implements OnInit {
  @Input() employee: Employee | null = null;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Employee>>();

  isEditMode = false;
  employeeData: EmployeeFormData = {
    name: '',
    lastname: '',
    email: '',
    password: '',
    phone: '',
    role: '',
    address: ''
  };

  constructor() {}

  ngOnInit(): void {
    if (this.employee) {
      this.isEditMode = true;
      this.employeeData = {
        name: this.employee.name || '',
        lastname: this.employee.lastname || '',
        email: this.employee.email || '',
        password: '',
        phone: this.employee.phone || '',
        role: this.employee.role || '',
        address: this.employee.address || ''
      };
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  onSubmit(form?: NgForm): void {
    if (!form) {
      return;
    }

    if (form.invalid) {
      return;
    }

    const dataToSend: Partial<Employee> = {
      name: this.employeeData.name,
      lastname: this.employeeData.lastname,
      email: this.employeeData.email,
      phone: this.employeeData.phone || undefined,
      role: this.employeeData.role as any,
      address: this.employeeData.address || undefined
    };

    if (this.employeeData.password && this.employeeData.password.trim()) {
      (dataToSend as any).password = this.employeeData.password;
    }

    this.save.emit(dataToSend);
  }
}
