import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HairType } from '../../../core/services/hair-type.service';

@Component({
  selector: 'app-hair-type-delete-modal',
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
            <h4>Tem certeza que deseja excluir este tipo de cabelo?</h4>
            <p>Esta ação não pode ser desfeita.</p>
          </div>

          <div class="hair-type-info" *ngIf="hairType">
            <div class="info-card">
              <div class="info-item">
                <label>
                  <i class="fas fa-tag"></i>
                  Tipo
                </label>
                <span>{{ hairType.type }}</span>
              </div>

              <div class="info-item" *ngIf="hairType.level">
                <label>
                  <i class="fas fa-sort-numeric-up"></i>
                  Nível
                </label>
                <span>{{ hairType.level }}</span>
              </div>

              <div class="info-item" *ngIf="hairType.letter">
                <label>
                  <i class="fas fa-font"></i>
                  Letra
                </label>
                <span>{{ hairType.letter }}</span>
              </div>
            </div>
          </div>

          <div class="warning-text">
            <i class="fas fa-info-circle"></i>
            <span>Esta ação removerá permanentemente o tipo de cabelo e todos os dados associados.</span>
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
      max-width: 500px;
      width: 90%;
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
      text-align: center;
      max-height: 70vh;
      overflow-y: auto;
    }

    .warning-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;
    }

    .warning-icon i {
      font-size: 3rem;
      color: #1976d2;
    }

    .confirmation-message {
      margin-bottom: 2rem;
    }

    .confirmation-message h4 {
      color: #333;
      font-size: 1.125rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .confirmation-message p {
      color: #666;
      font-size: 1rem;
      margin: 0;
    }

    .hair-type-info {
      margin-bottom: 2rem;
    }

    .info-card {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: left;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }

    .info-item:last-child {
      margin-bottom: 0;
    }

    .info-item label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .info-item label i {
      color: #1976d2;
      width: 16px;
    }

    .info-item span {
      color: #333;
      font-size: 1rem;
    }

    .warning-text {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 1rem;
      background-color: rgba(33, 150, 243, 0.1);
      border: 1px solid rgba(33, 150, 243, 0.3);
      border-radius: 4px;
      color: #1976d2;
      font-size: 0.875rem;
    }

    .warning-text i {
      color: #1976d2;
      flex-shrink: 0;
      margin-top: 0.125rem;
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
export class HairTypeDeleteModalComponent {
  @Input() hairType: HairType | null = null;
  @Input() loading = false;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  closeModal(): void {
    this.close.emit();
  }

  confirmDelete(): void {
    this.confirm.emit();
  }
}

