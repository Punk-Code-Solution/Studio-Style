import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Service } from '../../../core/services/services.service';

interface ServiceFormData {
  service: string;
  additionalComments: string;
  price: number | null;
  // Campo em porcentagem para o formulário (0 - 100)
  commissionPercent: number | null;
  // Duração do serviço em minutos
  duration: number | null;
}

@Component({
  selector: 'app-service-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas" [class.fa-edit]="isEditMode" [class.fa-plus]="!isEditMode"></i>
            {{ isEditMode ? 'Editar Serviço' : 'Novo Serviço' }}
          </h3>
          <button class="close-btn" (click)="closeModal()" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form (ngSubmit)="onSubmit(serviceForm)" #serviceForm="ngForm" novalidate>
            <div class="form-group">
              <label for="service">
                <i class="fas fa-tag"></i>
                Nome do Serviço *
              </label>
              <input
                type="text"
                id="service"
                [(ngModel)]="serviceData.service"
                name="service"
                required
                minlength="3"
                placeholder="Digite o nome do serviço"
                #serviceField="ngModel"
              >
              <div class="error-message" *ngIf="serviceField.invalid && serviceField.touched">
                <span *ngIf="serviceField.errors?.['required']">Nome do serviço é obrigatório</span>
                <span *ngIf="serviceField.errors?.['minlength']">Nome deve ter pelo menos 3 caracteres</span>
              </div>
            </div>

            <div class="form-group">
              <label for="price">
                <i class="fas fa-dollar-sign"></i>
                Preço *
              </label>
              <input
                type="number"
                id="price"
                [(ngModel)]="serviceData.price"
                name="price"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                #priceField="ngModel"
              >
              <div class="error-message" *ngIf="priceField.invalid && priceField.touched">
                <span *ngIf="priceField.errors?.['required']">Preço é obrigatório</span>
                <span *ngIf="priceField.errors?.['min']">Preço deve ser maior que zero</span>
              </div>
            </div>

            <div class="form-group">
              <label for="commission">
                <i class="fas fa-percentage"></i>
                Comissão do Colaborador (%) *
              </label>
              <input
                type="number"
                id="commission"
                [(ngModel)]="serviceData.commissionPercent"
                name="commissionPercent"
                required
                min="0"
                max="100"
                step="0.01"
                placeholder="Ex: 50 para 50%"
                #commissionField="ngModel"
              >
              <div class="error-message" *ngIf="commissionField.invalid && commissionField.touched">
                <span *ngIf="commissionField.errors?.['required']">Comissão é obrigatória</span>
                <span *ngIf="commissionField.errors?.['min']">Comissão não pode ser negativa</span>
                <span *ngIf="commissionField.errors?.['max']">Comissão não pode ser maior que 100%</span>
              </div>
            </div>

            <div class="form-group">
              <label for="duration">
                <i class="fas fa-clock"></i>
                Duração (minutos) *
              </label>
              <input
                type="number"
                id="duration"
                [(ngModel)]="serviceData.duration"
                name="duration"
                required
                min="1"
                step="1"
                placeholder="Ex: 60 para 60 minutos"
                #durationField="ngModel"
              >
              <div class="error-message" *ngIf="durationField.invalid && durationField.touched">
                <span *ngIf="durationField.errors?.['required']">Duração é obrigatória</span>
                <span *ngIf="durationField.errors?.['min']">Duração deve ser pelo menos 1 minuto</span>
              </div>
              <small style="color: #666; font-size: 0.875rem; margin-top: 0.25rem; display: block;">
                Tempo estimado para realizar o serviço
              </small>
            </div>

            <div class="form-group">
              <label for="additionalComments">
                <i class="fas fa-comment"></i>
                Comentários Adicionais
              </label>
              <textarea
                id="additionalComments"
                [(ngModel)]="serviceData.additionalComments"
                name="additionalComments"
                rows="3"
                placeholder="Digite comentários adicionais sobre o serviço (opcional)"
              ></textarea>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeModal()">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button type="submit" class="btn-primary" [disabled]="loading" (click)="onSubmit(serviceForm)">
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

    input, textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    input:focus, textarea:focus {
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

      .modal-footer {
        flex-direction: column;
      }

      button {
        width: 100%;
      }
    }
  `]
})
export class ServiceFormModalComponent implements OnInit {
  @Input() service: Service | null = null;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Service>>();

  isEditMode = false;
  serviceData: ServiceFormData = {
    service: '',
    additionalComments: '',
    price: null,
    commissionPercent: null,
    duration: null
  };

  constructor() {}

  ngOnInit(): void {
    if (this.service) {
      this.isEditMode = true;
      this.serviceData = {
        service: this.service.service || '',
        additionalComments: this.service.additionalComments || '',
        price: this.service.price || null,
        commissionPercent: this.service.commission_rate != null ? this.service.commission_rate * 100 : null,
        duration: this.service.duration || 60
      };
    } else {
      // Valores padrão para novos serviços
      this.serviceData.commissionPercent = 50;
      this.serviceData.duration = 60;
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  onSubmit(form?: NgForm): void {
    if (!form || form.invalid) {
      return;
    }

    const commissionRate = (this.serviceData.commissionPercent ?? 0) / 100;

    const dataToSend: Partial<Service> = {
      service: this.serviceData.service,
      additionalComments: this.serviceData.additionalComments || undefined,
      price: this.serviceData.price || 0,
      commission_rate: commissionRate,
      duration: this.serviceData.duration || 60
    };

    this.save.emit(dataToSend);
  }
}

