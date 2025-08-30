import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Patient } from './patient.service';

export type CheckinStatus = 'aguardando' | 'em_atendimento' | 'finalizado';

export interface Checkin {
  id: string;
  patientId: string;
  patientName: string;
  status: CheckinStatus;
  arrivalTime: Date;
  doctorId?: string;
  doctorName?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckinService {
  private checkins = new BehaviorSubject<Checkin[]>([]);

  constructor() {}

  getCheckins(): Observable<Checkin[]> {
    return this.checkins.asObservable();
  }

  getActiveCheckins(): Observable<Checkin[]> {
    return new Observable(subscriber => {
      this.checkins.subscribe(allCheckins => {
        const active = allCheckins.filter(c => 
          c.status === 'aguardando' || c.status === 'em_atendimento'
        );
        subscriber.next(active);
      });
    });
  }

  createCheckin(patient: Patient): Observable<Checkin> {
    const newCheckin: Checkin = {
      id: Date.now().toString(),
      patientId: patient.id,
      patientName: patient.name,
      status: 'aguardando',
      arrivalTime: new Date()
    };

    const currentCheckins = this.checkins.value;
    this.checkins.next([...currentCheckins, newCheckin]);

    return new Observable(subscriber => {
      subscriber.next(newCheckin);
      subscriber.complete();
    });
  }

  updateCheckinStatus(checkinId: string, status: CheckinStatus): Observable<Checkin> {
    const currentCheckins = this.checkins.value;
    const index = currentCheckins.findIndex(c => c.id === checkinId);
    
    if (index === -1) {
      throw new Error('Check-in não encontrado');
    }

    const updatedCheckin: Checkin = {
      ...currentCheckins[index],
      status
    };

    currentCheckins[index] = updatedCheckin;
    this.checkins.next([...currentCheckins]);

    return new Observable(subscriber => {
      subscriber.next(updatedCheckin);
      subscriber.complete();
    });
  }

  assignDoctor(checkinId: string, doctorId: string, doctorName: string): Observable<Checkin> {
    const currentCheckins = this.checkins.value;
    const index = currentCheckins.findIndex(c => c.id === checkinId);
    
    if (index === -1) {
      throw new Error('Check-in não encontrado');
    }

    const updatedCheckin: Checkin = {
      ...currentCheckins[index],
      doctorId,
      doctorName,
      status: 'em_atendimento' as CheckinStatus
    };

    currentCheckins[index] = updatedCheckin;
    this.checkins.next([...currentCheckins]);

    return new Observable(subscriber => {
      subscriber.next(updatedCheckin);
      subscriber.complete();
    });
  }

  finalizeCheckin(checkinId: string, notes?: string): Observable<Checkin> {
    const currentCheckins = this.checkins.value;
    const index = currentCheckins.findIndex(c => c.id === checkinId);
    
    if (index === -1) {
      throw new Error('Check-in não encontrado');
    }

    const updatedCheckin: Checkin = {
      ...currentCheckins[index],
      status: 'finalizado' as CheckinStatus,
      notes
    };

    currentCheckins[index] = updatedCheckin;
    this.checkins.next([...currentCheckins]);

    return new Observable(subscriber => {
      subscriber.next(updatedCheckin);
      subscriber.complete();
    });
  }
} 