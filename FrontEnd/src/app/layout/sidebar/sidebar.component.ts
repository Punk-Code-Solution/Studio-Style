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
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  currentUser: User | null = null;
  userAvatar = 'assets/images/avatar.png';

  get userRole(): string {
    return this.currentUser?.TypeAccount.type ? ROLE_LABELS[this.currentUser.TypeAccount.type] : '';
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
