import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
// MOCK_EMPLOYEES removido

// Interface para a resposta padrão da API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TypeAccount {
  id: string;
  type: 'admin' | 'provider' | 'client' | 'ninguem';
  edit: boolean;
  creat: boolean;
  viwer: boolean;
  delet: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Email {
  id: string;
  name: string;
  email: string;
  active: string;
  account_id_email: string;
  company_id_email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
    id: string;
    name: string;
    lastname: string;
    password: string;
    cpf: string;
    start_date: string;
    birthday?: string;
    deleted?: string;
    avatar?: string;
    typeaccount_id: string;
    company_id_account?: string;
    type_hair_id?: string;
    createdAt: string;
    updatedAt: string;
    TypeAccount: TypeAccount;
    Company?: any;
    Emails: Email[];
    Hair?: any;
    Schedules: any[];
    Sales: any[];
    Purchases: any[];
    Purchase_Materials: any[];
    Phones: any[];
    Adress?: any;
    // Propriedades adicionais para compatibilidade com o template
    email?: string;
    role?: 'enfermeiro' | 'recepcionista' | 'administrativo' | 'admin' | 'provider';
    phone?: string;
    address?: string;
    status?: 'active' | 'inactive' | 'on_leave';
    department?: string;
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