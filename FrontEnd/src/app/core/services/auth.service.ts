import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap, map } from 'rxjs/operators';
import { User, UserService } from './user.service';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

// Tipos centralizados
export type UserRole =  | 'admin' | 'ninguem' | 'provider' | 'client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface Permissions {
  routes: Record<string, UserRole[]>;
  fields: Record<string, UserRole[]>;
  actions: Record<string, UserRole[]>;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Estado de autenticação centralizado
  private authState = new BehaviorSubject<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  // Observable público do estado
  authState$ = this.authState.asObservable();

  // Constantes
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'current_user';
  private readonly isBrowser: boolean;

  // Cache de permissões para melhor performance
  private permissionCache = new Map<string, boolean>();

  // Única fonte de verdade para todas as permissões
  private readonly permissions: Permissions = {
    routes: {
      // Rotas principais
      dashboard: ['admin'],
      patients: ['admin'],
      calendar: ['ninguem'],
      messages: ['ninguem'],
      documents: ['ninguem'],
      employees: ['ninguem'],
      feedbacks: ['ninguem'],
      services: ['admin'],

      // Sub-rotas de pacientes
      'patients/new': ['admin'],
      'patients/:id': ['admin'],
      'patients/:id/edit': ['admin'],

      // Sub-rotas de consultas
      'services/new': ['admin'],
      'services/:id': ['admin'],

      // Sub-rotas de funcionários
      'employees/new': ['ninguem'],
      'employees/:id': ['ninguem'],
    },
    fields: {
      'patient.medicalRecord': ['ninguem'],
      'patient.prescriptions': ['ninguem'],
      'patient.appointments': ['ninguem'],
      'patient.billing': ['ninguem'],
      'patient.personal': ['ninguem'],
      'patient.contact': ['ninguem'],
    },
    actions: {
      'edit.all': ['ninguem'],
      'edit.email': ['ninguem'],
      'edit.phone': ['ninguem'],
      'edit.appointments': ['ninguem'],
      'edit.medicalRecord': ['ninguem'],
      'view.fullPatientDetails': ['ninguem'],
      'edit.patientData': ['ninguem'],
    },
  };

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private userService: UserService,
    private http: HttpClient,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.loadStoredUser();
  }

  // Getters públicos
  get currentUser() {
    return this.authState.value.user;
  }

  get currentUser$(): Observable<User | null> {
    return this.authState$.pipe(
      map((state) => state.user),
      tap((user) => console.log('Estado do usuário atualizado:', user))
    );
  }

  // Métodos de autenticação
  login(
    email: string,
    senha: string
  ): Observable<{ token: string; user: User }> {
    const url = `${environment.apiUrl}/auth/login`;
    return this.http.post<any>(url, { email, password: senha }).pipe(
      map((res) => {
        // Suporta formatos { token, user } ou envelope { data: { token, user } }
        const payload = res?.data ?? res;
        const token = payload?.token as string;
        const user = payload?.user as User;

        console.log('Resposta de login recebida:', payload);

        if (!token || !user) {
          throw new Error('Resposta de login inválida');
        }

        if (this.isJwtExpired(token)) {
          throw new Error('Token expirado');
        }

        this.setToken(token);
        this.setCurrentUser(user);
        this.clearPermissionCache();
        return { token, user };
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.clearPermissionCache(); // Limpa cache ao fazer logout
    this.authState.next({
      user: null,
      isAuthenticated: false,
    });
  }

  // Verificações de permissão
  canAccessRoute(route: string): boolean {
    return this.checkPermission('routes', route);
  }

  canAccessField(field: string): boolean {
    return this.checkPermission('fields', field);
  }

  canPerformAction(action: string): boolean {
    return this.checkPermission('actions', action);
  }

  // Métodos de conveniência
  canViewFullPatientDetails(): boolean {
    return this.canPerformAction('view.fullPatientDetails');
  }

  canEditPatientData(): boolean {
    return this.canPerformAction('edit.patientData');
  }

  canEditField(field: string): boolean {
    return this.canPerformAction(`edit.${field}`);
  }

  canAccessPatientData(field: string): boolean {
    return this.canAccessField(`patient.${field}`);
  }

  // Verificações de role
  hasRole(role: UserRole): boolean {
    return this.currentUser?.TypeAccount.type === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return this.currentUser
      ? roles.includes(this.currentUser.TypeAccount.type)
      : false;
  }

  // Métodos de estado
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isJwtExpired(token)) {
      this.logout();
      this.router.navigate(['/login']);
      return false;
    }
    return this.authState.value.isAuthenticated;
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.tokenKey) : null;
  }

  // Métodos privados
  private checkPermission(type: keyof Permissions, key: string): boolean {
    const user = this.currentUser;
    if (!user) return false;

    const cacheKey = `${type}:${key}:${user.TypeAccount.type}`;
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    const normalizedKey = key.startsWith('/') ? key.substring(1) : key;
    const allowedRoles = this.permissions[type][normalizedKey];
    const result = allowedRoles?.includes(user.TypeAccount.type) ?? false;

    this.permissionCache.set(cacheKey, result);
    return result;
  }

  private clearPermissionCache(): void {
    this.permissionCache.clear();
  }

  private setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  private setCurrentUser(user: User): void {
    // Garante que o campo 'perfil' seja preenchido com o tipo de conta
    if (user['TypeAccount']?.type) {
      user.TypeAccount.type = user['TypeAccount'].type;
    }
    if (this.isBrowser) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    this.authState.next({
      user,
      isAuthenticated: true,
    });
  }

  private loadStoredUser(): void {
    if (this.isBrowser) {
      const storedUser = localStorage.getItem(this.userKey);
      const token = this.getToken();
      if (!token || this.isJwtExpired(token)) {
        this.logout();
        return;
      }
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.authState.next({
          user,
          isAuthenticated: true,
        });
      }
    }
  }

  private isJwtExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload?.exp) return true;
      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp <= nowInSeconds;
    } catch {
      return true;
    }
  }
}
