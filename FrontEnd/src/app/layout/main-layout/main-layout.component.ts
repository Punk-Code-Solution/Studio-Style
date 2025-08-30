import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="layout">
      <app-sidebar class="sidebar"></app-sidebar>
      
      <div class="main">
        <app-header class="header"></app-header>
        
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../styles/variables';
    @import '../../../styles/mixins';

    .layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      grid-template-rows: auto 1fr;
      grid-template-areas:
        "sidebar header"
        "sidebar content";
      height: 100vh;
      background-color: $background-light;
    }

    .sidebar {
      grid-area: sidebar;
      border-right: 1px solid $border-color;
      background-color: $background-light;
      z-index: $z-index-fixed;
    }

    .main {
      grid-area: main;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header {
      grid-area: header;
      background-color: $background-light;
      border-bottom: 1px solid $border-color;
      z-index: $z-index-sticky;
    }

    .content {
      grid-area: content;
      padding: $spacing-lg;
      overflow-y: auto;
      background-color: $background-light;
    }

    @include responsive(lg) {
      .layout {
        grid-template-columns: 1fr;
        grid-template-areas:
          "header"
          "content";
      }

      .sidebar {
        position: fixed;
        left: -280px;
        top: 0;
        bottom: 0;
        transition: left $transition-normal;

        &.open {
          left: 0;
        }
      }
    }
  `]
})
export class MainLayoutComponent {
  constructor(private authService: AuthService) {}
} 