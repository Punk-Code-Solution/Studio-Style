import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-view-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="closeModal()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>
            <i class="fas fa-eye"></i>
            Detalhes do Funcionário
          </h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body" *ngIf="employee">
          <div class="employee-details">
            <div class="detail-section">
              <h4>Informações Básicas</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>
                    <i class="fas fa-user"></i>
                    Nome
                  </label>
                  <span>{{ employee.name }} {{ employee.lastname }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-envelope"></i>
                    E-mail
                  </label>
                  <span>{{ employee.email || 'N/A' }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-phone"></i>
                    Telefone
                  </label>
                  <span>{{ getPhone(employee) || 'N/A' }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-id-card"></i>
                    CPF
                  </label>
                  <span>{{ employee.cpf || 'N/A' }}</span>
                </div>

                <div class="detail-item" *ngIf="employee.birthday">
                  <label>
                    <i class="fas fa-birthday-cake"></i>
                    Data de Nascimento
                  </label>
                  <span>{{ employee.birthday | date:'dd/MM/yyyy' }}</span>
                </div>

                <div class="detail-item" *ngIf="employee.start_date">
                  <label>
                    <i class="fas fa-calendar-alt"></i>
                    Data de Início
                  </label>
                  <span>{{ employee.start_date | date:'dd/MM/yyyy' }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>Cargo e Status</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>
                    <i class="fas fa-briefcase"></i>
                    Cargo
                  </label>
                  <span>{{ getRoleLabel(employee.TypeAccount.type) }}</span>
                </div>

                <div class="detail-item">
                  <label>
                    <i class="fas fa-info-circle"></i>
                    Status
                  </label>
                  <span class="status-badge" [class]="getStatusClass(employee)">
                    {{ getStatusText(employee) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section" *ngIf="hasAddress(employee)">
              <h4>Endereço</h4>
              <div class="detail-grid">
                <div class="detail-item" style="grid-column: 1 / -1;">
                  <label>
                    <i class="fas fa-map-marker-alt"></i>
                    Endereço
                  </label>
                  <span>{{ getFormattedAddress(employee.address || employee.Adress) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>Informações do Sistema</h4>
              <div class="detail-grid">
                <div class="detail-item" *ngIf="employee.createdAt">
                  <label>
                    <i class="fas fa-plus"></i>
                    Criado em
                  </label>
                  <span>{{ employee.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>

                <div class="detail-item" *ngIf="employee.updatedAt">
                  <label>
                    <i class="fas fa-edit"></i>
                    Atualizado em
                  </label>
                  <span>{{ employee.updatedAt | date:'dd/MM/yyyy HH:mm' }}</span>
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
          <button class="btn-primary" (click)="editEmployee()">
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

    .employee-details {
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

      &.inactive {
        background-color: rgba($error-color, 0.1);
        color: $error-color;
      }

      &.on-leave {
        background-color: rgba(#ff9800, 0.1);
        color: #ff9800;
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
export class EmployeeViewModalComponent {
  @Input() employee: Employee | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Employee>();

  closeModal(): void {
    this.close.emit();
  }

  editEmployee(): void {
    if (this.employee) {
      this.edit.emit(this.employee);
    }
  }

  getStatusClass(employee: Employee): string {
    const status = employee.status || (employee.deleted ? 'inactive' : 'active');
    if (status === 'on_leave') return 'on-leave';
    if (status === 'inactive') return 'inactive';
    return 'active';
  }

  getStatusText(employee: Employee): string {
    const status = employee.status || (employee.deleted ? 'inactive' : 'active');
    if (status === 'inactive') return 'Inativo';
    if (status === 'on_leave') return 'Em licença';
    return 'Ativo';
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

  getPhone(employee: Employee): string | null {
    // Se já tem phone mapeado, usar
    if (employee.phone) {
      return employee.phone;
    }
    
    // Caso contrário, tentar extrair do array Phones (aceita tanto Phones quanto phones)
    const phonesArray = (employee as any).Phones || (employee as any).phones || [];
    if (phonesArray && phonesArray.length > 0) {
      const phoneObj = phonesArray[0];
      
      // Se phoneObj já é uma string, usar diretamente
      if (typeof phoneObj === 'string') {
        return phoneObj;
      }
      
      // Se phoneObj é um objeto (Phones é any[], então usamos type assertion)
      if (phoneObj && typeof phoneObj === 'object') {
        const phoneNumber = (phoneObj as any).phone;
        const ddd = (phoneObj as any).ddd;
        
        if (ddd && phoneNumber) {
          return `(${ddd}) ${phoneNumber}`;
        } else if (phoneNumber) {
          return String(phoneNumber);
        }
      }
    }
    
    return null;
  }

  hasAddress(employee: Employee): boolean {
    // Verificar se tem address mapeado
    if (employee.address) {
      if (typeof employee.address === 'string' && employee.address.trim()) {
        return true;
      }
      if (typeof employee.address === 'object' && !Array.isArray(employee.address)) {
        const addr = employee.address as any;
        return !!(addr.road || addr.neighborhood || addr.city);
      }
    }
    
    // Verificar se tem Adress original
    if (employee.Adress) {
      if (typeof employee.Adress === 'object' && !Array.isArray(employee.Adress)) {
        const addr = employee.Adress as any;
        return !!(addr.road || addr.neighborhood || addr.city);
      }
    }
    
    return false;
  }

  getFormattedAddress(address: any): string {
    // Se address é null ou undefined
    if (!address) {
      return 'N/A';
    }
    
    // Se address é uma string, retornar diretamente
    if (typeof address === 'string') {
      return address.trim() || 'N/A';
    }
    
    // Se address é um array, pegar o primeiro elemento
    if (Array.isArray(address)) {
      if (address.length === 0) {
        return 'N/A';
      }
      address = address[0];
    }
    
    // Se address é um objeto, formatar as propriedades
    if (address && typeof address === 'object') {
      const parts: string[] = [];
      
      // Adicionar rua/road
      if (address.road && address.road.trim()) {
        parts.push(address.road.trim());
      }
      
      // Adicionar bairro/neighborhood
      if (address.neighborhood && address.neighborhood.trim()) {
        parts.push(address.neighborhood.trim());
      }
      
      // Adicionar cidade/city
      if (address.city && address.city.trim()) {
        parts.push(address.city.trim());
      }
      
      // Se tem CEP
      if (address.cep) {
        parts.push(`CEP: ${address.cep}`);
      }
      
      // Retornar endereço formatado ou 'N/A' se vazio
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    
    return 'N/A';
  }
}
