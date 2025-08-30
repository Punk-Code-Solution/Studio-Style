import { Injectable } from '@angular/core';

export interface AuditLog {
  timestamp: Date;
  user: string;
  action: string;
  targetType: 'patient' | 'consultation';
  targetId: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private logs: AuditLog[] = [];

  addLog(log: AuditLog) {
    this.logs.push(log);
    // Aqui você pode enviar para o backend se desejar
    console.log('AuditLog:', log);
  }

  getLogs(): AuditLog[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
} 