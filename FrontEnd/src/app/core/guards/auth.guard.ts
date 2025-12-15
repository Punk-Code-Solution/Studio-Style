import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const isAuthenticated = this.authService.isAuthenticated();
    const currentUrl = this.router.url;
    
    console.log('🛡️ [AUTH_GUARD] Verificando acesso:', {
      url: currentUrl,
      isAuthenticated,
      timestamp: new Date().toISOString()
    });
    
    if (isAuthenticated) {
      console.log('✅ [AUTH_GUARD] Acesso permitido para:', currentUrl);
      return true;
    } else {
      console.log('❌ [AUTH_GUARD] Acesso negado. Redirecionando para /login');
      this.router.navigate(['/login']);
      return false;
    }
  }
} 