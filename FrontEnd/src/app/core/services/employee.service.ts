import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MOCK_EMPLOYEES } from '../mocks/employee.mock';
import { delay } from 'rxjs/operators';

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: 'medico' | 'enfermeiro' | 'recepcionista' | 'administrativo';
  department: 'clinica' | 'pediatria' | 'cardiologia' | 'neurologia' | 'ortopedia' | 'administrativo';
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'on_leave';
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employees`;
  private employees = [...MOCK_EMPLOYEES];

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    // Simulate network delay
    return of([...MOCK_EMPLOYEES]).pipe(delay(500));
  }

  getEmployeeById(id: number): Observable<Employee> {
    const employee = MOCK_EMPLOYEES.find(emp => emp.id === id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    return of({ ...employee }).pipe(delay(300));
  }

  createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Observable<Employee> {
    const newEmployee: Employee = {
      ...employee,
      id: Math.max(...MOCK_EMPLOYEES.map(emp => emp.id)) + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    MOCK_EMPLOYEES.push(newEmployee);
    return of({ ...newEmployee }).pipe(delay(500));
  }

  updateEmployee(id: number, employee: Partial<Employee>): Observable<Employee> {
    const index = MOCK_EMPLOYEES.findIndex(emp => emp.id === id);
    if (index === -1) {
      throw new Error('Employee not found');
    }
    const updatedEmployee = {
      ...MOCK_EMPLOYEES[index],
      ...employee,
      updatedAt: new Date().toISOString()
    };
    MOCK_EMPLOYEES[index] = updatedEmployee;
    return of({ ...updatedEmployee }).pipe(delay(500));
  }

  deleteEmployee(id: number): Observable<void> {
    const index = MOCK_EMPLOYEES.findIndex(emp => emp.id === id);
    if (index === -1) {
      throw new Error('Employee not found');
    }
    MOCK_EMPLOYEES.splice(index, 1);
    return of(void 0).pipe(delay(500));
  }
} 