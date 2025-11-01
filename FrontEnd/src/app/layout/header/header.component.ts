import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <button class="menu-btn" (click)="toggleSidebar()">
          <i class="fas fa-bars"></i>
        </button>

        <div class="search">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Pesquisar...">
        </div>
      </div>

      <div class="header-right">
        <div class="notifications">
          <button class="icon-btn">
            <i class="fas fa-bell"></i>
            <span class="badge">3</span>
          </button>
        </div>

        <div class="messages">
          <button class="icon-btn">
            <i class="fas fa-envelope"></i>
            <span class="badge">5</span>
          </button>
        </div>

        <div class="user-menu" (click)="toggleUserMenu()">
          <img [src]="userAvatar" alt="User Avatar" class="avatar">
          <span class="user-name">{{ currentUser?.name }}</span>
          <i class="fas fa-chevron-down"></i>

          <div class="dropdown-menu" [class.show]="isUserMenuOpen">
            <a href="#" class="dropdown-item">
              <i class="fas fa-user"></i>
              Perfil
            </a>
            <a href="#" class="dropdown-item">
              <i class="fas fa-cog"></i>
              Configurações
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" (click)="logout()">
              <i class="fas fa-sign-out-alt"></i>
              Sair
            </a>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    @import '../../../styles/variables';
    @import '../../../styles/mixins';

    .header {
      height: 64px;
      padding: 0 $spacing-lg;
      @include flex(row, space-between, center);
      background-color: $background-light;
      border-bottom: 1px solid $border-color;
    }

    .header-left {
      @include flex(row, flex-start, center);
      gap: $spacing-md;
    }

    .menu-btn {
      @include button(transparent, $text-primary);
      padding: $spacing-sm;
      font-size: $font-size-lg;

      &:hover {
        background-color: $background-dark;
      }
    }

    .search {
      position: relative;
      width: 300px;

      i {
        position: absolute;
        left: $spacing-sm;
        top: 50%;
        transform: translateY(-50%);
        color: $text-secondary;
      }

      input {
        width: 100%;
        padding: $spacing-sm $spacing-sm $spacing-sm $spacing-xl;
        border: 1px solid $border-color;
        border-radius: $border-radius-lg;
        background-color: $background-dark;
        @include typography($font-size-base);

        &:focus {
          outline: none;
          border-color: $primary-color;
          background-color: $background-light;
        }
      }
    }

    .header-right {
      @include flex(row, flex-end, center);
      gap: $spacing-md;
    }

    .icon-btn {
      @include button(transparent, $text-primary);
      position: relative;
      padding: $spacing-sm;
      font-size: $font-size-lg;

      &:hover {
        background-color: $background-dark;
      }

      .badge {
        position: absolute;
        top: 0;
        right: 0;
        min-width: 18px;
        height: 18px;
        padding: 0 $spacing-xs;
        border-radius: $border-radius-full;
        background-color: $error-color;
        color: $text-light;
        @include typography($font-size-xs, $font-weight-bold);
        @include flex(row, center, center);
      }
    }

    .user-menu {
      position: relative;
      @include flex(row, flex-start, center);
      gap: $spacing-sm;
      padding: $spacing-xs;
      border-radius: $border-radius-md;
      cursor: pointer;

      &:hover {
        background-color: $background-dark;
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: $border-radius-full;
        object-fit: cover;
      }

      .user-name {
        @include typography($font-size-base, $font-weight-medium);
        color: $text-primary;
      }

      .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        width: 200px;
        margin-top: $spacing-xs;
        padding: $spacing-xs 0;
        background-color: $background-light;
        border: 1px solid $border-color;
        border-radius: $border-radius-md;
        box-shadow: $shadow-md;
        display: none;
        z-index: $z-index-dropdown;

        &.show {
          display: block;
        }
      }

      .dropdown-item {
        display: block;
        padding: $spacing-sm $spacing-md;
        color: $text-primary;
        text-decoration: none;
        @include typography($font-size-base);

        i {
          width: 20px;
          margin-right: $spacing-sm;
          color: $text-secondary;
        }

        &:hover {
          background-color: $background-dark;
        }
      }

      .dropdown-divider {
        height: 1px;
        margin: $spacing-xs 0;
        background-color: $border-color;
      }
    }

    @include responsive(lg) {
      .search {
        display: none;
      }
    }

    @include responsive(md) {
      .user-name {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  isUserMenuOpen = false;
  currentUser: User | null = null;
  userAvatar = 'assets/images/avatar.png';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUser;
  }

  toggleSidebar(): void {
    // Implement sidebar toggle logic
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
