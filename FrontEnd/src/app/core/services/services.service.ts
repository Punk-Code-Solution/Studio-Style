import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Service {
  id: string;
  service: string;
  additionalComments?: string;
  price: number;
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
}

export interface UpdateServiceRequest {
  id: string;
  service?: string;
  additionalComments?: string;
  price?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  private apiUrl = `${environment.apiUrl}/service`;

  constructor(private http: HttpClient) {}

  getAllServices(): Observable<Service[]> {
    return this.http.post<{result: Service[] | Service}>(this.apiUrl, {
      limit: 100,
      base: 0
    }).pipe(
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
        return services.filter(service => 
          service && 
          service.service && 
          service.service.trim() !== '' && 
          service.price !== null && 
          service.price !== undefined
        );
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
