import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User, UserService } from './user.service';
import { AuthService, UserRole } from './auth.service';

export interface MessageRecipient {
  usuario: User;
  lida: boolean;
}

export interface Message {
  id: number;
  assunto: string;
  conteudo: string;
  criadoPor: User;
  destinatarios: MessageRecipient[];
  dataCriacao: string;
  dataLeitura?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messages: Message[] = [ ];

  private messagesSubject = new BehaviorSubject<Message[]>(this.messages);
  messages$ = this.messagesSubject.asObservable();

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  getMessages(): Observable<Message[]> {
    return of(this.messages).pipe(delay(500));
  }

  getMessageById(id: number): Observable<Message | undefined> {
    const message = this.messages.find(m => m.id === id);
    return of(message).pipe(delay(300));
  }

  getUnreadMessages(userId: number): Observable<Message[]> {
    const unreadMessages = this.messages.filter(message => {
      const recipient = message.destinatarios.find(r => r.usuario.id === userId.toString());
      return recipient && !recipient.lida;
    });
    return of(unreadMessages).pipe(delay(300));
  }

  createMessage(message: Omit<Message, 'id' | 'dataCriacao'>): Observable<Message> {
    const newMessage: Message = {
      ...message,
      id: Math.max(...this.messages.map(m => m.id)) + 1,
      dataCriacao: new Date().toISOString()
    };

    this.messages = [...this.messages, newMessage];
    this.messagesSubject.next(this.messages);

    return of(newMessage).pipe(delay(500));
  }

  markAsRead(messageId: number, userId: number): Observable<Message> {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const recipient = message.destinatarios.find(r => r.usuario.id === userId.toString());
    if (recipient) {
      recipient.lida = true;
      message.dataLeitura = new Date().toISOString();
    }

    this.messages = [...this.messages];
    this.messagesSubject.next(this.messages);

    return of(message).pipe(delay(300));
  }

  deleteMessage(id: number): Observable<void> {
    this.messages = this.messages.filter(m => m.id !== id);
    this.messagesSubject.next(this.messages);
    return of(void 0).pipe(delay(300));
  }

  getMessagesByUser(userId: number): Observable<Message[]> {
    const userMessages = this.messages.filter(
      message => message.criadoPor.id === userId.toString() ||
                message.destinatarios.some(r => r.usuario.id === userId.toString())
    );
    return of(userMessages).pipe(delay(300));
  }

  getMessagesByRole(role: UserRole): Observable<Message[]> {
    const roleMessages = this.messages.filter(
      (message) =>
        message.criadoPor.TypeAccount.type === role ||
        message.destinatarios.some((r) => r.usuario.TypeAccount.type === role)
    );
    return of(roleMessages).pipe(delay(300));
  }
}
