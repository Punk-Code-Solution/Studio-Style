import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Verifica se o usuário está autenticado
    if (!this.authService.isAuthenticated()) {
      console.warn('RoleGuard: Usuário não autenticado');
      this.router.navigate(['/login'], { 
        replaceUrl: true,
        queryParams: { returnUrl: this.getFullPath(route) }
      });
      return false;
    }

    // Obtém o caminho completo da rota
    const fullPath = this.getFullPath(route);
    console.log('RoleGuard: Verificando acesso à rota:', fullPath);
    
    // Se for a rota raiz ou dashboard, permite acesso
    if (!fullPath || fullPath === 'dashboard') {
      console.log('RoleGuard: Acesso permitido à rota raiz/dashboard');
      return true;
    }

    // Verifica se a rota tem parâmetros
    const hasParams = Object.keys(route.params).length > 0;
    const baseRoute = this.getBaseRoute(fullPath);

    // Verifica permissão para a rota base
    if (!this.authService.canAccessRoute(baseRoute)) {
      console.warn(`RoleGuard: Acesso negado à rota base: ${baseRoute}`);
      this.redirectToUnauthorized('Você não tem permissão para acessar esta seção');
      return false;
    }

    // Se a rota tem parâmetros, verifica permissões específicas
    if (hasParams) {
      const paramRoute = this.getParamRoute(fullPath);
      if (!this.authService.canAccessRoute(paramRoute)) {
        console.warn(`RoleGuard: Acesso negado à rota com parâmetros: ${paramRoute}`);
        this.redirectToUnauthorized('Você não tem permissão para acessar este item específico');
        return false;
      }
    }

    console.log('RoleGuard: Acesso permitido à rota:', fullPath);
    return true;
  }

  private getFullPath(route: ActivatedRouteSnapshot): string {
    const segments: string[] = [];
    let currentRoute: ActivatedRouteSnapshot | null = route;

    while (currentRoute) {
      if (currentRoute.url.length > 0) {
        segments.unshift(currentRoute.url[0].path);
      }
      currentRoute = currentRoute.parent;
    }

    return segments.join('/');
  }

  private getBaseRoute(path: string): string {
    const segments = path.split('/');
    return segments[0];
  }

  private getParamRoute(path: string): string {
    const segments = path.split('/');
    if (segments.length <= 1) return path;

    // Substitui IDs por :id para corresponder às permissões
    return segments.map(segment => {
      // Verifica se o segmento é um número ou UUID
      return /^[0-9a-f-]+$/i.test(segment) ? ':id' : segment;
    }).join('/');
  }

  private redirectToUnauthorized(message: string): void {
    this.router.navigate(['/unauthorized'], { 
      replaceUrl: true,
      queryParams: { message }
    });
  }
} 