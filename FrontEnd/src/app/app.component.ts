import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { Subscription, filter } from 'rxjs';

// Rotas públicas onde a sidebar não deve aparecer
const PUBLIC_ROUTES = ['/login', '/reset-password', '/unauthorized'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NotificationsComponent],
  template: `
    <div class="app-container">
      <app-sidebar *ngIf="shouldShowSidebar"></app-sidebar>
      <main class="main-content" [class.no-sidebar]="!shouldShowSidebar">
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
export class AppComponent implements OnInit, OnDestroy {
  shouldShowSidebar = false;
  private currentRoute = '';
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Atualiza o estado inicial
    this.updateSidebarVisibility();

    // Escuta mudanças no estado de autenticação
    const authSub = this.authService.authState$.subscribe(() => {
      this.updateSidebarVisibility();
    });
    this.subscriptions.add(authSub);

    // Escuta mudanças de rota para garantir que o estado seja atualizado
    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects || event.url;
        this.updateSidebarVisibility();
      });
    this.subscriptions.add(routerSub);

    // Atualiza a rota inicial
    this.currentRoute = this.router.url;
    this.updateSidebarVisibility();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private updateSidebarVisibility(): void {
    // Verifica se está em uma rota pública
    const isPublicRoute = PUBLIC_ROUTES.some(route => this.currentRoute.startsWith(route));
    
    // A sidebar só deve aparecer se:
    // 1. O usuário estiver autenticado
    // 2. E não estiver em uma rota pública
    this.shouldShowSidebar = this.authService.isAuthenticated() && !isPublicRoute;
  }
}
