import { Component, OnInit, Output, EventEmitter } from '@angular/core'; // Adicionado Output e EventEmitter
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, UserRole } from '../../core/services/auth.service';
import { User } from '../../core/services/user.service';

// Constante centralizada para labels de roles
const ROLE_LABELS: Record<UserRole, string> = {
  'admin': 'Administrador',
  'ninguem': 'Usuário', // 'ninguem' parece ser um tipo legado, mas mantido
  'provider': 'Colaborador',
  'client': 'Cliente' 

};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  // MODIFICADO (Ponto 10): Adicionado EventEmitter
  @Output() onToggle = new EventEmitter<void>();

  currentUser: User | null = null;
  userAvatar = 'assets/images/avatar.png';

  get userRole(): string {
    return this.currentUser?.TypeAccount.type ? ROLE_LABELS[this.currentUser.TypeAccount.type] : '';
  }

  constructor(
    public authService: AuthService,
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

  // MODIFICADO (Ponto 10): Adicionado método
  toggleSidebar(): void {
    this.onToggle.emit();
  }
}