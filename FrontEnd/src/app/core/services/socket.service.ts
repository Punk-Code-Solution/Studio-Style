import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

// Import Socket.IO client
import { io, Socket } from 'socket.io-client';

// Tipos para eventos Socket.IO
export interface ScheduleCreatedEvent {
  schedule: any;
  timestamp: string;
}

export interface ScheduleUpdatedEvent {
  schedule: any;
  timestamp: string;
}

export interface ScheduleDeletedEvent {
  scheduleId: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private isConnected$ = new BehaviorSubject<boolean>(false);
  private scheduleCreated$ = new Subject<ScheduleCreatedEvent>();
  private scheduleUpdated$ = new Subject<ScheduleUpdatedEvent>();
  private scheduleDeleted$ = new Subject<ScheduleDeletedEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 segundos

  constructor() {
    this.initializeSocket();
  }

  /**
   * Inicializa a conexão Socket.IO
   */
  private initializeSocket(): void {
    try {
      if (typeof window === 'undefined') {
        console.warn('Socket.IO não pode ser inicializado fora do navegador');
        return;
      }

      const apiUrl = environment.apiUrl.replace('/api', '');
      
      this.socket = io(apiUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        autoConnect: true
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Erro ao inicializar Socket.IO:', error);
    }
  }

  /**
   * Configura os listeners de eventos do Socket.IO
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor Socket.IO');
      this.isConnected$.next(true);
      this.reconnectAttempts = 0;
      
      // Se inscrever em atualizações de agendamentos
      this.subscribeToSchedules();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor Socket.IO');
      this.isConnected$.next(false);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Erro de conexão Socket.IO:', error);
      this.isConnected$.next(false);
      this.handleReconnection();
    });

    // Eventos de agendamentos
    this.socket.on('schedule:created', (data: ScheduleCreatedEvent) => {
      console.log('📅 Novo agendamento criado:', data);
      this.scheduleCreated$.next(data);
    });

    this.socket.on('schedule:updated', (data: ScheduleUpdatedEvent) => {
      console.log('📅 Agendamento atualizado:', data);
      this.scheduleUpdated$.next(data);
    });

    this.socket.on('schedule:deleted', (data: ScheduleDeletedEvent) => {
      console.log('📅 Agendamento deletado:', data);
      this.scheduleDeleted$.next(data);
    });
  }

  /**
   * Tenta reconectar ao servidor
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, this.reconnectInterval);
    } else {
      console.warn('Máximo de tentativas de reconexão atingido');
    }
  }

  /**
   * Se inscreve em atualizações de agendamentos
   */
  subscribeToSchedules(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe:schedules');
      console.log('📅 Inscrito em atualizações de agendamentos');
    }
  }

  /**
   * Se desinscreve de atualizações de agendamentos
   */
  unsubscribeFromSchedules(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('unsubscribe:schedules');
      console.log('📅 Desinscrito de atualizações de agendamentos');
    }
  }

  /**
   * Observable para verificar se está conectado
   */
  get isConnected(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  /**
   * Observable para eventos de agendamento criado
   */
  get onScheduleCreated(): Observable<ScheduleCreatedEvent> {
    return this.scheduleCreated$.asObservable();
  }

  /**
   * Observable para eventos de agendamento atualizado
   */
  get onScheduleUpdated(): Observable<ScheduleUpdatedEvent> {
    return this.scheduleUpdated$.asObservable();
  }

  /**
   * Observable para eventos de agendamento deletado
   */
  get onScheduleDeleted(): Observable<ScheduleDeletedEvent> {
    return this.scheduleDeleted$.asObservable();
  }

  /**
   * Desconecta do servidor Socket.IO
   */
  disconnect(): void {
    if (this.socket) {
      this.unsubscribeFromSchedules();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected$.next(false);
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.scheduleCreated$.complete();
    this.scheduleUpdated$.complete();
    this.scheduleDeleted$.complete();
    this.isConnected$.complete();
  }
}

