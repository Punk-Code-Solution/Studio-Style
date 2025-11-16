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
  }

  getLogs(): AuditLog[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
} 