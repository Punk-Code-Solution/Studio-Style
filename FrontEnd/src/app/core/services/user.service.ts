import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface User {
  TypeAccount: {
    type:
      | 'admin'
      | 'ninguem';
  };
  id: number;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
  crm?: string;
  senha: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private users: User[] = [];


  private usersSubject = new BehaviorSubject<User[]>(this.users);
  users$ = this.usersSubject.asObservable();

  constructor() {}

  authenticate(email: string, senha: string): User | null {
    const user = this.users.find(u => u.email === email && u.senha === senha);
    return user || null;
  }

  getUsers(): Observable<User[]> {
    return of(this.users).pipe(delay(500));
  }

  getUserById(id: number): Observable<User | undefined> {
    const user = this.users.find(u => u.id === id);
    return of(user).pipe(delay(300));
  }

  createUser(user: Omit<User, 'id'>): Observable<User> {
    const validation = this.validateUser(user);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join('\n');
      return throwError(() => new Error(errorMessage));
    }

    const newUser: User = {
      ...user,
      id: Math.max(...this.users.map(u => u.id)) + 1
    };
    this.users = [...this.users, newUser];
    return of(newUser).pipe(delay(500));
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return throwError(() => new Error('User not found'));
    }

    const validation = this.validateUser(user);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join('\n');
      return throwError(() => new Error(errorMessage));
    }

    this.users[index] = { ...this.users[index], ...user };
    return of(this.users[index]).pipe(delay(500));
  }

  deleteUser(id: number): Observable<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return throwError(() => new Error('User not found'));
    }
    this.users = this.users.filter(u => u.id !== id);
    return of(void 0).pipe(delay(500));
  }

  validateUser(user: Partial<User>): ValidationResult {
    const errors: string[] = [];

    if (!user.nome) {
      errors.push('Nome é obrigatório');
    }

    if (!user.email) {
      errors.push('Email é obrigatório');
    } else if (!this.isValidEmail(user.email)) {
      errors.push('Email inválido');
    }

    if (!user.telefone) {
      errors.push('Telefone é obrigatório');
    } else if (!this.isValidPhone(user.telefone)) {
      errors.push('Telefone inválido');
    }

    if (!user.TypeAccount || !user.TypeAccount.type) {
      errors.push('Perfil é obrigatório');
    }

    if (!user.TypeAccount || !user.TypeAccount.type || user.TypeAccount.type === 'admin' && !user.crm) {
      errors.push('CRM é obrigatório para médicos');
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

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    return phoneRegex.test(phone);
  }

  private isEmailUnique(email: string, excludeId?: number): boolean {
    return !this.users.some(user =>
      user.email === email && (!excludeId || user.id !== excludeId)
    );
  }

  addUser(user: Omit<User, 'id'>): Observable<User> {
    const validation = this.validateUser(user);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join('\n');
      return throwError(() => new Error(errorMessage));
    }

    if (!this.isEmailUnique(user.email)) {
      return throwError(() => new Error('Email já cadastrado'));
    }

    const newUser = {
      ...user,
      id: Math.max(...this.users.map(u => u.id)) + 1
    };

    this.users = [...this.users, newUser];
    this.usersSubject.next(this.users);

    return of(newUser).pipe(delay(500));
  }

  toggleUserStatus(id: number): Observable<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return throwError(() => new Error('Usuário não encontrado'));
    }

    const updatedUser = {
      ...this.users[index],
      ativo: !this.users[index].ativo
    };

    this.users[index] = updatedUser;
    this.users = [...this.users];
    this.usersSubject.next(this.users);

    return of(updatedUser).pipe(delay(500));
  }

  getUsersByRole(role: User['TypeAccount']): Observable<User[]> {
    const filteredUsers = this.users.filter(u => u.TypeAccount.type === role.type);
    return of(filteredUsers).pipe(delay(500));
  }

  getActiveUsers(): Observable<User[]> {
    const activeUsers = this.users.filter(u => u.ativo);
    return of(activeUsers).pipe(delay(500));
  }

  searchUsers(query: string): Observable<User[]> {
    const searchTerm = query.toLowerCase();
    const filteredUsers = this.users.filter(user =>
      user.nome.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.telefone.includes(searchTerm)
    );
    return of(filteredUsers).pipe(delay(500));
  }
}
