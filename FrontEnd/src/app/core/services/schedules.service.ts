import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from './user.service';

export interface Schedule {
  id: string;
  name_client: string;
  date_and_houres: string;
  active: boolean;
  finished: boolean;
  provider_id_schedules: string;
  client_id_schedules: string;
  Services?: Service[];
  provider?: User;
  client?: User;
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

export interface CreateScheduleRequest {
  name_client: string;
  date_and_houres: string;
  active: boolean;
  finished: boolean;
  provider_id_schedules: string;
  client_id_schedules: string;
  phone?: string;
  services: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SchedulesService {
  private apiUrl = `${environment.apiUrl}/schedules`;
  private servicesUrl = `${environment.apiUrl}/service`;
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

  // Método para buscar todos os serviços disponíveis
  getAllServices(): Observable<Service[]> {    
    return this.http.get<{result: Service[]}>(this.servicesUrl).pipe(
      map(response => {
        const result = response.result;
        let services: Service[] = [];
        
        // Se result é um array, retorna ele. Se é um objeto, coloca em um array
        if (Array.isArray(result)) {
          services = result;
        } else if (result) {
          services = [result];
        }
        
        // Filtrar serviços válidos (que tenham pelo menos service e price)
        const validServices = services.filter(service => {
          const isValid = service && 
            service.service && 
            service.service.trim() !== '' && 
            service.price !== null && 
            service.price !== undefined;
          
          if (!isValid) {
          }
          
          return isValid;
        });
        return validServices;
      })
    );
  }
}
