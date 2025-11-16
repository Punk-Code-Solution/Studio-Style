import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas fa-exclamation-triangle"></i>
            Confirmar Exclusão
          </h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="warning-icon">
            <i class="fas fa-trash-alt"></i>
          </div>

          <div class="confirmation-message">
            <h4>Tem certeza que deseja excluir este funcionário?</h4>
            <p>Esta ação não pode ser desfeita.</p>
          </div>

          <div class="employee-info" *ngIf="employee">
            <div class="info-card">
              <div class="info-item">
                <label>
                  <i class="fas fa-user"></i>
                  Nome
                </label>
                <span>{{ employee.name }} {{ employee.lastname }}</span>
              </div>

              <div class="info-item">
                <label>
                  <i class="fas fa-envelope"></i>
                  E-mail
                </label>
                <span>{{ employee.email || 'N/A' }}</span>
              </div>

              <div class="info-item">
                <label>
                  <i class="fas fa-briefcase"></i>
                  Cargo
                </label>
                <span>{{ getRoleLabel(employee.TypeAccount.type) }}</span>
              </div>
            </div>
          </div>

          <div class="warning-text">
            <i class="fas fa-info-circle"></i>
            <span>Esta ação removerá permanentemente o funcionário e todos os dados associados.</span>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeModal()">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button
            type="button"
            class="btn-primary"
            (click)="confirmDelete()"
            [disabled]="loading"
          >
            <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
            <i class="fas fa-trash" *ngIf="!loading"></i>
            {{ loading ? 'Excluindo...' : 'Excluir' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
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
        max-width: 500px;
        width: 90%;
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

          &:hover {
            color: $error-color;
          }
        }
      }

      .modal-body {
        padding: $spacing-lg;
        text-align: center;
        max-height: 70vh;
        overflow-y: auto;

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

      .warning-icon {
        @include flex(row, center, center);
        margin-bottom: $spacing-lg;

        i {
          font-size: 3rem;
          color: $primary-color;
        }
      }

      .confirmation-message {
        margin-bottom: $spacing-xl;

        h4 {
          color: $text-primary;
          @include typography($font-size-lg, $font-weight-medium);
          margin-bottom: $spacing-sm;
        }

        p {
          color: $text-secondary;
          @include typography($font-size-base);
          margin: 0;
        }
      }

      .employee-info {
        margin-bottom: $spacing-xl;
      }

      .info-card {
        background-color: $background-light;
        border: 1px solid $border-color;
        border-radius: $border-radius-sm;
        padding: $spacing-md;
        box-shadow: $shadow-sm;
        text-align: left;
      }

      .info-item {
        @include flex(column, flex-start, flex-start);
        gap: $spacing-xs;
        margin-bottom: $spacing-sm;

        &:last-child {
          margin-bottom: 0;
        }

        label {
          @include flex(row, flex-start, center);
          gap: $spacing-xs;
          color: $text-secondary;
          @include typography($font-size-sm, $font-weight-medium);

          i {
            color: $primary-color;
            width: 16px;
          }
        }

        span {
          color: $text-primary;
          @include typography($font-size-base);
        }
      }

      .warning-text {
        @include flex(row, flex-start, center);
        gap: $spacing-sm;
        padding: $spacing-md;
        background-color: rgba($info-color, 0.1);
        border: 1px solid rgba($info-color, 0.3);
        border-radius: $border-radius-sm;
        color: $info-color;
        @include typography($font-size-sm);

        i {
          color: $info-color;
          flex-shrink: 0;
        }
      }

      .modal-footer {
        @include flex(row, flex-end, center);
        gap: $spacing-md;
        padding: $spacing-lg;
        border-top: 1px solid $border-color;
        background-color: $background-light;

        button {
          @include button;
          @include flex(row, center, center);
          gap: $spacing-sm;
          padding: $spacing-sm $spacing-md;
          min-width: 120px;
          border: 1px solid $border-color;
          box-shadow: $shadow-sm;

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        .btn-secondary {
          background-color: $text-secondary;
          color: $text-light;

          &:hover:not(:disabled) {
            background-color: color.adjust($text-secondary, $lightness: -10%);
            transform: translateY(-1px);
          }
        }

        .btn-primary {
          background-color: $primary-color;
          color: $text-light;

          &:hover:not(:disabled) {
            background-color: $primary-dark;
            transform: translateY(-1px);
          }
        }
      }

      @include responsive(md) {
        .modal-container {
          width: 95%;
          margin: $spacing-sm;
        }

        .modal-footer {
          flex-direction: column;

          button {
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class EmployeeDeleteModalComponent {
  @Input() employee: Employee | null = null;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<Employee>();

  closeModal(): void {
    this.close.emit();
  }

  confirmDelete(): void {
    if (this.employee) {
      this.confirm.emit(this.employee);
    }
  }

  getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      'provider': 'Prestador de Serviço',
      'admin': 'Administrador',
      'enfermeiro': 'Enfermeiro',
      'recepcionista': 'Recepcionista',
      'administrativo': 'Administrativo',
      'client': 'Cliente'
    };
    return roles[role] || role;
  }
}
