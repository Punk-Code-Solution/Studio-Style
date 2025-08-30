import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Feedback {
  id: number;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pendente' | 'respondido' | 'arquivado';
  response?: string;
  patientId: number;
  doctorId: number;
  doctorName: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private feedbacks: Feedback[] = [
    {
      id: 1,
      patientName: 'João Silva',
      rating: 5,
      comment: 'Excelente atendimento! O médico foi muito atencioso e profissional.',
      date: '2024-03-20',
      status: 'respondido',
      response: 'Obrigado pelo feedback positivo! Ficamos felizes em poder ajudar.',
      patientId: 1,
      doctorId: 2,
      doctorName: 'Dr. Carlos Oliveira'
    },
    {
      id: 2,
      patientName: 'Maria Oliveira',
      rating: 4,
      comment: 'Bom atendimento, mas a espera foi um pouco longa.',
      date: '2024-03-19',
      status: 'pendente',
      patientId: 2,
      doctorId: 2,
      doctorName: 'Dr. Carlos Oliveira'
    },
    {
      id: 3,
      patientName: 'Pedro Santos',
      rating: 5,
      comment: 'Muito satisfeito com o atendimento. O médico explicou tudo detalhadamente.',
      date: '2024-03-18',
      status: 'respondido',
      response: 'Agradecemos sua confiança! Estamos sempre à disposição.',
      patientId: 3,
      doctorId: 3,
      doctorName: 'Dra. Ana Costa'
    },
    {
      id: 4,
      patientName: 'Ana Pereira',
      rating: 3,
      comment: 'Atendimento razoável, mas poderia ser mais rápido.',
      date: '2024-03-17',
      status: 'pendente',
      patientId: 4,
      doctorId: 3,
      doctorName: 'Dra. Ana Costa'
    },
    {
      id: 5,
      patientName: 'Lucas Mendes',
      rating: 5,
      comment: 'Melhor experiência médica que já tive. Equipe muito competente!',
      date: '2024-03-16',
      status: 'arquivado',
      response: 'Muito obrigado pelo feedback! Nosso objetivo é sempre oferecer o melhor atendimento.',
      patientId: 5,
      doctorId: 2,
      doctorName: 'Dr. Carlos Oliveira'
    }
  ];

  constructor() {}

  getFeedbacks(): Observable<Feedback[]> {
    return of(this.feedbacks).pipe(delay(1000));
  }

  getFeedbackById(id: number): Observable<Feedback | undefined> {
    const feedback = this.feedbacks.find(f => f.id === id);
    return of(feedback).pipe(delay(500));
  }

  getFeedbacksByDoctor(doctorId: number): Observable<Feedback[]> {
    const doctorFeedbacks = this.feedbacks.filter(f => f.doctorId === doctorId);
    return of(doctorFeedbacks).pipe(delay(500));
  }

  createFeedback(feedback: Omit<Feedback, 'id'>): Observable<Feedback> {
    const newFeedback: Feedback = {
      ...feedback,
      id: Math.max(...this.feedbacks.map(f => f.id)) + 1
    };
    this.feedbacks = [...this.feedbacks, newFeedback];
    return of(newFeedback).pipe(delay(500));
  }

  updateFeedback(id: number, feedback: Partial<Feedback>): Observable<Feedback> {
    const index = this.feedbacks.findIndex(f => f.id === id);
    if (index === -1) {
      return throwError(() => new Error('Feedback não encontrado'));
    }

    this.feedbacks[index] = { ...this.feedbacks[index], ...feedback };
    return of(this.feedbacks[index]).pipe(delay(500));
  }

  deleteFeedback(id: number): Observable<void> {
    const index = this.feedbacks.findIndex(f => f.id === id);
    if (index === -1) {
      return throwError(() => new Error('Feedback não encontrado'));
    }

    this.feedbacks = this.feedbacks.filter(f => f.id !== id);
    return of(void 0).pipe(delay(500));
  }

  respondToFeedback(id: number, response: string): Observable<Feedback> {
    return this.updateFeedback(id, {
      response,
      status: 'respondido'
    });
  }

  archiveFeedback(id: number): Observable<Feedback> {
    return this.updateFeedback(id, {
      status: 'arquivado'
    });
  }
} 