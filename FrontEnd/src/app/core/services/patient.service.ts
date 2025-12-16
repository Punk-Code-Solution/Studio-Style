import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Patient } from '../models/patient.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreatePatientRequest {
  name: string;
  lastname: string;
  phone?: string;
  email?: string; // Modificado para opcional
  password?: string; // Modificado para opcional
  cpf?: string; // Modificado para opcional
  birthday?: string;
  deleted?: boolean;
  avatar?: string;
  typeaccount_id: string;
  type_hair_id?: string;
}

export interface TypeAccount {
  id: string;
  type: string;
  name?: string;
  edit?: boolean;
  creat?: boolean;
  viwer?: boolean;
  delet?: boolean;
}

export interface HairType {
  id: string;
  type: string;
  level?: number;
  letter?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/account`;

  constructor(private http: HttpClient) {}

  getAllPatients(): Observable<Patient[]> {
    // LÓGICA MODIFICADA (Ponto 4): Adicionado filtro de role
    return this.http.get<ApiResponse<Patient[]>>(`${this.apiUrl}?role=client`).pipe(
      map(response => {
        const patients = response.data || [];
        return patients.map(patient => this.mapPatient(patient));
      })
    );
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<ApiResponse<Patient>>(`${this.apiUrl}/id?id=${id}`).pipe(
      map(response => this.mapPatient(response.data))
    );
  }

  private mapPatient(patient: Patient): Patient {
    // Mapear email da array Emails para propriedade email
    if (patient.Emails && patient.Emails.length > 0) {
      patient.email = patient.Emails[0].email;
    }
    
    // Mapear telefone da array Phones para propriedade phone
    // Aceita tanto Phones (maiúsculo) quanto phones (minúsculo) do backend
    const phonesArray = (patient as any).Phones || (patient as any).phones || [];
    if (phonesArray && phonesArray.length > 0) {
      const phoneObj = phonesArray[0];
      
      // Se phoneObj já é uma string, usar diretamente
      if (typeof phoneObj === 'string') {
        patient.phone = phoneObj;
      } 
      // Se phoneObj é um objeto com propriedades phone e ddd
      else if (phoneObj && typeof phoneObj === 'object') {
        const phoneNumber = phoneObj.phone;
        const ddd = phoneObj.ddd;
        
        if (ddd && phoneNumber) {
          patient.phone = `(${ddd}) ${phoneNumber}`;
        } else if (phoneNumber) {
          patient.phone = String(phoneNumber);
        }
      }
    }
    
    return patient;
  }

  createPatient(patient: CreatePatientRequest): Observable<Patient> {
    return this.http.post<ApiResponse<Patient>>(this.apiUrl, patient).pipe(
      map(response => this.mapPatient(response.data))
    );
  }

  updatePatient(id: string, patient: Partial<CreatePatientRequest>): Observable<Patient> {
    return this.http.put<ApiResponse<Patient>>(`${this.apiUrl}/id`, { id, ...patient }).pipe(
      map(response => this.mapPatient(response.data))
    );
  }

  deletePatient(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/id?id=${id}`).pipe(
      map(response => response.data)
    );
  }

  getAllTypeAccounts(): Observable<TypeAccount[]> {
    return this.http.get<ApiResponse<TypeAccount[]>>(`${this.apiUrl}/type-accounts`).pipe(
      map(response => response.data || [])
    );
  }

  getAllHairTypes(): Observable<HairType[]> {
    return this.http.get<ApiResponse<HairType[]>>(`${this.apiUrl}/hair`).pipe(
      map(response => response.data || [])
    );
  }
}