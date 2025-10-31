import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Schedule } from '../../../core/services/schedules.service';

@Component({
  selector: 'app-schedule-view-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas fa-eye"></i>
            Detalhes do Agendamento
          </h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body" *ngIf="schedule">
          <div class="schedule-details">
            <div class="detail-section">
              <h4>Informações Básicas</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>
                    <i class="fas fa-user"></i>
                    Cliente
                  </label>
                  <span>{{ schedule.name_client }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-calendar"></i>
                    Data e Hora
                  </label>
                  <span>{{ schedule.date_and_houres | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-user-md"></i>
                    Prestador
                  </label>
                  <span>{{ schedule.provider?.name || 'N/A' }} {{ schedule.provider?.lastname || '' }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-info-circle"></i>
                    Status
                  </label>
                  <span class="status-badge" [class]="getStatusClass(schedule)">
                    {{ getStatusText(schedule) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section" *ngIf="schedule.Services && schedule.Services.length > 0">
              <h4>Serviços</h4>
              <div class="services-list">
                <div class="service-item" *ngFor="let service of schedule.Services">
                  <div class="service-info">
                    <i class="fas fa-cut"></i>
                    <span class="service-name">{{ service.service }}</span>
                  </div>
                  <div class="service-price" *ngIf="service.price">
                    R$ {{ service.price | number:'1.2-2' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section" *ngIf="schedule.client">
              <h4>Informações do Cliente</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>
                    <i class="fas fa-id-card"></i>
                    CPF
                  </label>
                  <span>{{ schedule.client.cpf }}</span>
                </div>

                <div class="detail-item" *ngIf="schedule.client.birthday">
                  <label>
                    <i class="fas fa-birthday-cake"></i>
                    Data de Nascimento
                  </label>
                  <span>{{ schedule.client.birthday | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>Informações do Sistema</h4>
              <div class="detail-grid">
                <div class="detail-item" *ngIf="schedule.createdAt">
                  <label>
                    <i class="fas fa-plus"></i>
                    Criado em
                  </label>
                  <span>{{ schedule.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>

                <div class="detail-item" *ngIf="schedule.updatedAt">
                  <label>
                    <i class="fas fa-edit"></i>
                    Atualizado em
                  </label>
                  <span>{{ schedule.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
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
          <button class="btn-primary" (click)="editSchedule()">
            <i class="fas fa-edit"></i>
            Editar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../../styles/variables';
    @import '../../../../styles/mixins';

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

    .schedule-details {
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

    .services-list {
      @include flex(column, flex-start, stretch);
      gap: $spacing-sm;
    }

    .service-item {
      @include flex(row, space-between, center);
      padding: $spacing-md;
      background-color: $background-light;
      border-radius: $border-radius-sm;
      border: 1px solid $border-color;

      .service-info {
        @include flex(row, flex-start, center);
        gap: $spacing-sm;

        i {
          color: $primary-color;
        }

        .service-name {
          @include typography($font-size-base, $font-weight-medium);
          color: $text-primary;
        }
      }

      .service-price {
        @include typography($font-size-base, $font-weight-medium);
        color: $success-color;
      }
    }

    .status-badge {
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      @include typography($font-size-sm, $font-weight-medium);

      &.active {
        background-color: rgba($info-color, 0.1);
        color: $info-color;
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
          background-color: darken($text-secondary, 10%);
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
export class ScheduleViewModalComponent {
  @Input() schedule: Schedule | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Schedule>();

  closeModal(): void {
    this.close.emit();
  }

  editSchedule(): void {
    if (this.schedule) {
      this.edit.emit(this.schedule);
    }
  }

  getStatusClass(schedule: Schedule): string {
    if (schedule.finished) return 'completed';
    if (!schedule.active) return 'cancelled';
    return 'active';
  }

  getStatusText(schedule: Schedule): string {
    if (schedule.finished) return 'Finalizado';
    if (!schedule.active) return 'Cancelado';
    return 'Ativo';
  }
}
