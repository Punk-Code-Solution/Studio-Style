import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Patient } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patient-view-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas fa-eye"></i>
            Detalhes do Cliente
          </h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body" *ngIf="patient">
          <div class="patient-details">
            <div class="detail-section">
              <h4>Informações Básicas</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>
                    <i class="fas fa-user"></i>
                    Nome
                  </label>
                  <span>{{ patient.name }} {{ patient.lastname }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-envelope"></i>
                    E-mail
                  </label>
                  <span>{{ patient.email || 'N/A' }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-phone"></i>
                    Telefone
                  </label>
                  <span>{{ getPhone(patient) || 'N/A' }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-id-card"></i>
                    CPF
                  </label>
                  <span>{{ patient.cpf || 'N/A' }}</span>
                </div>

                <div class="detail-item" *ngIf="patient.birthday">
                  <label>
                    <i class="fas fa-birthday-cake"></i>
                    Data de Nascimento
                  </label>
                  <span>{{ patient.birthday | date:'dd/MM/yyyy' }}</span>
                </div>

                <div class="detail-item" *ngIf="patient.start_date">
                  <label>
                    <i class="fas fa-calendar-alt"></i>
                    Data de Início
                  </label>
                  <span>{{ patient.start_date | date:'dd/MM/yyyy' }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-info-circle"></i>
                    Status
                  </label>
                  <span class="status-badge" [class]="getStatusClass(patient)">
                    {{ getStatusText(patient) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>Informações do Sistema</h4>
              <div class="detail-grid">
                <div class="detail-item" *ngIf="patient.TypeAccount">
                  <label>
                    <i class="fas fa-user-tag"></i>
                    Tipo de Conta
                  </label>
                  <span>{{ patient.TypeAccount.type || 'N/A' }}</span>
                </div>

                <div class="detail-item" *ngIf="patient.createdAt">
                  <label>
                    <i class="fas fa-plus"></i>
                    Criado em
                  </label>
                  <span>{{ patient.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>

                <div class="detail-item" *ngIf="patient.updatedAt">
                  <label>
                    <i class="fas fa-edit"></i>
                    Atualizado em
                  </label>
                  <span>{{ patient.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" (click)="closeModal()">
            <i class="fas fa-times"></i>
            Fechar
          </button>
          <button class="btn-primary" (click)="editPatient()">
            <i class="fas fa-edit"></i>
            Editar
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
      max-width: 600px;
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

    .patient-details {
      @include flex(column, flex-start, stretch);
      gap: $spacing-xl;
    }

    .detail-section {
      h4 {
        color: $text-primary;
        @include typography($font-size-base, $font-weight-medium);
        margin-bottom: $spacing-md;
        padding-bottom: $spacing-sm;
        border-bottom: 1px solid $border-color;
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: $spacing-md;
    }

    .detail-item {
      @include flex(column, flex-start, flex-start);
      gap: $spacing-xs;

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
        border: 1px solid $border-color;
        box-shadow: $shadow-sm;
      }

      .btn-secondary {
        background-color: $text-secondary;
        color: $text-light;

        &:hover {
          background-color: color.adjust($text-secondary, $lightness: -10%);
          transform: translateY(-1px);
        }
      }

      .btn-primary {
        background-color: $primary-color;
        color: $text-light;

        &:hover {
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

      .detail-grid {
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
export class PatientViewModalComponent {
  @Input() patient: Patient | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Patient>();

  closeModal(): void {
    this.close.emit();
  }

  editPatient(): void {
    if (this.patient) {
      this.edit.emit(this.patient);
    }
  }

  getStatusClass(patient: Patient): string {
    if (patient.deleted) return 'deleted';
    return 'active';
  }

  getStatusText(patient: Patient): string {
    if (patient.deleted) return 'Excluído';
    return 'Ativo';
  }

  getPhone(patient: Patient): string | null {
    // Se já tem phone mapeado, usar
    if (patient.phone) {
      return patient.phone;
    }
    
    // Caso contrário, tentar extrair do array Phones (aceita tanto Phones quanto phones)
    const phonesArray = (patient as any).Phones || (patient as any).phones || [];
    if (phonesArray && phonesArray.length > 0) {
      const phoneObj = phonesArray[0];
      
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
}

