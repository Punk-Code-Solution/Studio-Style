import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Schedule {
  id: string;
  name_client: string;
  date_and_houres: string;
  active: boolean;
  finished: boolean;
  provider_id_schedules: string;
  client_id_schedules: string;
  Services?: Service[];
  provider?: Account;
  client?: Account;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Service {
  id: string;
  service: string;
  additionalComments?: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Account {
  id: string;
  name: string;
  lastname: string;
  avatar?: string;
  cpf: string;
  birthday?: string;
  typeaccount_id: string;
  company_id_account: string;
  type_hair_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateScheduleRequest {
  name_client: string;
  date_and_houres: string;
  active: boolean;
  finished: boolean;
  provider_id_schedules: string;
  client_id_schedules: string;
  services: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SchedulesService {
  private apiUrl = `${environment.apiUrl}/schedules`;

  constructor(private http: HttpClient) {}

  getAllSchedules(): Observable<Schedule[]> {
    return this.http.get<ApiResponse<Schedule[]>>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  getScheduleById(id: string): Observable<Schedule> {
    return this.http.get<ApiResponse<Schedule>>(`${this.apiUrl}/schedules/id?id=${id}`).pipe(
      map(response => response.data)
    );
  }

  createSchedule(schedule: CreateScheduleRequest): Observable<Schedule> {
    return this.http.post<ApiResponse<Schedule>>(this.apiUrl, schedule).pipe(
      map(response => response.data)
    );
  }

  updateSchedule(id: string, schedule: Partial<Schedule>): Observable<Schedule> {
    return this.http.put<ApiResponse<Schedule>>(this.apiUrl, { id, ...schedule }).pipe(
      map(response => response.data)
    );
  }

  deleteSchedule(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}?id=${id}`).pipe(
      map(response => response.data)
    );
  }
}
