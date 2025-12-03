import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancialService, CompanySettings } from '../../../core/services/financial.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-financial-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="financial-settings">
      <div class="settings-header">
        <h2>
          <i class="fas fa-cog"></i>
          Configurações Financeiras
        </h2>
      </div>

      <div class="settings-content" *ngIf="settings">
        <form (ngSubmit)="onSubmit()" #settingsForm="ngForm">
          <!-- Regime Tributário -->
          <div class="form-group">
            <label for="tax_regime">
              <i class="fas fa-file-invoice-dollar"></i>
              Regime Tributário *
            </label>
            <select
              id="tax_regime"
              [(ngModel)]="settings.tax_regime"
              name="tax_regime"
              required
              class="form-control"
            >
              <option value="MEI">MEI (Microempreendedor Individual)</option>
              <option value="SIMPLES_NACIONAL">Simples Nacional</option>
              <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
              <option value="LUCRO_REAL">Lucro Real</option>
            </select>
          </div>

          <!-- Lei do Salão Parceiro -->
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="settings.is_partner_salon"
                name="is_partner_salon"
              >
              <span>
                <i class="fas fa-handshake"></i>
                Lei do Salão Parceiro
              </span>
            </label>
            <small class="help-text">
              Quando ativado, o imposto é calculado APENAS sobre a cota-parte do salão,
              isentando a parte do profissional da tributação do salão.
            </small>
          </div>

          <!-- Taxa de Imposto -->
          <div class="form-group">
            <label for="tax_rate">
              <i class="fas fa-percentage"></i>
              Taxa de Imposto (%) *
            </label>
            <input
              type="number"
              id="tax_rate"
              [(ngModel)]="taxRatePercent"
              name="tax_rate"
              required
              min="0"
              max="100"
              step="0.01"
              class="form-control"
              (blur)="updateTaxRate()"
            >
            <small class="help-text">Ex: 6.00 = 6%</small>
          </div>

          <!-- Taxa do Gateway -->
          <div class="form-group">
            <label for="payment_gateway_fee">
              <i class="fas fa-credit-card"></i>
              Taxa do Gateway de Pagamento (%) *
            </label>
            <input
              type="number"
              id="payment_gateway_fee"
              [(ngModel)]="gatewayFeePercent"
              name="payment_gateway_fee"
              required
              min="0"
              max="10"
              step="0.01"
              class="form-control"
              (blur)="updateGatewayFee()"
            >
            <small class="help-text">Ex: 2.99 = 2.99%</small>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="cancel()">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="loading || !settingsForm.valid">
              <i class="fas fa-spinner fa-spin" *ngIf="loading"></i>
              <i class="fas fa-save" *ngIf="!loading"></i>
              {{ loading ? 'Salvando...' : 'Salvar Configurações' }}
            </button>
          </div>
        </form>
      </div>

      <div class="loading" *ngIf="loading && !settings">
        <i class="fas fa-spinner fa-spin"></i>
        Carregando configurações...
      </div>
    </div>
  `,
  styles: [`
    .financial-settings {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .settings-header {
      margin-bottom: 2rem;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 1rem;

      h2 {
        margin: 0;
        color: #1976d2;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;

        &:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
        }
      }

      .help-text {
        display: block;
        margin-top: 0.25rem;
        color: #666;
        font-size: 0.875rem;
      }
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &.btn-primary {
        background-color: #1976d2;
        color: white;

        &:hover:not(:disabled) {
          background-color: #1565c0;
        }
      }

      &.btn-secondary {
        background-color: #666;
        color: white;

        &:hover:not(:disabled) {
          background-color: #555;
        }
      }
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }
  `]
})
export class FinancialSettingsComponent implements OnInit {
  settings: CompanySettings | null = null;
  loading = false;
  taxRatePercent = 0;
  gatewayFeePercent = 0;
  commissionRatePercent = 0;

  constructor(
    private financialService: FinancialService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    this.loading = true;
    try {
      const response = await this.financialService.getCompanySettings().toPromise();
      if (response?.success && response.data) {
        this.settings = response.data;
        this.taxRatePercent = (this.settings.tax_rate * 100);
        this.gatewayFeePercent = (this.settings.payment_gateway_fee * 100);
        this.commissionRatePercent = (this.settings.default_commission_rate * 100);
      }
    } catch (error: any) {
      this.notificationService.error('Erro ao carregar configurações: ' + (error.message || 'Erro desconhecido'));
    } finally {
      this.loading = false;
    }
  }

  updateTaxRate() {
    if (this.settings) {
      this.settings.tax_rate = this.taxRatePercent / 100;
    }
  }

  updateGatewayFee() {
    if (this.settings) {
      this.settings.payment_gateway_fee = this.gatewayFeePercent / 100;
    }
  }

  updateCommissionRate() {
    if (this.settings) {
      this.settings.default_commission_rate = this.commissionRatePercent / 100;
    }
  }

  async onSubmit() {
    if (!this.settings) return;

    this.loading = true;
    try {
      const response = await this.financialService.updateCompanySettings(
        this.settings
      ).toPromise();

      if (response?.success) {
        this.notificationService.success('Configurações salvas com sucesso!');
      }
    } catch (error: any) {
      this.notificationService.error('Erro ao salvar configurações: ' + (error.message || 'Erro desconhecido'));
    } finally {
      this.loading = false;
    }
  }

  cancel() {
    this.loadSettings();
  }
}

