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
  type: 'admin' | 'provider' | 'client';
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
    role?: 'admin' | 'provider';
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
      map(response => {
        const employees = response.data || [];
        return employees.map(emp => this.mapEmployee(emp));
      })
    );
  }

  getEmployeeById(id: number | string): Observable<Employee> {
    // MODIFICADO: Chama a API real
    return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/id?id=${id}`).pipe(
      map(response => this.mapEmployee(response.data))
    );
  }

  private mapEmployee(emp: Employee): Employee {
    // Mapear email da array Emails para propriedade email
    if (emp.Emails && emp.Emails.length > 0) {
      emp.email = emp.Emails[0].email;
    }
    
    // Mapear telefone da array Phones para propriedade phone
    if (emp.Phones && emp.Phones.length > 0) {
      const phoneObj = emp.Phones[0];
      
      // Se phoneObj já é uma string, usar diretamente
      if (typeof phoneObj === 'string') {
        emp.phone = phoneObj;
      } 
      // Se phoneObj é um objeto com propriedades phone e ddd
      else if (phoneObj && typeof phoneObj === 'object') {
        // Como Phones é any[], precisamos fazer type assertion ou verificar propriedades
        const phoneNumber = (phoneObj as any).phone;
        const ddd = (phoneObj as any).ddd;
        
        if (ddd && phoneNumber) {
          emp.phone = `(${ddd}) ${phoneNumber}`;
        } else if (phoneNumber) {
          emp.phone = String(phoneNumber);
        }
      }
    }
    
    // Mapear endereço de Adress para address
    if (emp.Adress) {
      emp.address = emp.Adress;
    }
    
    // Mapear role do TypeAccount
    if (emp.TypeAccount && emp.TypeAccount.type) {
      emp.role = emp.TypeAccount.type as any;
    }
    
    // Normalizar flag deleted (pode vir como boolean, string ou null)
    const rawDeleted = (emp as any).deleted;
    const isDeleted =
      rawDeleted === true ||
      rawDeleted === 1 ||
      rawDeleted === '1' ||
      rawDeleted === 'true' ||
      (typeof rawDeleted === 'string' &&
        rawDeleted.length > 0 &&
        rawDeleted !== 'false' &&
        rawDeleted !== '0');

    // Mantenha deleted como boolean padronizado para facilitar o consumo
    emp.deleted = isDeleted ? 'true' : 'false';
    
    // Mapear status a partir de deleted (permite extender para outros estados futuramente)
    emp.status = isDeleted ? 'inactive' : 'active';
    
    return emp;
  }

  createEmployee(employee: Partial<Employee>): Observable<Employee> {
    // MODIFICADO: Chama a API real
    return this.http.post<ApiResponse<Employee>>(this.apiUrl, employee).pipe(
      map(response => this.mapEmployee(response.data))
    );
  }

  updateEmployee(id: number | string, employee: Partial<Employee>): Observable<Employee> {
    // MODIFICADO: Chama a API real
    return this.http.put<ApiResponse<Employee>>(`${this.apiUrl}/id`, { id, ...employee }).pipe(
      map(response => this.mapEmployee(response.data))
    );
  }

  deleteEmployee(id: number | string): Observable<void> {
    // MODIFICADO: Chama a API real
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/id?id=${id}`).pipe(
      map(response => response.data)
    );
  }
}