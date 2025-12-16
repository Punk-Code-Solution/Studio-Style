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
    
    // Polling imediato na primeira vez
    this.performPolling();
    
    // Configurar polling periódico
    this.pollingInterval = setInterval(() => {
      this.performPolling();
    }, this.POLLING_INTERVAL);
    
    if (!environment.production) {
      console.log('🔄 [Schedule Monitor] Monitoramento iniciado (intervalo: 30s)');
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
        
        // Verificar se há novos agendamentos
        const hasNewAppointment = this.detectNewAppointments(todayAppointments);
        
        if (hasNewAppointment) {
          // Tocar som e mostrar notificação
          this.audioService.playDoubleBeep();
          this.notificationService.info('Novo agendamento adicionado!', 'Dashboard atualizado');
          if (!environment.production) {
            console.log('🔔 [Schedule Monitor] Novo agendamento detectado - som tocado');
          }
        }
        
        // Atualizar lista de agendamentos conhecidos
        this.lastKnownAppointments = todayAppointments;
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
    // Se não há agendamentos conhecidos anteriormente, não considerar como novo (primeira vez)
    if (this.lastKnownAppointments.length === 0) {
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
    for (const id of newIds) {
      if (!currentIds.has(id)) {
        return true; // Encontrou um novo agendamento
      }
    }

    return false; // Não há novos agendamentos
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}

