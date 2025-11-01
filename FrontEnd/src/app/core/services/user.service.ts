import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

export interface User {
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
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/account`;

  private users: User[] = [];
  private usersSubject = new BehaviorSubject<User[]>(this.users);
  users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Buscar todos os usuários
  getUsers(): Observable<User[]> {
    return this.http.get<{data: User[]}>(this.apiUrl).pipe(
      map(response => {
        const users = response.data || [];
        this.users = users;
        this.usersSubject.next(this.users);
        return users;
      })
    );
  }

  // Buscar usuário por ID
  getUserById(id: string): Observable<User | undefined> {
    return this.http.get<{result: User}>(`${this.apiUrl}/one?id=${id}`).pipe(
      map(response => {
        return response.result;
      })
    );
  }

  // Buscar usuários por tipo de conta
  getUsersByRole(role: string): Observable<User[]> {
    return this.getUsers().pipe(
      map(users => users.filter(user => user.TypeAccount.type === role))
    );
  }

  // Buscar usuários ativos (não deletados)
  getActiveUsers(): Observable<User[]> {
    return this.getUsers().pipe(
      map(users => users.filter(user => !user.deleted))
    );
  }

  // Criar novo usuário
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
    const validation = this.validateUser(user);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join('\n');
      return throwError(() => new Error(errorMessage));
    }

    return this.http.post<{result: User}>(this.apiUrl, user).pipe(
      map(response => {
        this.users = [...this.users, response.result];
        this.usersSubject.next(this.users);
        return response.result;
      })
    );
  }

  // Atualizar usuário
  updateUser(id: string, user: Partial<User>): Observable<User> {
    const validation = this.validateUser(user);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join('\n');
      return throwError(() => new Error(errorMessage));
    }

    return this.http.put<{result: User}>(this.apiUrl, { id, ...user }).pipe(
      map(response => {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
          this.users[index] = response.result;
          this.usersSubject.next(this.users);
        }
        return response.result;
      })
    );
  }

  // Deletar usuário (soft delete)
  deleteUser(id: string): Observable<void> {
    return this.http.delete<{result: void}>(`${this.apiUrl}?id=${id}`).pipe(
      map(response => {
        this.users = this.users.filter(u => u.id !== id);
        this.usersSubject.next(this.users);
        return response.result;
      })
    );
  }

  validateUser(user: Partial<User>): ValidationResult {
    const errors: string[] = [];

    if (!user.name) {
      errors.push('Nome é obrigatório');
    }

    if (!user.lastname) {
      errors.push('Sobrenome é obrigatório');
    }

    if (!user.cpf) {
      errors.push('CPF é obrigatório');
    } else if (!this.isValidCPF(user.cpf)) {
      errors.push('CPF inválido');
    }

    if (!user.typeaccount_id) {
      errors.push('Tipo de conta é obrigatório');
    }

    // Validar se há pelo menos um email
    if (!user.Emails || user.Emails.length === 0) {
      errors.push('Pelo menos um email é obrigatório');
    } else {
      // Validar emails
      user.Emails.forEach((email, index) => {
        if (!email.email) {
          errors.push(`Email ${index + 1} é obrigatório`);
        } else if (!this.isValidEmail(email.email)) {
          errors.push(`Email ${index + 1} é inválido`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  private isEmailUnique(email: string, excludeId?: string): boolean {
    return !this.users.some(user =>
      user.Emails.some(e => e.email === email) && (!excludeId || user.id !== excludeId)
    );
  }

  // Buscar usuários por nome, sobrenome ou email
  searchUsers(query: string): Observable<User[]> {
    const searchTerm = query.toLowerCase();
    return this.getUsers().pipe(
      map(users => users.filter(user => {
        const fullName = `${user.name} ${user.lastname}`.toLowerCase();
        const hasEmailMatch = user.Emails.some(email => 
          email.email.toLowerCase().includes(searchTerm)
        );
        return fullName.includes(searchTerm) || hasEmailMatch;
      }))
    );
  }

  // Alternar status do usuário (soft delete)
  toggleUserStatus(id: string): Observable<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      return throwError(() => new Error('Usuário não encontrado'));
    }

    const updatedUser = {
      ...user,
      deleted: user.deleted ? null : new Date().toISOString()
    };

    return this.updateUser(id, { deleted: updatedUser.deleted || undefined });
  }

  // Buscar usuários por tipo de conta específico
  getUsersByTypeAccount(typeAccountId: string): Observable<User[]> {
    return this.getUsers().pipe(
      map(users => users.filter(user => user.typeaccount_id === typeAccountId))
    );
  }

  // Buscar usuários por empresa
  getUsersByCompany(companyId: string): Observable<User[]> {
    return this.getUsers().pipe(
      map(users => users.filter(user => user.company_id_account === companyId))
    );
  }

  // Método para obter o email principal do usuário
  getPrimaryEmail(user: User): string {
    const activeEmail = user.Emails.find(email => email.active);
    return activeEmail ? activeEmail.email : (user.Emails[0]?.email || '');
  }

  // Método para obter o nome completo do usuário
  getFullName(user: User): string {
    return `${user.name} ${user.lastname}`;
  }
}
