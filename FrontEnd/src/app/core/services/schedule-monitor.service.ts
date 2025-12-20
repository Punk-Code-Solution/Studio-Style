import { Injectable, OnDestroy } from '@angular/core';
import { SchedulesService, Schedule } from './schedules.service';
import { AudioService } from './audio.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleMonitorService implements OnDestroy {
  private pollingInterval: any = null;
  private lastPollingTimestamp: Date | null = null;
  private lastKnownAppointments: Schedule[] = [];
  private readonly POLLING_INTERVAL = 30000; // 30 segundos
  private isMonitoring = false;

  constructor(
    private schedulesService: SchedulesService,
    private audioService: AudioService,
    private notificationService: NotificationService
  ) {}

  /**
   * Inicia o monitoramento de novos agendamentos
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return; // Já está monitorando
    }

    this.isMonitoring = true;
    this.lastPollingTimestamp = new Date();
    
    // IMPORTANTE: Carregar lista inicial de agendamentos antes de começar a monitorar
    // Isso garante que temos uma base de comparação e não toquemos som na primeira verificação
    this.initializeAppointmentsList().then(() => {
      // Após inicializar, começar o polling periódico
      this.pollingInterval = setInterval(() => {
        this.performPolling();
      }, this.POLLING_INTERVAL);
      
      if (!environment.production) {
        console.log('🔄 [Schedule Monitor] Monitoramento iniciado (intervalo: 30s)');
      }
    });
  }

  /**
   * Inicializa a lista de agendamentos conhecidos sem tocar som
   */
  private async initializeAppointmentsList(): Promise<void> {
    try {
      const schedules = await this.schedulesService.getAllSchedules().toPromise();

      if (schedules && Array.isArray(schedules)) {
        // Filtrar apenas agendamentos de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        const todayAppointments = schedules.filter(schedule => {
          if (!schedule || !schedule.date_and_houres) return false;
          try {
            const scheduleDateStr = new Date(schedule.date_and_houres).toISOString().split('T')[0];
            return scheduleDateStr === todayStr;
          } catch (e) {
            return false;
          }
        });
        
        // Inicializar lista sem tocar som
        this.lastKnownAppointments = [...todayAppointments];
        
        if (!environment.production) {
          console.log(`🔄 [Schedule Monitor] Lista inicial carregada: ${this.lastKnownAppointments.length} agendamentos de hoje`);
        }
      }
    } catch (error) {
      if (!environment.production) {
        console.error('[Schedule Monitor] Erro ao inicializar lista:', error);
      }
    }
  }

  /**
   * Para o monitoramento de novos agendamentos
   */
  stopMonitoring(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isMonitoring = false;
      if (!environment.production) {
        console.log('🛑 [Schedule Monitor] Monitoramento parado');
      }
    }
  }

  /**
   * Executa uma verificação de polling para novos agendamentos
   */
  private async performPolling(): Promise<void> {
    try {
      // Buscar todos os agendamentos e filtrar apenas os de hoje
      const schedules = await this.schedulesService.getAllSchedules().toPromise();

      if (schedules && Array.isArray(schedules)) {
        // Filtrar apenas agendamentos de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        const todayAppointments = schedules.filter(schedule => {
          if (!schedule || !schedule.date_and_houres) return false;
          try {
            const scheduleDateStr = new Date(schedule.date_and_houres).toISOString().split('T')[0];
            return scheduleDateStr === todayStr;
          } catch (e) {
            return false;
          }
        });
        
        // Verificar se há novos agendamentos ANTES de atualizar a lista
        const hasNewAppointment = this.detectNewAppointments(todayAppointments);
        
        if (hasNewAppointment) {
          // Tocar som e mostrar notificação
          this.audioService.playDoubleBeep();
          this.notificationService.info('Novo agendamento adicionado!', 'Dashboard atualizado');
          if (!environment.production) {
            console.log('🔔 [Schedule Monitor] Novo agendamento detectado - som tocado');
            console.log('🔔 [Schedule Monitor] IDs conhecidos:', this.lastKnownAppointments.map(a => a.id));
            console.log('🔔 [Schedule Monitor] IDs novos:', todayAppointments.map(a => a.id));
          }
        }
        
        // IMPORTANTE: Atualizar lista de agendamentos conhecidos APÓS verificar novos
        // Usar spread operator para criar uma nova referência (evitar mutação)
        this.lastKnownAppointments = [...todayAppointments];
      }
    } catch (error) {
      // Silenciar erros de polling para não poluir o console
      if (!environment.production) {
        console.error('[Schedule Monitor] Erro no polling:', error);
      }
    }
  }

  /**
   * Detecta se há novos agendamentos comparando com a lista anterior
   */
  private detectNewAppointments(newAppointments: Schedule[]): boolean {
    // Se não há agendamentos conhecidos anteriormente, salvar a lista atual mas não tocar som (primeira vez)
    if (this.lastKnownAppointments.length === 0) {
      // Não tocar som na primeira vez, apenas inicializar a lista
      return false;
    }

    // Se não há agendamentos atuais, não há novo
    if (newAppointments.length === 0) {
      return false;
    }

    // Comparar IDs dos agendamentos para detectar novos
    const currentIds = new Set(this.lastKnownAppointments.map(a => a.id));
    const newIds = new Set(newAppointments.map(a => a.id));
    
    // Verificar se há novos agendamentos (IDs que não existiam antes)
    // IMPORTANTE: Só considerar novo se houver mais agendamentos OU um ID que não existia
    let hasNewAppointment = false;
    
    // Se há mais agendamentos, verificar se são realmente novos
    if (newAppointments.length > this.lastKnownAppointments.length) {
      for (const id of newIds) {
        if (!currentIds.has(id)) {
          hasNewAppointment = true;
          break;
        }
      }
    } else {
      // Mesmo se a quantidade não aumentou, verificar se há um ID novo (pode ter removido um e adicionado outro)
      for (const id of newIds) {
        if (!currentIds.has(id)) {
          hasNewAppointment = true;
          break;
        }
      }
    }

    return hasNewAppointment;
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}

