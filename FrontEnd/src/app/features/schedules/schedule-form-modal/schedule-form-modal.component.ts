import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Schedule, CreateScheduleRequest, Service } from '../../../core/services/schedules.service';
import { User } from '../../../core/services/user.service';

@Component({
  selector: 'app-schedule-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas" [class.fa-edit]="isEditMode" [class.fa-plus]="!isEditMode"></i>
            {{ isEditMode ? 'Editar Agendamento' : 'Novo Agendamento' }}
          </h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form (ngSubmit)="onSubmit()" #scheduleForm="ngForm">
            <div class="form-group">
              <label for="name_client">
                <i class="fas fa-user"></i>
                Nome do Cliente
              </label>
              <input 
                type="text" 
                id="name_client" 
                [(ngModel)]="scheduleData.name_client"
                name="name_client"
                required
                [class.error]="scheduleForm.submitted && !scheduleData.name_client"
                placeholder="Digite o nome do cliente"
              >
              <div class="error-message" *ngIf="scheduleForm.submitted && !scheduleData.name_client">
                Nome do cliente é obrigatório
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="date_and_houres">
                  <i class="fas fa-calendar"></i>
                  Data e Hora
                </label>
                <input 
                  type="datetime-local" 
                  id="date_and_houres" 
                  [(ngModel)]="scheduleData.date_and_houres"
                  name="date_and_houres"
                  required
                  [class.error]="scheduleForm.submitted && !scheduleData.date_and_houres"
                >
                <div class="error-message" *ngIf="scheduleForm.submitted && !scheduleData.date_and_houres">
                  Data e hora são obrigatórios
                </div>
              </div>

              <div class="form-group">
                <label for="provider_id_schedules">
                  <i class="fas fa-user-md"></i>
                  Prestador
                </label>
                <select 
                  id="provider_id_schedules" 
                  [(ngModel)]="scheduleData.provider_id_schedules"
                  name="provider_id_schedules"
                  required
                  [class.error]="scheduleForm.submitted && !scheduleData.provider_id_schedules"
                >
                  <option value="">Selecione um prestador</option>
                  <option *ngFor="let provider of providers" [value]="provider.id">
                    {{ provider.name }} {{ provider.lastname }}
                  </option>
                </select>
                <div class="error-message" *ngIf="scheduleForm.submitted && !scheduleData.provider_id_schedules">
                  Prestador é obrigatório
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="client_id_schedules">
                  <i class="fas fa-user"></i>
                  Cliente
                </label>
                <div class="client-selection">
                  <div class="selection-mode">
                    <label class="radio-label">
                      <input 
                        type="radio" 
                        name="clientMode" 
                        value="select" 
                        [(ngModel)]="clientMode"
                        (change)="onClientModeChange()"
                      >
                      <span>Selecionar cliente existente</span>
                    </label>
                    <label class="radio-label">
                      <input 
                        type="radio" 
                        name="clientMode" 
                        value="manual" 
                        [(ngModel)]="clientMode"
                        (change)="onClientModeChange()"
                      >
                      <span>Inserir dados manualmente</span>
                    </label>
                  </div>

                  <!-- Seleção de cliente existente -->
                  <div *ngIf="clientMode === 'select'" class="client-select">
                    <select 
                      id="client_id_schedules" 
                      [(ngModel)]="scheduleData.client_id_schedules"
                      name="client_id_schedules"
                      required
                      [class.error]="scheduleForm.submitted && !scheduleData.client_id_schedules"
                      (change)="onClientSelect()"
                    >
                      <option value="">Selecione um cliente</option>
                      <option *ngFor="let client of clients" [value]="client.id">
                        {{ client.name }} {{ client.lastname }}
                      </option>
                    </select>
                    <div class="error-message" *ngIf="scheduleForm.submitted && !scheduleData.client_id_schedules">
                      Cliente é obrigatório
                    </div>
                  </div>

                  <!-- Inserção manual -->
                  <div *ngIf="clientMode === 'manual'" class="client-manual">
                    <input 
                      type="text" 
                      id="client_id_manual" 
                      [(ngModel)]="scheduleData.client_id_schedules"
                      name="client_id_manual"
                      required
                      [class.error]="scheduleForm.submitted && !scheduleData.client_id_schedules"
                      placeholder="ID do cliente"
                    >
                    <div class="error-message" *ngIf="scheduleForm.submitted && !scheduleData.client_id_schedules">
                      ID do cliente é obrigatório
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="status">
                  <i class="fas fa-info-circle"></i>
                  Status
                </label>
                <select 
                  id="status" 
                  [(ngModel)]="statusValue"
                  name="status"
                  (change)="updateStatus()"
                >
                  <option value="active">Ativo</option>
                  <option value="finished">Finalizado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="services">
                <i class="fas fa-cut"></i>
                Serviços
              </label>
              <div class="services-selection">
                <!-- Debug info -->
                <div *ngIf="availableServices.length === 0" style="padding: 10px; background: #f0f0f0; border-radius: 4px; margin-bottom: 10px;">
                  <small>Debug: Nenhum serviço disponível ({{ availableServices.length }} serviços carregados)</small>
                </div>
                
                <div class="service-option" *ngFor="let service of availableServices">
                  <label class="checkbox-label">
                    <input 
                      type="checkbox" 
                      [value]="service.id"
                      [checked]="isServiceSelected(service.id)"
                      (change)="toggleService(service.id)"
                    >
                    <span class="service-name">{{ service.service }}</span>
                    <span class="service-price" *ngIf="service.price">R$ {{ service.price | number:'1.2-2' }}</span>
                  </label>
                </div>
              </div>
              <div class="error-message" *ngIf="scheduleForm.submitted && selectedServices.length === 0">
                Pelo menos um serviço deve ser selecionado
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeModal()">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button type="button" class="btn-primary" (click)="onSubmit()" [disabled]="loading">
            <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
            <i class="fas" [class.fa-save]="isEditMode" [class.fa-plus]="!isEditMode" *ngIf="!loading"></i>
            {{ loading ? 'Salvando...' : (isEditMode ? 'Salvar' : 'Criar') }}
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
        color: $text-primary;
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

      textarea {
        resize: vertical;
        min-height: 100px;
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

    .client-selection {
      @include flex(column, flex-start, stretch);
      gap: $spacing-md;
    }

    .selection-mode {
      @include flex(row, flex-start, center);
      gap: $spacing-lg;
      padding: $spacing-sm;
      background-color: $background-light;
      border-radius: $border-radius-sm;
      border: 1px solid $border-color;
    }

    .radio-label {
      @include flex(row, flex-start, center);
      gap: $spacing-xs;
      cursor: pointer;
      @include typography($font-size-sm);

      input[type="radio"] {
        width: auto;
        margin: 0;
      }

      span {
        color: $text-primary;
      }
    }

    .client-select, .client-manual {
      @include flex(column, flex-start, stretch);
      gap: $spacing-xs;
    }

    .services-selection {
      @include flex(column, flex-start, stretch);
      gap: $spacing-sm;
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid $border-color;
      border-radius: $border-radius-sm;
      padding: $spacing-sm;
    }

    .service-option {
      .checkbox-label {
        @include flex(row, flex-start, center);
        gap: $spacing-sm;
        padding: $spacing-sm;
        border-radius: $border-radius-sm;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
          background-color: $background-light;
        }

        input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        .service-name {
          flex: 1;
          @include typography($font-size-base);
          color: $text-primary;
        }

        .service-price {
          @include typography($font-size-sm, $font-weight-medium);
          color: $success-color;
        }
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

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .btn-secondary {
        background-color: $text-secondary;
        color: $text-light;

        &:hover:not(:disabled) {
          background-color: darken($text-secondary, 10%);
        }
      }

      .btn-primary {
        background-color: $primary-color;
        color: $text-light;

        &:hover:not(:disabled) {
          background-color: $primary-dark;
        }
      }
    }

    @include responsive(md) {
      .modal-container {
        width: 95%;
        margin: $spacing-sm;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .selection-mode {
        flex-direction: column;
        align-items: flex-start;
        gap: $spacing-sm;
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
export class ScheduleFormModalComponent implements OnInit {
  @Input() schedule: Schedule | null = null;
  @Input() availableServices: Service[] = [];
  @Input() providers: User[] = [];
  @Input() clients: User[] = [];
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateScheduleRequest>();

  isEditMode = false;
  scheduleData: CreateScheduleRequest = {
    name_client: '',
    date_and_houres: '',
    active: true,
    finished: false,
    provider_id_schedules: '',
    client_id_schedules: '',
    services: []
  };
  selectedServices: string[] = [];
  statusValue = 'active';
  notes = '';
  clientMode: 'select' | 'manual' = 'select';
  selectedClient: User | null = null;

  ngOnInit(): void {
    
    if (this.schedule) {
      this.isEditMode = true;
      this.scheduleData = {
        name_client: this.schedule.name_client,
        date_and_houres: this.schedule.date_and_houres,
        active: this.schedule.active,
        finished: this.schedule.finished,
        provider_id_schedules: this.schedule.provider_id_schedules,
        client_id_schedules: this.schedule.client_id_schedules,
        services: this.schedule.Services?.map(s => s.id) || []
      };
      this.selectedServices = [...this.scheduleData.services];
      
      if (this.schedule.finished) {
        this.statusValue = 'finished';
      } else if (!this.schedule.active) {
        this.statusValue = 'cancelled';
      } else {
        this.statusValue = 'active';
      }
    }

  }

  closeModal(): void {
    this.close.emit();
  }

  onSubmit(): void {
    this.updateStatus();
    this.scheduleData.services = this.selectedServices;
    
    this.save.emit(this.scheduleData);
  }

  updateStatus(): void {
    switch (this.statusValue) {
      case 'active':
        this.scheduleData.active = true;
        this.scheduleData.finished = false;
        break;
      case 'finished':
        this.scheduleData.active = true;
        this.scheduleData.finished = true;
        break;
      case 'cancelled':
        this.scheduleData.active = false;
        this.scheduleData.finished = false;
        break;
    }
  }

  toggleService(serviceId: string): void {
    const index = this.selectedServices.indexOf(serviceId);
    if (index > -1) {
      this.selectedServices.splice(index, 1);
    } else {
      this.selectedServices.push(serviceId);
    }
  }

  isServiceSelected(serviceId: string): boolean {
    return this.selectedServices.includes(serviceId);
  }

  onClientModeChange(): void {
    // Limpa os dados quando muda o modo
    this.scheduleData.client_id_schedules = '';
    this.selectedClient = null;
    
    if (this.clientMode === 'manual') {
      this.scheduleData.name_client = '';
    }
  }

  onClientSelect(): void {
    if (this.scheduleData.client_id_schedules) {
      this.selectedClient = this.clients.find(c => c.id === this.scheduleData.client_id_schedules) || null;
      
      if (this.selectedClient) {
        // Preenche automaticamente o nome do cliente
        this.scheduleData.name_client = `${this.selectedClient.name} ${this.selectedClient.lastname}`;
      }
    } else {
      this.selectedClient = null;
      this.scheduleData.name_client = '';
    }
  }
}
