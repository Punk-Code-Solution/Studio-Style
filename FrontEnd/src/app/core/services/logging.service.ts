import { Inject, Injectable, Optional } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Environment {
  production: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private readonly isProduction: boolean;

  constructor(@Optional() @Inject('environment') env?: Environment) {
    this.isProduction = env?.production ?? environment.production;
  }

  log(message: string, data?: unknown): void {
    if (!this.isProduction) {
      this.consoleLog('log', `[LOG] ${message}`, data);
    }
  }

  warn(message: string, data?: unknown): void {
    this.consoleLog('warn', `[WARN] ${message}`, data);
  }

  error(message: string, error?: unknown): void {
    const safeError = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : this.sanitizeData(error);
      
    this.consoleLog('error', `[ERROR] ${message}`, safeError);
  }

  // Método protegido para permitir sobrescrita em testes
  protected consoleLog(level: 'log' | 'warn' | 'error', message: string, data?: unknown): void {
    const consoleMethod = console[level] || console.log;
    consoleMethod.call(console, message, this.sanitizeData(data));
  }

  private sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    // Cria uma cópia para não modificar o objeto original
    const sanitized: Record<string, unknown> = { ...(data as Record<string, unknown>) };
    
    // Remove campos sensíveis
    const sensitiveFields = [
      'password', 'token', 'accessToken', 'refreshToken', 
      'cpf', 'cnpj', 'creditCard', 'cvv', 'senha', 'token'
    ];

    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }
}
