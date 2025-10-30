import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NotificationsComponent],
  template: `
    <div class="app-container">
      <app-sidebar *ngIf="authService.isAuthenticated()"></app-sidebar>
      <main class="main-content" [class.no-sidebar]="!authService.isAuthenticated()">
        <router-outlet></router-outlet>
      </main>
      <app-notifications></app-notifications>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
      background-color: #f5f6fa;
    }

    .main-content {
      flex: 1;
      padding: 0;
      overflow-y: auto;
    }

    .main-content.no-sidebar {
      margin-left: 0;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class AppComponent {
  constructor(public authService: AuthService) {}
}
