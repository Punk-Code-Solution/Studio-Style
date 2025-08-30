import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Consultation } from '../models/consultation.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private consultations: Consultation[] = [
    {
      id: 1,
      pacienteId: 1,
      data: '2024-03-15',
      horario: '14:30',
      status: 'concluida',
      medico: 'Dr. Carlos Oliveira',
      sintomas: 'Dor de cabeça e febre',
      diagnostico: 'Gripe',
      prescricao: 'Paracetamol 500mg',
      observacoes: 'Repouso e hidratação'
    },
    {
      id: 2,
      pacienteId: 1,
      data: '2024-04-01',
      horario: '10:00',
      status: 'agendada',
      medico: 'Dra. Ana Santos',
      observacoes: 'Retorno para avaliação'
    },
    {
      id: 3,
      pacienteId: 2,
      data: '2024-03-10',
      horario: '15:00',
      status: 'concluida',
      medico: 'Dr. Carlos Oliveira',
      sintomas: 'Dor nas costas',
      diagnostico: 'Hérnia de disco',
      prescricao: 'Anti-inflamatório e fisioterapia',
      observacoes: 'Evitar esforços'
    }
  ];

  constructor() {}

  getConsultations(): Observable<Consultation[]> {
    return of(this.consultations);
  }

  getConsultation(id: string): Observable<Consultation> {
    const consultation = this.consultations.find(c => c.id === +id);
    if (!consultation) {
      throw new Error('Consulta não encontrada');
    }
    return of(consultation);
  }

  createConsultation(consultation: Omit<Consultation, 'id'>): Observable<Consultation> {
    const newConsultation = {
      ...consultation,
      id: this.consultations.length + 1
    };
    this.consultations.push(newConsultation);
    return of(newConsultation);
  }

  updateConsultation(id: number, consultation: Partial<Consultation>): Observable<Consultation> {
    const index = this.consultations.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Consulta não encontrada');
    }
    this.consultations[index] = { ...this.consultations[index], ...consultation };
    return of(this.consultations[index]);
  }

  deleteConsultation(id: number): Observable<void> {
    const index = this.consultations.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Consulta não encontrada');
    }
    this.consultations.splice(index, 1);
    return of(void 0);
  }

  updateStatus(id: string, status: Consultation['status']): Observable<Consultation> {
    const index = this.consultations.findIndex(c => c.id === +id);
    if (index === -1) {
      return throwError(() => new Error('Consulta não encontrada'));
    }
    const updatedConsultation = {
      ...this.consultations[index],
      status
    };
    this.consultations[index] = updatedConsultation;
    return of(updatedConsultation);
  }

  getConsultationById(id: string | number): Observable<Consultation> {
    const consultation = this.consultations.find(c => c.id === +id);
    if (!consultation) {
      return throwError(() => new Error('Consulta não encontrada'));
    }
    return of(consultation);
  }
} 