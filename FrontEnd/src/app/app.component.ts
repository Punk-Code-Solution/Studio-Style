import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';
import { NotificationsComponent } from './shared/components/notifications/notifications.component';
import { Subscription, filter } from 'rxjs';
import { environment } from '../environments/environment';

// Rotas públicas onde a sidebar não deve aparecer
const PUBLIC_ROUTES = ['/login', '/reset-password', '/unauthorized'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, NotificationsComponent],
  // MODIFICADO (Ponto 10): Template agora é inline
  template: `
    <div class="app-container" [class.sidebar-collapsed]="isSidebarCollapsed">
      <app-sidebar 
        *ngIf="shouldShowSidebar"
        (onToggle)="toggleSidebar()"
      ></app-sidebar>
      
      <main class="main-content" [class.no-sidebar]="!shouldShowSidebar">
        <router-outlet></router-outlet>
      </main>
      <app-notifications></app-notifications>
    </div>
  `,
  // MODIFICADO (Ponto 10): Estilos movidos para app.component.scss (que já existia)
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  shouldShowSidebar = false;
  isSidebarCollapsed = false; // MODIFICADO (Ponto 10)
  private currentRoute = '';
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🔵 [APP] AppComponent inicializado');
    console.log('🔵 [APP] URL atual do router:', this.router.url);
    console.log('🔵 [APP] URL completa do navegador:', window.location.href);
    console.log('🔵 [APP] Pathname:', window.location.pathname);
    console.log('🔵 [APP] Base href:', document.querySelector('base')?.getAttribute('href'));
    
    // Atualiza o estado inicial
    this.updateSidebarVisibility();

    // Escuta mudanças no estado de autenticação
    const authSub = this.authService.authState$.subscribe(() => {
      console.log('🔵 [APP] Estado de autenticação mudou');
      this.updateSidebarVisibility();
    });
    this.subscriptions.add(authSub);

    // Escuta mudanças de rota para garantir que o estado seja atualizado
    const routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects || event.url;
        console.log('🔵 [APP] Navegação concluída:', {
          url: event.url,
          urlAfterRedirects: event.urlAfterRedirects,
          currentRoute: this.currentRoute
        });
        this.updateSidebarVisibility();
      });
    this.subscriptions.add(routerSub);

    // Log de erros de navegação (apenas em desenvolvimento)
    if (!environment.production) {
      this.router.events.subscribe(event => {
        if (event.type === 0) { // NavigationError
          console.error('❌ [APP] Erro de navegação:', event);
        }
      });
    }

    // Atualiza a rota inicial
    this.currentRoute = this.router.url;
    console.log('🔵 [APP] Rota inicial:', this.currentRoute);
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

  // MODIFICADO (Ponto 10): Método de toggle
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}