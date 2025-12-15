import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User, UserService } from '../../core/services/user.service';
import { SchedulesService, Schedule } from '../../core/services/schedules.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoggingService } from '../../core/services/logging.service';
import { SocketService } from '../../core/services/socket.service';
import { Subscription } from 'rxjs';

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
export class DashboardComponent implements OnInit, OnDestroy {
  appointments: Schedule[] = [];
  currentUser: User | null = null;
  isLoading = true;
  error: string | null = null;
  totalAppointmentsThisMonth = 0;
  completedAppointmentsThisMonth = 0;
  totalClients = 0;
  newClientsThisMonth = 0;
  private socketSubscriptions: Subscription[] = [];

  get completedAppointmentsToday(): number {
    return this.appointments.filter(a => !!a.finished).length;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private schedulesService: SchedulesService,
    private userService: UserService,
    private notificationService: NotificationService,
    private loggingService: LoggingService,
    private socketService: SocketService
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadData();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    // Limpar todas as subscrições do Socket.IO
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Configura os listeners do Socket.IO para atualização automática
   */
  private setupSocketListeners(): void {
    // Listener para quando um novo agendamento é criado
    const createdSub = this.socketService.onScheduleCreated.subscribe((event) => {
      console.log('Novo agendamento recebido via Socket.IO:', event);
      
      // Verificar se o agendamento é de hoje
      const scheduleDate = new Date(event.schedule.date_and_houres);
      const today = new Date();
      const isToday = scheduleDate.toDateString() === today.toDateString();
      
      if (isToday) {
        // Recarregar dados do dashboard
        this.loadData();
        this.notificationService.info('Novo agendamento adicionado!', 'Dashboard atualizado');
      } else {
        // Apenas atualizar estatísticas do mês
        this.loadAppointments();
      }
    });

    // Listener para quando um agendamento é atualizado
    const updatedSub = this.socketService.onScheduleUpdated.subscribe((event) => {
      console.log('Agendamento atualizado via Socket.IO:', event);
      this.loadData();
    });

    // Listener para quando um agendamento é deletado
    const deletedSub = this.socketService.onScheduleDeleted.subscribe((event) => {
      console.log('Agendamento deletado via Socket.IO:', event);
      this.loadData();
    });

    this.socketSubscriptions.push(createdSub, updatedSub, deletedSub);
  }

  async loadData() {
    try {
      this.isLoading = true;
      this.error = null;
      await this.loadAppointments();
      await this.loadClients();
    } catch (err) {
      this.error = 'Erro ao carregar dados do dashboard';
      this.loggingService.error('Erro ao carregar dashboard', err);
      this.notificationService.error('Erro ao carregar dados do dashboard. Por favor, tente novamente.');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAppointments() {
    try {
      this.schedulesService.getAllSchedules().subscribe({
        next: (schedules) => {
          if (!schedules || !Array.isArray(schedules)) {
            this.loggingService.warn('Nenhum agendamento retornado ou formato inválido');
            this.appointments = [];
            this.totalAppointmentsThisMonth = 0;
            this.completedAppointmentsThisMonth = 0;
            return;
          }

          // Agendamentos de hoje (para listagem do dia)
          const now = new Date();
          const todayStr = new Date(now).toISOString().split('T')[0];
          this.appointments = schedules.filter(schedule => {
            if (!schedule || !schedule.date_and_houres) return false;
            try {
              const scheduleDateStr = new Date(schedule.date_and_houres).toISOString().split('T')[0];
              return scheduleDateStr === todayStr;
            } catch (e) {
              this.loggingService.warn('Erro ao processar data do agendamento', { scheduleId: schedule.id, error: e });
              return false;
            }
          });

          // Total de agendamentos do mês atual (para o card "Serviços este mês")
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const monthSchedules = schedules.filter(schedule => {
            if (!schedule || !schedule.date_and_houres) return false;
            try {
              const d = new Date(schedule.date_and_houres);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            } catch (e) {
              return false;
            }
          });
          this.totalAppointmentsThisMonth = monthSchedules.length;
          this.completedAppointmentsThisMonth = monthSchedules.filter(s => !!s.finished).length;
        },
        error: (error) => {
          this.loggingService.error('Erro ao carregar agendamentos', error);
          this.error = 'Erro ao carregar agendamentos';
          this.notificationService.error('Erro ao carregar agendamentos. Por favor, tente novamente.');
        }
      });
    } catch (error) {
      this.loggingService.error('Erro ao carregar agendamentos', error);
      this.error = 'Erro ao carregar agendamentos';
    }
  }

  private async loadClients() {
    try {
      this.userService.getUsers().subscribe({
        next: (users) => {
          if (!users || !Array.isArray(users)) {
            this.loggingService.warn('Nenhum usuário retornado ou formato inválido');
            this.totalClients = 0;
            this.newClientsThisMonth = 0;
            return;
          }

          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          const clients = users.filter(u => u && u.TypeAccount?.type === 'client');
          this.totalClients = clients.length;

          this.loggingService.log('Clientes carregados', { count: clients.length });

          this.newClientsThisMonth = clients.filter(u => {
            if (!u || !u.createdAt) {
              return false;
            }

            try {
              const created = new Date(u.createdAt);
              // Verifica se a data é válida
              if (isNaN(created.getTime())) {
                this.loggingService.warn('Data de criação inválida para cliente', { userId: u.id });
                return false;
              }

              return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
            } catch (e) {
              this.loggingService.warn('Erro ao processar data de criação do cliente', { userId: u.id, error: e });
              return false;
            }
          }).length;
        },
        error: (error) => {
          this.loggingService.error('Erro ao carregar usuários', error);
          this.totalClients = 0;
          this.newClientsThisMonth = 0;
          this.notificationService.error('Erro ao carregar dados de clientes.');
        }
      });
    } catch (error) {
      this.loggingService.error('Erro ao carregar clientes', error);
      this.totalClients = 0;
      this.newClientsThisMonth = 0;
    }
  }

  formatDate(date: string): string {
    if (!date) return 'Data inválida';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch (e) {
      this.loggingService.warn('Erro ao formatar data', { date, error: e });
      return 'Data inválida';
    }
  }

  async updateStatus(appointment: Schedule, event: Event) {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;

    try {
      // Mapear os status do select para os campos do Schedule
      let active = true;
      let finished = false;

      switch (newStatus) {
        case 'active':
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
          this.notificationService.success('Status do agendamento atualizado com sucesso!');
        },
        error: (error) => {
          const errorMsg = error?.error?.message || error?.message || 'Erro desconhecido';
          this.loggingService.error('Erro ao atualizar status do agendamento', error);
          // Reverter para o status anterior
          select.value = this.getStatusValue(appointment);
          this.notificationService.error(`Erro ao atualizar status: ${errorMsg}`);
        }
      });
    } catch (err) {
      this.loggingService.error('Erro ao atualizar status do agendamento', err);
      // Reverter para o status anterior
      select.value = this.getStatusValue(appointment);
    }
  }

  navigateToConsultation(appointment: Schedule) {
    this.router.navigate(['/services'], { queryParams: { id: appointment.id } });
  }

  navigateToNewConsultation() {
    this.router.navigate(['/services'], { queryParams: { new: true } });
  }

  getRoleLabel(role: string | undefined): string {
    if (!role) return 'Usuário';

    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'provider': 'Prestador de Serviço',
      'client': 'Cliente'
    };
    return roles[role] || role;
  }

  getStatusCardClass(schedule: Schedule): string {
    // Verifica o status e retorna a classe correspondente
    if (schedule.finished) {
      return 'status-completed';
    }
    if (!schedule.active) {
      return 'status-cancelled';
    }
    return 'status-active';
  }

  getStatusStyles(schedule: Schedule): { [key: string]: string } {
    // Aplica estilos inline para garantir que sejam aplicados
    if (schedule.finished) {
      return {
        'border-left': '4px solid #2196f3',
        'background': '#f3f8ff'
      };
    }
    if (!schedule.active) {
      return {
        'border-left': '4px solid #f44336',
        'background': '#fff5f5',
        'opacity': '0.85'
      };
    }
    return {
      'border-left': '4px solid #4caf50',
      'background': '#f1f8f4'
    };
  }

  getStatusValue(schedule: Schedule): string {
    if (schedule.finished) {
      if (schedule.active) {
        return 'completed';
      }
      return 'cancelled';
    }
    return 'active';
  }

  getStatusLabel(schedule: Schedule): string {
    if (schedule.finished) return 'Concluído';
    if (!schedule.active) return 'Cancelado';
    return 'Agendado';
  }

  getProviderName(schedule: Schedule): string {
    if (schedule.provider) {
      const name = schedule.provider.name || '';
      const lastname = schedule.provider.lastname || '';
      const fullName = `${name} ${lastname}`.trim();
      return fullName || 'N/A';
    }
    return 'N/A';
  }

  getServicesList(schedule: Schedule): string {
    if (schedule.Services && Array.isArray(schedule.Services) && schedule.Services.length > 0) {
      return schedule.Services
        .filter(s => s && s.service)
        .map(s => s.service)
        .join(', ');
    }
    return 'Nenhum serviço';
  }

  formatTime(dateTime: string): string {
    if (!dateTime) return '--:--';
    try {
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) {
        this.loggingService.warn('Data inválida ao formatar hora');
        return '--:--';
      }
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      this.loggingService.warn('Erro ao formatar hora', { dateTime, error: e });
      return '--:--';
    }
  }
}
