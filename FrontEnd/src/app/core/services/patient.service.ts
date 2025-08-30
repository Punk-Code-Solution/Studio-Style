import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Patient } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private patients: Patient[] = [
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      telefone: '(11) 99999-9999',
      status: 'ativo',
      ultimaVisita: '2024-03-15',
      proximaConsulta: '2024-04-01',
      avatar: 'assets/images/avatars/patient1.jpg'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      email: 'maria.santos@email.com',
      telefone: '(11) 98888-8888',
      status: 'ativo',
      ultimaVisita: '2024-03-10',
      proximaConsulta: '2024-03-25',
      avatar: 'assets/images/avatars/patient2.jpg'
    }
  ];

  constructor() {}

  getPatients(): Observable<Patient[]> {
    return of(this.patients);
  }

  getPatient(id: string): Observable<Patient> {
    const patient = this.patients.find(p => p.id === +id);
    if (!patient) {
      throw new Error('Paciente não encontrado');
    }
    return of(patient);
  }

  createPatient(patient: Omit<Patient, 'id'>): Observable<Patient> {
    const newPatient = {
      ...patient,
      id: this.patients.length + 1
    };
    this.patients.push(newPatient);
    return of(newPatient);
  }

  updatePatient(id: number, patient: Partial<Patient>): Observable<Patient> {
    const index = this.patients.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Paciente não encontrado');
    }
    this.patients[index] = { ...this.patients[index], ...patient };
    return of(this.patients[index]);
  }

  deletePatient(id: number): Observable<void> {
    const index = this.patients.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Paciente não encontrado');
    }
    this.patients.splice(index, 1);
    return of(void 0);
  }
}
