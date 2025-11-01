import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Patient } from '../../../core/models/patient.model';
import { PatientService, CreatePatientRequest, TypeAccount, HairType } from '../../../core/services/patient.service';

@Component({
  selector: 'app-patient-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas" [class.fa-edit]="isEditMode" [class.fa-plus]="!isEditMode"></i>
            {{ isEditMode ? 'Editar Paciente' : 'Novo Paciente' }}
          </h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <form (ngSubmit)="onSubmit()" #patientForm="ngForm">
            <div class="form-row">
              <div class="form-group">
                <label for="name">
                  <i class="fas fa-user"></i>
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  [(ngModel)]="patientData.name"
                  name="name"
                  required
                  [class.error]="patientForm.submitted && !patientData.name"
                  placeholder="Digite o nome"
                >
                <div class="error-message" *ngIf="patientForm.submitted && !patientData.name">
                  Nome é obrigatório
                </div>
              </div>

              <div class="form-group">
                <label for="lastname">
                  <i class="fas fa-user"></i>
                  Sobrenome
                </label>
                <input
                  type="text"
                  id="lastname"
                  [(ngModel)]="patientData.lastname"
                  name="lastname"
                  required
                  [class.error]="patientForm.submitted && !patientData.lastname"
                  placeholder="Digite o sobrenome"
                >
                <div class="error-message" *ngIf="patientForm.submitted && !patientData.lastname">
                  Sobrenome é obrigatório
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">
                  <i class="fas fa-envelope"></i>
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  [(ngModel)]="patientData.email"
                  name="email"
                  required
                  email
                  [class.error]="patientForm.submitted && (!patientData.email || patientForm.controls['email'].invalid)"
                  placeholder="Digite o e-mail"
                >
                <div class="error-message" *ngIf="patientForm.submitted && patientForm.controls['email'].invalid">
                  E-mail inválido
                </div>
              </div>

              <div class="form-group">
                <label for="cpf">
                  <i class="fas fa-id-card"></i>
                  CPF
                </label>
                <input
                  type="text"
                  id="cpf"
                  [(ngModel)]="patientData.cpf"
                  name="cpf"
                  required
                  [class.error]="patientForm.submitted && !patientData.cpf"
                  placeholder="Digite o CPF"
                >
                <div class="error-message" *ngIf="patientForm.submitted && !patientData.cpf">
                  CPF é obrigatório
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="password">
                  <i class="fas fa-lock"></i>
                  Senha {{ isEditMode ? '(deixe em branco para não alterar)' : '' }}
                </label>
                <input
                  type="password"
                  id="password"
                  [(ngModel)]="patientData.password"
                  name="password"
                  [required]="!isEditMode"
                  [class.error]="patientForm.submitted && !isEditMode && !patientData.password"
                  placeholder="Digite a senha"
                >
                <div class="error-message" *ngIf="patientForm.submitted && !isEditMode && !patientData.password">
                  Senha é obrigatória
                </div>
              </div>

              <div class="form-group">
                <label for="birthday">
                  <i class="fas fa-birthday-cake"></i>
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  id="birthday"
                  [(ngModel)]="patientData.birthday"
                  name="birthday"
                  [max]="maxDate"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="typeaccount_id">
                  <i class="fas fa-user-tag"></i>
                  Tipo de Conta
                </label>
                <select
                  id="typeaccount_id"
                  [(ngModel)]="patientData.typeaccount_id"
                  name="typeaccount_id"
                  required
                  [class.error]="patientForm.submitted && !patientData.typeaccount_id"
                >
                  <option value="">Selecione um tipo de conta</option>
                  <option *ngFor="let typeAccount of typeAccounts" [value]="typeAccount.id">
                    {{ typeAccount.type }} {{ typeAccount.name ? '- ' + typeAccount.name : '' }}
                  </option>
                </select>
                <div class="error-message" *ngIf="patientForm.submitted && !patientData.typeaccount_id">
                  Tipo de conta é obrigatório
                </div>
              </div>

              <div class="form-group">
                <label for="type_hair_id">
                  <i class="fas fa-cut"></i>
                  Tipo de Cabelo
                </label>
                <select
                  id="type_hair_id"
                  [(ngModel)]="patientData.type_hair_id"
                  name="type_hair_id"
                >
                  <option value="">Selecione um tipo de cabelo</option>
                  <option *ngFor="let hairType of hairTypes" [value]="hairType.id">
                    {{ hairType.type }} {{ hairType.letter ? '- ' + hairType.letter : '' }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="avatar">
                <i class="fas fa-image"></i>
                URL do Avatar
              </label>
              <input
                type="text"
                id="avatar"
                [(ngModel)]="patientData.avatar"
                name="avatar"
                placeholder="URL da imagem do avatar"
              >
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="patientData.deleted"
                  name="deleted"
                >
                <span>Marcar como excluído</span>
              </label>
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

    .checkbox-label {
      @include flex(row, flex-start, center);
      gap: $spacing-xs;
      cursor: pointer;
      @include typography($font-size-base);

      input[type="checkbox"] {
        width: auto;
        margin: 0;
      }

      span {
        color: $text-primary;
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
export class PatientFormModalComponent implements OnInit {
  @Input() patient: Patient | null = null;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreatePatientRequest>();

  isEditMode = false;
  patientData: CreatePatientRequest = {
    name: '',
    lastname: '',
    email: '',
    password: '',
    cpf: '',
    birthday: '',
    deleted: false,
    avatar: '',
    typeaccount_id: '',
    company_id_account: '',
    type_hair_id: ''
  };

  typeAccounts: TypeAccount[] = [];
  hairTypes: HairType[] = [];
  maxDate = '';

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    // Definir data máxima (hoje) para data de nascimento
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];

    // Carregar tipos de conta e cabelo
    this.loadFormData();

    // Se estiver editando, preencher os dados
    if (this.patient) {
      this.isEditMode = true;
      this.patientData = {
        name: this.patient.name || '',
        lastname: this.patient.lastname || '',
        email: this.patient.email || '',
        password: '', // Não preencher senha ao editar
        cpf: this.patient.cpf || '',
        birthday: this.patient.birthday ? this.formatDateForInput(this.patient.birthday) : '',
        deleted: this.patient.deleted || false,
        avatar: this.patient.avatar || '',
        typeaccount_id: this.patient.typeaccount_id || '',
        company_id_account: this.patient.company_id_account || '',
        type_hair_id: this.patient.type_hair_id || ''
      };
    }
  }

  loadFormData(): void {
    // Carregar tipos de conta
    this.patientService.getAllTypeAccounts().subscribe({
      next: (typeAccounts) => {
        this.typeAccounts = typeAccounts;
      },
      error: (error) => {
        console.error('Erro ao carregar tipos de conta:', error);
        this.typeAccounts = [];
      }
    });

    // Carregar tipos de cabelo
    this.patientService.getAllHairTypes().subscribe({
      next: (hairTypes) => {
        this.hairTypes = hairTypes;
      },
      error: (error) => {
        console.error('Erro ao carregar tipos de cabelo:', error);
        this.hairTypes = [];
      }
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  onSubmit(): void {
    // Preparar dados para envio
    const dataToSend: CreatePatientRequest = { ...this.patientData };
    
    // Se estiver editando e não houver senha, remover do objeto
    if (this.isEditMode && !dataToSend.password) {
      delete (dataToSend as any).password;
    }

    // Se birthday estiver vazio, não enviar
    if (!dataToSend.birthday || dataToSend.birthday.trim() === '') {
      delete (dataToSend as any).birthday;
    }

    // Se type_hair_id estiver vazio, não enviar
    if (!dataToSend.type_hair_id || dataToSend.type_hair_id.trim() === '') {
      delete (dataToSend as any).type_hair_id;
    }

    // Se company_id_account estiver vazio, não enviar
    if (!dataToSend.company_id_account || dataToSend.company_id_account.trim() === '') {
      delete (dataToSend as any).company_id_account;
    }

    // Se avatar estiver vazio, não enviar
    if (!dataToSend.avatar || dataToSend.avatar.trim() === '') {
      delete (dataToSend as any).avatar;
    }

    this.save.emit(dataToSend);
  }

  private formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
}

