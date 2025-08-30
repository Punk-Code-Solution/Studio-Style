import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, UserRole } from '../../core/services/auth.service';
import { User } from '../../core/services/user.service';

// Constante centralizada para labels de roles
const ROLE_LABELS: Record<UserRole, string> = {
  'admin': 'Administrador',
  'medico': 'Médico',
  'enfermeiro': 'Enfermeiro',
  'recepcionista': 'Recepcionista',
  'administrativo': 'Administrativo'
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="logo">
        <img src="logo2.jpg">
      </div>

      <nav class="nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" *ngIf="canAccessRoute('/dashboard')">
          <i class="fas fa-chart-line"></i>
          <span>Dashboard</span>
        </a>

        <a routerLink="/consultations" routerLinkActive="active" class="nav-item" *ngIf="canAccessRoute('/consultations')">
          <i class="fas fa-calendar-check"></i>
          <span>Consultas</span>
        </a>

        <a routerLink="/patients" routerLinkActive="active" class="nav-item" *ngIf="canAccessRoute('/patients')">
          <i class="fas fa-users"></i>
          <span>Pacientes</span>
        </a>

        <a routerLink="/calendar" routerLinkActive="active" class="nav-item" *ngIf="canAccessRoute('/calendar')">
          <i class="fas fa-calendar-alt"></i>
          <span>Calendário</span>
        </a>

        <a routerLink="/messages" routerLinkActive="active" class="nav-item" *ngIf="canAccessRoute('/messages')">
          <i class="fas fa-comments"></i>
          <span>Mensagens</span>
        </a>

        <a routerLink="/documents" routerLinkActive="active" class="nav-item" *ngIf="canAccessRoute('/documents')">
          <i class="fas fa-file-alt"></i>
          <span>Documentos</span>
        </a>

        <a routerLink="/employees" routerLinkActive="active" class="nav-item" *ngIf="canAccessRoute('/employees')">
          <i class="fas fa-user-md"></i>
          <span>Funcionários</span>
        </a>

        <a routerLink="/feedbacks" routerLinkActive="active" class="nav-item" *ngIf="canAccessRoute('/feedbacks')">
          <i class="fas fa-star"></i>
          <span>Feedbacks</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <img [src]="userAvatar" alt="User Avatar" class="avatar">
          <div class="user-details">
            <span class="user-name">{{ currentUser?.nome }}</span>
            <span class="user-role">{{ userRole }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()">
          <i class="fas fa-sign-out-alt"></i>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .sidebar {
      height: 100%;
      @include flex(column, space-between, stretch);
      background-color: $background-light;
      border-right: 1px solid $border-color;
    }

    .logo {
      padding: $spacing-lg;
      text-align: center;
      border-bottom: 1px solid $border-color;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: $background-light;

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        object-position: center;
      }
    }

    .nav {
      flex: 5;
      padding: $spacing-md 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: $spacing-md $spacing-lg;
      color: $text-secondary;
      text-decoration: none;
      transition: all $transition-fast;

      i {
        width: 20px;
        margin-right: $spacing-md;
        font-size: $font-size-lg;
      }

      span {
        @include typography($font-size-base, $font-weight-medium);
      }

      &:hover {
        color: $primary-color;
        background-color: rgba($primary-color, 0.05);
      }

      &.active {
        color: $primary-color;
        background-color: rgba($primary-color, 0.1);
        border-right: 3px solid $primary-color;
      }
    }

    .sidebar-footer {
      padding: $spacing-md;
      border-top: 1px solid $border-color;
    }

    .user-info {
      @include flex(row, flex-start, center);
      gap: $spacing-sm;
      padding: $spacing-sm;
      border-radius: $border-radius-md;
      transition: background-color $transition-fast;
      margin-bottom: $spacing-sm;

      &:hover {
        background-color: $background-dark;
      }
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: $border-radius-full;
      object-fit: cover;
    }

    .user-details {
      @include flex(column, center, flex-start);
    }

    .user-name {
      @include typography($font-size-base, $font-weight-medium);
      color: $text-primary;
    }

    .user-role {
      @include typography($font-size-sm);
      color: $text-secondary;
      text-transform: capitalize;
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      padding: $spacing-sm $spacing-md;
      border: none;
      border-radius: $border-radius-md;
      background-color: transparent;
      color: $error-color;
      cursor: pointer;
      transition: all $transition-fast;

      i {
        font-size: $font-size-lg;
      }

      span {
        @include typography($font-size-base, $font-weight-medium);
      }

      &:hover {
        background-color: rgba($error-color, 0.1);
      }
    }

    @include responsive(lg) {
      .sidebar {
        position: fixed;
        left: -280px;
        top: 0;
        bottom: 0;
        width: 280px;
        transition: left $transition-normal;
        z-index: $z-index-fixed;

        &.open {
          left: 0;
        }
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  currentUser: User | null = null;
  userAvatar = 'assets/images/avatar.png';

  get userRole(): string {
    return this.currentUser?.perfil ? ROLE_LABELS[this.currentUser.perfil] : '';
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    // Inscrever-se para mudanças no estado de autenticação
    this.authService.authState$.subscribe(state => {
      this.currentUser = state.user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  canAccessRoute(route: string): boolean {
    // Remove a verificação de autenticação pois já é feita pelo AuthGuard
    return this.authService.canAccessRoute(route);
  }

  isActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'exact',
      queryParams: 'exact',
      fragment: 'ignored',
      matrixParams: 'ignored'
    });
  }
}
