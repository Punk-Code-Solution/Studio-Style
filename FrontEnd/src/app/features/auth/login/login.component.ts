import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="logo">
          <img src="assets/logo.png" alt="ExperienceMed Logo">
        </div>

        <h1>Bem-vindo</h1>
        <p class="subtitle">Faça login para acessar o sistema</p>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
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

          <div class="form-group">
            <label for="password">Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              #passwordInput="ngModel"
              class="form-input"
              [class.error]="passwordInput.invalid && passwordInput.touched"
            >
            <div class="error" *ngIf="passwordInput.invalid && passwordInput.touched">
              <span *ngIf="passwordInput.errors?.['required']">Senha é obrigatória</span>
              <span *ngIf="passwordInput.errors?.['minlength']">Senha deve ter no mínimo 6 caracteres</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="login-btn" [disabled]="loginForm.invalid || isLoading">
              <i class="fas" [class.fa-spinner]="isLoading" [class.fa-sign-in-alt]="!isLoading"></i>
              {{ isLoading ? 'Entrando...' : 'Entrar' }}
            </button>
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
        </form>

        <div class="forgot-password">
          <a [routerLink]="['/reset-password']" class="forgot-link">
            <i class="fas fa-key"></i>
            Esqueci minha senha
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as vars;
    @use '../../../../styles/mixins' as mix;

    .login-container {
      min-height: 100vh;
      @include mix.flex(row, center, center);
      background: linear-gradient(135deg, vars.$primary-color 0%, vars.$primary-dark 100%);
      padding: vars.$spacing-md;
    }

    .login-card {
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

    .login-btn {
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

    .forgot-password {
      margin-top: vars.$spacing-lg;
      text-align: center;
      padding: vars.$spacing-md;
      border-top: 1px solid vars.$border-color;

      .forgot-link {
        display: inline-flex;
        align-items: center;
        gap: vars.$spacing-sm;
        color: vars.$primary-color;
        text-decoration: none;
        @include mix.typography(vars.$font-size-base);
        padding: vars.$spacing-sm vars.$spacing-md;
        border-radius: vars.$border-radius-sm;
        transition: all vars.$transition-fast;

        i {
          font-size: vars.$font-size-base;
        }

        &:hover {
          background-color: rgba(vars.$primary-color, 0.1);
          text-decoration: none;
        }
      }
    }

    @include mix.responsive(sm) {
      .login-card {
        padding: vars.$spacing-lg;
      }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Erro ao fazer login. Tente novamente.';
        this.isLoading = false;
      }
    });
  }
} 