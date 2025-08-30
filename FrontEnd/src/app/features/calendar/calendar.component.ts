import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface Appointment {
  id: number;
  patientName: string;
  date: string;
  time: string;
  status: 'agendado' | 'em_andamento' | 'concluido' | 'cancelado';
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h2>Calendário de Consultas</h2>
      </div>

      <div class="calendar-container">
        <div class="calendar-header">
          <button class="nav-btn" (click)="previousMonth()">Anterior</button>
          <h3>{{ currentMonthName }} {{ currentYear }}</h3>
          <button class="nav-btn" (click)="nextMonth()">Próximo</button>
        </div>

        <div class="calendar-grid">
          <div class="weekday" *ngFor="let day of weekDays">{{ day }}</div>
          <div 
            class="day" 
            *ngFor="let day of calendarDays" 
            [class.other-month]="!day.isCurrentMonth"
            [class.has-appointments]="hasAppointments(day.date)"
            [class.selected]="day.date === selectedDate"
            (click)="selectDate(day.date)"
          >
            <span class="day-number">{{ day.dayNumber }}</span>
            <div class="appointments-preview" *ngIf="hasAppointments(day.date)">
              <div 
                class="appointment-dot" 
                *ngFor="let appointment of getAppointmentsForDay(day.date)"
                [class]="appointment.status"
              ></div>
            </div>
          </div>
        </div>

        <div class="appointments-list" *ngIf="selectedDate">
          <h3>Consultas do dia {{ formatDate(selectedDate) }}</h3>
          <div class="appointment-card" *ngFor="let appointment of getAppointmentsForDay(selectedDate)">
            <div class="appointment-info">
              <h4>{{ appointment.patientName }}</h4>
              <p class="time">{{ appointment.time }}</p>
              <p class="status" [ngClass]="appointment.status">
                {{ getStatusLabel(appointment.status) }}
              </p>
            </div>
            <div class="appointment-actions">
              <button 
                class="edit-btn" 
                [routerLink]="['/consultations', appointment.id]"
                *ngIf="canEditField('all')"
              >
                Editar
              </button>
              <button 
                class="status-btn" 
                (click)="updateAppointmentStatus(appointment)"
                *ngIf="canEditField('all')"
              >
                Atualizar Status
              </button>
            </div>
          </div>

          <div class="no-appointments" *ngIf="getAppointmentsForDay(selectedDate).length === 0">
            <p>Nenhuma consulta agendada para este dia.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
    }

    .header {
      margin-bottom: 2rem;
    }

    h2 {
      color: #1976d2;
      margin: 0;
    }

    .calendar-container {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      h3 {
        color: #333;
        margin: 0;
      }
    }

    .nav-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      background: #1976d2;
      color: white;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #1565c0;
      }
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .weekday {
      text-align: center;
      font-weight: bold;
      color: #666;
      padding: 0.5rem;
    }

    .day {
      aspect-ratio: 1;
      padding: 0.5rem;
      border: 1px solid #eee;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;

      &:hover {
        background: #f5f5f5;
      }

      &.other-month {
        opacity: 0.5;
      }

      &.has-appointments {
        border-color: #1976d2;
      }

      &.selected {
        background: #e3f2fd;
        border-color: #1976d2;
      }
    }

    .day-number {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .appointments-preview {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    .appointment-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.agendado {
        background: #1976d2;
      }

      &.em_andamento {
        background: #f57c00;
      }

      &.concluido {
        background: #388e3c;
      }

      &.cancelado {
        background: #d32f2f;
      }
    }

    .appointments-list {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #eee;

      h3 {
        color: #333;
        margin: 0 0 1rem 0;
      }
    }

    .appointment-card {
      background: #f8f9fa;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .appointment-info {
      h4 {
        color: #333;
        margin: 0 0 0.5rem 0;
      }

      .time {
        color: #666;
        margin: 0.25rem 0;
      }
    }

    .status {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-top: 0.5rem;

      &.agendado {
        background: #e3f2fd;
        color: #1976d2;
      }

      &.em_andamento {
        background: #fff3e0;
        color: #f57c00;
      }

      &.concluido {
        background: #e8f5e9;
        color: #388e3c;
      }

      &.cancelado {
        background: #ffebee;
        color: #d32f2f;
      }
    }

    .appointment-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .edit-btn, .status-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .edit-btn {
      background: #1976d2;
      color: white;

      &:hover {
        background: #1565c0;
      }
    }

    .status-btn {
      background: #f5f5f5;
      color: #666;

      &:hover {
        background: #e0e0e0;
      }
    }

    .no-appointments {
      text-align: center;
      padding: 2rem;
      color: #666;
      background: #f8f9fa;
      border-radius: 4px;
    }
  `]
})
export class CalendarComponent implements OnInit {
  weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  currentDate = new Date();
  currentMonthName = '';
  currentYear = 0;
  calendarDays: { dayNumber: number; date: string; isCurrentMonth: boolean }[] = [];
  appointments: Appointment[] = [];
  selectedDate: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.updateCalendar();
    this.loadAppointments();
  }

  updateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    this.currentMonthName = this.currentDate.toLocaleString('pt-BR', { month: 'long' });
    this.currentYear = year;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstDayWeekday = firstDay.getDay();
    const lastDayWeekday = lastDay.getDay();

    this.calendarDays = [];

    // Dias do mês anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      this.calendarDays.push({
        dayNumber: day,
        date: this.formatDate(date),
        isCurrentMonth: false
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      this.calendarDays.push({
        dayNumber: i,
        date: this.formatDate(date),
        isCurrentMonth: true
      });
    }

    // Dias do próximo mês
    for (let i = 1; i <= 6 - lastDayWeekday; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push({
        dayNumber: i,
        date: this.formatDate(date),
        isCurrentMonth: false
      });
    }
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.calendarDays = [];
    this.updateCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.calendarDays = [];
    this.updateCalendar();
  }

  loadAppointments() {
    // Simular carregamento de consultas
    this.appointments = [
      {
        id: 1,
        patientName: 'João Silva',
        date: '2024-03-20',
        time: '14:00',
        status: 'agendado'
      },
      {
        id: 2,
        patientName: 'Maria Oliveira',
        date: '2024-03-20',
        time: '15:30',
        status: 'em_andamento'
      },
      {
        id: 3,
        patientName: 'Pedro Santos',
        date: '2024-03-21',
        time: '10:00',
        status: 'agendado'
      }
    ];
  }

  formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString().split('T')[0];
  }

  selectDate(date: string) {
    this.selectedDate = date;
  }

  hasAppointments(date: string): boolean {
    return this.appointments.some(appointment => appointment.date === date);
  }

  getAppointmentsForDay(date: string): Appointment[] {
    return this.appointments
      .filter(appointment => appointment.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'agendado': 'Agendado',
      'em_andamento': 'Em Andamento',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  }

  updateAppointmentStatus(appointment: Appointment) {
    const statusOrder = ['agendado', 'em_andamento', 'concluido', 'cancelado'];
    const currentIndex = statusOrder.indexOf(appointment.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    appointment.status = statusOrder[nextIndex] as Appointment['status'];
  }

  canEditField(field: string): boolean {
    return this.authService.canEditField(field);
  }
}
