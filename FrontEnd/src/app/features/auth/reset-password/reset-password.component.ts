import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reset-container">
      <div class="reset-card">
        <div class="logo">
          <img src="assets/logo.png" alt="ExperienceMed Logo">
        </div>

        <h1>Redefinir Senha</h1>
        <p class="subtitle">Digite seu e-mail para receber as instruções</p>

        <form (ngSubmit)="onSubmit()" #resetForm="ngForm">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              email
              #emailInput="ngModel"
              class="form-input"
              [class.error]="emailInput.invalid && emailInput.touched"
            >
            <div class="error" *ngIf="emailInput.invalid && emailInput.touched">
              <span *ngIf="emailInput.errors?.['required']">E-mail é obrigatório</span>
              <span *ngIf="emailInput.errors?.['email']">E-mail inválido</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="reset-btn" [disabled]="resetForm.invalid || isLoading">
              <i class="fas" [class.fa-spinner]="isLoading" [class.fa-paper-plane]="!isLoading"></i>
              {{ isLoading ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <div class="success-message" *ngIf="successMessage">
            {{ successMessage }}
          </div>

          <div class="back-to-login">
            <a routerLink="/login">Voltar para o login</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as vars;
    @use '../../../../styles/mixins' as mix;

    .reset-container {
      min-height: 100vh;
      @include mix.flex(row, center, center);
      background: linear-gradient(135deg, vars.$primary-color 0%, vars.$primary-dark 100%);
      padding: vars.$spacing-md;
    }

    .reset-card {
      width: 100%;
      max-width: 400px;
      padding: vars.$spacing-xl;
      background: vars.$background-light;
      border-radius: vars.$border-radius-lg;
      box-shadow: vars.$shadow-lg;
      @include mix.glass-effect;

      .logo {
        text-align: center;
        margin-bottom: vars.$spacing-xl;

        img {
          max-width: 200px;
          height: auto;
        }
      }

      h1 {
        color: vars.$text-primary;
        @include mix.typography(vars.$font-size-xxl, vars.$font-weight-bold);
        text-align: center;
        margin-bottom: vars.$spacing-xs;
      }

      .subtitle {
        color: vars.$text-secondary;
        @include mix.typography(vars.$font-size-base);
        text-align: center;
        margin-bottom: vars.$spacing-xl;
      }
    }

    .form-group {
      margin-bottom: vars.$spacing-lg;

      label {
        display: block;
        margin-bottom: vars.$spacing-xs;
        color: vars.$text-primary;
        @include mix.typography(vars.$font-size-base, vars.$font-weight-medium);
      }
    }

    .form-input {
      @include mix.form-element;

      &.error {
        border-color: vars.$error-color;
      }
    }

    .error {
      color: vars.$error-color;
      @include mix.typography(vars.$font-size-small);
      margin-top: vars.$spacing-xs;
    }

    .form-actions {
      margin-top: vars.$spacing-xl;
    }

    .reset-btn {
      @include mix.button;
      width: 100%;
      padding: vars.$spacing-md;
      font-size: vars.$font-size-large;

      i {
        font-size: vars.$font-size-base;
        margin-right: vars.$spacing-sm;
      }

      &.fa-spinner {
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .error-message {
      margin-top: vars.$spacing-lg;
      padding: vars.$spacing-md;
      background-color: rgba(vars.$error-color, 0.1);
      border: 1px solid vars.$error-color;
      border-radius: vars.$border-radius-sm;
      color: vars.$error-color;
      @include mix.typography(vars.$font-size-base);
      text-align: center;
    }

    .success-message {
      margin-top: vars.$spacing-lg;
      padding: vars.$spacing-md;
      background-color: rgba(vars.$success-color, 0.1);
      border: 1px solid vars.$success-color;
      border-radius: vars.$border-radius-sm;
      color: vars.$success-color;
      @include mix.typography(vars.$font-size-base);
      text-align: center;
    }

    .back-to-login {
      margin-top: vars.$spacing-lg;
      text-align: center;

      a {
        color: vars.$primary-color;
        text-decoration: none;
        @include mix.typography(vars.$font-size-base);

        &:hover {
          text-decoration: underline;
        }
      }
    }

    @include mix.responsive(sm) {
      .reset-card {
        padding: vars.$spacing-lg;
      }
    }
  `]
})
export class ResetPasswordComponent {
  email = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulando o envio do e-mail de reset
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    }, 1500);
  }
} 