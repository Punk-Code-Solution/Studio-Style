import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Service } from '../../../core/services/services.service';

@Component({
  selector: 'app-service-view-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas fa-eye"></i>
            Detalhes do Serviço
          </h3>
          <button class="close-btn" (click)="closeModal()" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body" *ngIf="service">
          <div class="service-details">
            <div class="detail-section">
              <div class="detail-item">
                <label>
                  <i class="fas fa-tag"></i>
                  Nome do Serviço
                </label>
                <span class="value">{{ service.service }}</span>
              </div>

              <div class="detail-item">
                <label>
                  <i class="fas fa-dollar-sign"></i>
                  Preço
                </label>
                <span class="value price">R$ {{ formatPrice(service.price) }}</span>
              </div>

              <div class="detail-item">
                <label>
                  <i class="fas fa-clock"></i>
                  Duração
                </label>
                <span class="value">{{ formatDuration(service.duration) }}</span>
              </div>

              <div class="detail-item" *ngIf="service.commission_rate !== undefined && service.commission_rate !== null">
                <label>
                  <i class="fas fa-percentage"></i>
                  Comissão do Colaborador
                </label>
                <span class="value">{{ formatCommission(service.commission_rate) }}</span>
              </div>

              <div class="detail-item">
                <label>
                  <i class="fas fa-clock"></i>
                  Limite por Hora
                </label>
                <span class="value">
                  <span class="badge" [class.badge-warning]="service.single_per_hour" [class.badge-info]="!service.single_per_hour">
                    {{ service.single_per_hour ? '1 agendamento por hora' : '3 agendamentos por hora' }}
                  </span>
                </span>
              </div>

              <div class="detail-item" *ngIf="service.additionalComments">
                <label>
                  <i class="fas fa-comment"></i>
                  Comentários Adicionais
                </label>
                <span class="value comments">{{ service.additionalComments }}</span>
              </div>

              <div class="detail-item" *ngIf="service.createdAt">
                <label>
                  <i class="fas fa-calendar-plus"></i>
                  Data de Criação
                </label>
                <span class="value">{{ formatDate(service.createdAt) }}</span>
              </div>

              <div class="detail-item" *ngIf="service.updatedAt && service.updatedAt !== service.createdAt">
                <label>
                  <i class="fas fa-calendar-edit"></i>
                  Última Atualização
                </label>
                <span class="value">{{ formatDate(service.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeModal()">
            <i class="fas fa-times"></i>
            Fechar
          </button>
          <button type="button" class="btn-primary" (click)="onEdit()" *ngIf="canEdit">
            <i class="fas fa-edit"></i>
            Editar
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

    .service-details {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .detail-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      background-color: #f9f9f9;
      border-radius: 4px;
      border-left: 3px solid #1976d2;
    }

    .detail-item label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-item label i {
      color: #1976d2;
      width: 16px;
    }

    .detail-item .value {
      color: #333;
      font-size: 1rem;
      font-weight: 400;
    }

    .detail-item .value.price {
      color: #2e7d32;
      font-weight: 600;
      font-size: 1.25rem;
    }

    .detail-item .value.comments {
      color: #555;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-warning {
      background-color: #ff9800;
      color: white;
    }

    .badge-info {
      background-color: #2196f3;
      color: white;
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

      .modal-footer {
        flex-direction: column;
      }

      button {
        width: 100%;
      }
    }
  `]
})
export class ServiceViewModalComponent {
  @Input() service: Service | null = null;
  @Input() canEdit = false;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Service>();

  closeModal(): void {
    this.close.emit();
  }

  onEdit(): void {
    if (this.service) {
      this.edit.emit(this.service);
    }
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',');
  }

  formatDuration(duration?: number): string {
    if (!duration) {
      return '60 minutos (padrão)';
    }
    if (duration < 60) {
      return `${duration} minuto${duration > 1 ? 's' : ''}`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (minutes === 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${minutes}min`;
  }

  formatCommission(rate?: number): string {
    if (rate === undefined || rate === null) {
      return 'Não definida';
    }
    return `${(rate * 100).toFixed(2)}%`;
  }

  formatDate(date: string): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

