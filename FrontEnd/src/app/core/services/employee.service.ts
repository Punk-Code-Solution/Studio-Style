import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';
// MOCK_EMPLOYEES removido

// Interface para a resposta padrão da API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Employee {
  id: string; // ID agora é string (UUID)
  name: string;
  lastname: string; // Adicionado
  email: string;
  role: 'medico' | 'enfermeiro' | 'recepcionista' | 'administrativo' | 'admin' | 'provider'; // Tipos de role atualizados
  department?: string; // Departamento é opcional
  phone?: string; // Phone é opcional
  address?: string; // Address é opcional
  status: 'active' | 'inactive' | 'on_leave' | boolean; // Status pode ser booleano (deleted)
  createdAt: string;
  updatedAt: string;
  TypeAccount: { // Incluído para refletir o modelo real
    type: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/account`;
  // MOCK_EMPLOYEES removido

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    // MODIFICADO: Chama a API real filtrando por roles
    return this.http.get<ApiResponse<Employee[]>>(`${this.apiUrl}?role=provider,admin`).pipe(
      map(response => response.data || [])
    );
  }

  getEmployeeById(id: number | string): Observable<Employee> {
    // MODIFICADO: Chama a API real
    return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/id?id=${id}`).pipe(
      map(response => response.data)
    );
  }

  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    // MODIFICADO: Chama a API real
    return this.http.post<ApiResponse<Employee>>(this.apiUrl, employee).pipe(
      map(response => response.data)
    );
  }

  updateEmployee(id: number | string, employee: Partial<Employee>): Observable<Employee> {
    // MODIFICADO: Chama a API real
    return this.http.put<ApiResponse<Employee>>(`${this.apiUrl}/id`, { id, ...employee }).pipe(
      map(response => response.data)
    );
  }

  deleteEmployee(id: number | string): Observable<void> {
    // MODIFICADO: Chama a API real
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/id?id=${id}`).pipe(
      map(response => response.data)
    );
  }
}