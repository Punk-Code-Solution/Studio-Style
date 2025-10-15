import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/services/user.service';
import { SchedulesService, Schedule } from '../../core/services/schedules.service';

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
  appointments: Schedule[] = [];
  currentUser: User | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private schedulesService: SchedulesService
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
    try {
      this.schedulesService.getAllSchedules().subscribe({
        next: (schedules) => {
          // Filtrar apenas os agendamentos de hoje
          const today = new Date().toISOString().split('T')[0];
          this.appointments = schedules.filter(schedule => {
            const scheduleDate = new Date(schedule.date_and_houres).toISOString().split('T')[0];
            return scheduleDate === today;
          });
        },
        error: (error) => {
          console.error('Erro ao carregar agendamentos:', error);
          this.error = 'Erro ao carregar agendamentos';
        }
      });
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      this.error = 'Erro ao carregar agendamentos';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  async updateStatus(appointment: Schedule, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;

    try {
      // Mapear os status do select para os campos do Schedule
      let active = true;
      let finished = false;

      switch (newStatus) {
        case 'scheduled':
        case 'confirmed':
          active = true;
          finished = false;
          break;
        case 'completed':
          active = true;
          finished = true;
          break;
        case 'cancelled':
          active = false;
          finished = false;
          break;
      }

      // Atualizar o agendamento via API
      this.schedulesService.updateSchedule(appointment.id, { active, finished }).subscribe({
        next: () => {
          // Atualizar localmente
          appointment.active = active;
          appointment.finished = finished;
        },
        error: (error) => {
          console.error('Erro ao atualizar status:', error);
          // Reverter para o status anterior
          select.value = this.getStatusValue(appointment);
        }
      });
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      // Reverter para o status anterior
      select.value = this.getStatusValue(appointment);
    }
  }

  navigateToConsultation(appointment: Schedule) {
    this.router.navigate(['/schedules'], { queryParams: { id: appointment.id } });
  }

  navigateToNewConsultation() {
    this.router.navigate(['/schedules'], { queryParams: { new: true } });
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

  getStatusValue(schedule: Schedule): string {
    if (schedule.finished) return 'completed';
    if (!schedule.active) return 'cancelled';
    return 'scheduled';
  }

  getStatusLabel(schedule: Schedule): string {
    if (schedule.finished) return 'Concluído';
    if (!schedule.active) return 'Cancelado';
    return 'Agendado';
  }

  getProviderName(schedule: Schedule): string {
    if (schedule.provider) {
      return `${schedule.provider.name} ${schedule.provider.lastname}`;
    }
    return 'N/A';
  }

  getServicesList(schedule: Schedule): string {
    if (schedule.Services && schedule.Services.length > 0) {
      return schedule.Services.map(s => s.service).join(', ');
    }
    return 'Nenhum serviço';
  }

  formatTime(dateTime: string): string {
    return new Date(dateTime).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
