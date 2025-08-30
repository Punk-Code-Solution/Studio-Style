import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/services/user.service';

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  doctor: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class DashboardComponent implements OnInit {
  appointments: Appointment[] = [];
  currentUser: User | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading = true;
      this.error = null;
      await this.loadAppointments();
    } catch (err) {
      this.error = 'Erro ao carregar dados do dashboard';
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAppointments() {
    const today = new Date().toISOString().split('T')[0];
    // TODO: Substituir por chamada real à API
    this.appointments = [
      {
        id: '1',
        patientName: 'João Silva',
        date: today,
        time: '14:00',
        status: 'scheduled',
        doctor: 'Dr. Maria Oliveira'
      },
      {
        id: '2',
        patientName: 'Maria Oliveira',
        date: today,
        time: '15:30',
        status: 'confirmed',
        doctor: 'Dr. Pedro Santos'
      },
      {
        id: '3',
        patientName: 'Pedro Santos',
        date: today,
        time: '10:00',
        status: 'scheduled',
        doctor: 'Dr. João Silva'
      }
    ];
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  async updateStatus(appointment: Appointment, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    
    try {
      // TODO: Implementar chamada à API para atualizar status
      appointment.status = newStatus;
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      // Reverter para o status anterior
      select.value = appointment.status;
    }
  }

  navigateToConsultation(appointment: Appointment) {
    this.router.navigate(['/consultations', appointment.id]);
  }

  navigateToNewConsultation() {
    this.router.navigate(['/consultations/new'], {
      queryParams: { from: '/dashboard' }
    });
  }

  getRoleLabel(role: string | undefined): string {
    if (!role) return 'Usuário';
    
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'doctor': 'Médico',
      'nurse': 'Enfermeiro',
      'receptionist': 'Recepcionista',
      'medico': 'Médico'
    };
    return roles[role] || role;
  }
} 