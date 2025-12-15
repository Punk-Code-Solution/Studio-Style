import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Service {
  id: string;
  service: string;
  additionalComments?: string;
  price: number;
  // Comissão do colaborador para este serviço (0.0 - 1.0, ex: 0.5 = 50%)
  commission_rate?: number;
  // Duração do serviço em minutos (padrão: 60 minutos)
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateServiceRequest {
  service: string;
  additionalComments?: string;
  price: number;
  commission_rate?: number;
  duration?: number;
}

export interface UpdateServiceRequest {
  id: string;
  service?: string;
  additionalComments?: string;
  price?: number;
  commission_rate?: number;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private apiUrl = `${environment.apiUrl}/service`;

  constructor(private http: HttpClient) {}

  getAllServices(): Observable<Service[]> {
    // Usar GET ao invés de POST para listar serviços
    return this.http.get<{result: Service[] | Service}>(`${this.apiUrl}?limit=100&base=0`).pipe(
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
        // Tornar o filtro menos restritivo para debug
        const validServices = services.filter(service => {
          const isValid = service && 
            service.service && 
            typeof service.service === 'string' &&
            service.service.trim() !== '' && 
            service.price !== null && 
            service.price !== undefined &&
            !isNaN(Number(service.price));
          
          if (!isValid && service) {
            console.warn('Service filtered out:', service);
          }
          
          return isValid;
        });
        return validServices;
      }),
      catchError(error => {
        console.error('Error in getAllServices:', error);
        console.error('Error response:', error.error);
        return throwError(() => error);
      })
    );
  }

  getServiceById(id: string): Observable<Service> {
    return this.http.get<{result: Service}>(`${this.apiUrl}/one?id=${id}`).pipe(
      map(response => response.result)
    );
  }

  createService(service: CreateServiceRequest): Observable<Service> {
    return this.http.post<{result: Service}>(this.apiUrl, service).pipe(
      map(response => response.result)
    );
  }

  updateService(service: UpdateServiceRequest): Observable<Service> {
    return this.http.put<{result: Service}>(this.apiUrl, service).pipe(
      map(response => response.result)
    );
  }

  deleteService(id: string): Observable<void> {
    return this.http.delete<{result: void}>(`${this.apiUrl}?id=${id}`).pipe(
      map(response => response.result)
    );
  }
}
