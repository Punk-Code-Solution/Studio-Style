import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MessageService, Message, MessageRecipient } from '../../core/services/message.service';
import { UserService, User } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div class="page-container">
      <div class="header">
        <div class="header-left">
          <h2>Mensagens</h2>
          <div class="unread-badge" *ngIf="unreadCount > 0">
            {{ unreadCount }} não lida{{ unreadCount > 1 ? 's' : '' }}
          </div>
        </div>

        <div class="header-actions">
          <div class="filters">
            <select [(ngModel)]="selectedFilter" (change)="applyFilters()" class="filter-select">
              <option value="all">Todas as mensagens</option>
              <option value="unread">Não lidas</option>
              <option value="sent">Enviadas</option>
              <option value="received">Recebidas</option>
            </select>
            <select [(ngModel)]="selectedSort" (change)="applyFilters()" class="filter-select">
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
            </select>
          </div>
          <button class="new-message-btn" (click)="showNewMessageForm = true">
            <i class="fas fa-plus"></i>
            Nova Mensagem
          </button>
        </div>
      </div>

      <!-- Formulário de Nova Mensagem -->
      <div class="new-message-form" *ngIf="showNewMessageForm" @fadeIn>
        <div class="form-header">
          <h3>Nova Mensagem</h3>
          <button class="close-btn" (click)="cancelNewMessage()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form (ngSubmit)="onSubmit()" #messageForm="ngForm">
          <div class="form-group">
            <label for="destinatarios">Para</label>
            <div class="recipients-container">
              <div class="selected-recipients" *ngIf="selectedRecipients.length > 0">
                <div class="recipient-tag" *ngFor="let recipientId of selectedRecipients">
                  <span>{{ getRecipientName(recipientId) }}</span>
                  <button type="button" class="remove-recipient" (click)="removeRecipient(recipientId)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <select
                id="destinatarios"
                name="destinatarios"
                [(ngModel)]="selectedRecipients"
                multiple
                required
                #destinatariosInput="ngModel"
                class="form-select"
                (change)="onRecipientsChange()"
              >
                <optgroup *ngFor="let group of recipientGroups" [label]="group.label">
                  <option *ngFor="let user of group.users" [value]="user.id">
                    {{ user.nome }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="error" *ngIf="destinatariosInput.invalid && destinatariosInput.touched">
              Selecione pelo menos um destinatário
            </div>
          </div>

          <div class="form-group">
            <label for="titulo">Assunto</label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              [(ngModel)]="newMessage.titulo"
              required
              #tituloInput="ngModel"
              class="form-input"
              placeholder="Digite o assunto da mensagem"
            >
            <div class="error" *ngIf="tituloInput.invalid && tituloInput.touched">
              Assunto é obrigatório
            </div>
          </div>

          <div class="form-group">
            <label for="conteudo">Mensagem</label>
            <textarea
              id="conteudo"
              name="conteudo"
              [(ngModel)]="newMessage.conteudo"
              required
              rows="6"
              #conteudoInput="ngModel"
              class="form-textarea"
              placeholder="Digite sua mensagem aqui..."
            ></textarea>
            <div class="error" *ngIf="conteudoInput.invalid && conteudoInput.touched">
              Mensagem é obrigatória
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" (click)="cancelNewMessage()">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="submit" class="submit-btn" [disabled]="messageForm.invalid || isLoading">
              <i class="fas" [class.fa-spinner]="isLoading" [class.fa-paper-plane]="!isLoading"></i>
              {{ isLoading ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Lista de Mensagens -->
      <div class="messages-list">
        <div class="message-card" *ngFor="let message of filteredMessages; trackBy: trackByMessageId" @fadeIn [class.unread]="!isMessageRead(message)">
          <div class="message-header">
            <div class="message-title">
              <h3>{{ message.assunto }}</h3>
              <span class="status-badge" *ngIf="!isMessageRead(message)">Não lida</span>
            </div>
            <span class="date">{{ message.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <div class="message-content">
            <p>{{ message.conteudo }}</p>
          </div>
          <div class="message-footer">
            <div class="message-info">
              <p class="author">
                <i class="fas fa-user"></i>
                {{ message.criadoPor.nome }}
              </p>
              <p class="recipients">
                <i class="fas fa-users"></i>
                {{ getRecipientsList(message) }}
              </p>
            </div>
            <div class="message-actions">
              <div class="message-status" *ngIf="isRecipient(message)">
                <button
                  class="mark-read-btn"
                  *ngIf="!isMessageRead(message)"
                  (click)="markAsRead(message.id.toString())"
                >
                  <i class="fas fa-check"></i>
                  Marcar como lida
                </button>
                <button
                  class="reply-btn"
                  (click)="replyToMessage(message)"
                >
                  <i class="fas fa-reply"></i>
                  Responder
                </button>
                <button
                  class="reply-all-btn"
                  (click)="replyToAll(message)"
                >
                  <i class="fas fa-reply-all"></i>
                  Responder a todos
                </button>
              </div>
              <button
                class="delete-btn"
                *ngIf="canDeleteMessage(message)"
                (click)="deleteMessage(message.id.toString())"
              >
                <i class="fas fa-trash"></i>
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginação -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button
          class="page-btn"
          [disabled]="currentPage === 1"
          (click)="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
        <button
          class="page-btn"
          [disabled]="currentPage === totalPages"
          (click)="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    h2 {
      color: #1976d2;
      margin: 0;
    }

    .unread-badge {
      background-color: #e74c3c;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.875rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .filters {
      display: flex;
      gap: 0.5rem;
    }

    .filter-select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
    }

    .new-message-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .new-message-btn:hover {
      background-color: #1565c0;
    }

    .new-message-form {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .form-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 0.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      color: #333;
      font-weight: 500;
    }

    .recipients-container {
      position: relative;
    }

    .selected-recipients {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .recipient-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: #e3f2fd;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .remove-recipient {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 0;
      font-size: 0.875rem;
    }

    .form-select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .error {
      color: #d32f2f;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .submit-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .cancel-btn {
      background-color: #f5f5f5;
      color: #333;
    }

    .submit-btn {
      background-color: #1976d2;
      color: white;
    }

    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem;
      transition: all 0.2s;
    }

    .message-card.unread {
      border-left: 4px solid #1976d2;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .message-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .message-title h3 {
      margin: 0;
      color: #333;
    }

    .status-badge {
      background-color: #1976d2;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
    }

    .date {
      color: #666;
      font-size: 0.875rem;
    }

    .message-content {
      margin-bottom: 1rem;
    }

    .message-content p {
      margin: 0;
      color: #333;
      line-height: 1.5;
    }

    .message-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .message-info {
      display: flex;
      gap: 1rem;
      color: #666;
      font-size: 0.875rem;
    }

    .message-actions {
      display: flex;
      gap: 0.5rem;
    }

    .message-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .mark-read-btn {
      background-color: #4caf50;
      color: white;
    }

    .reply-btn,
    .reply-all-btn {
      background-color: #f5f5f5;
      color: #333;
    }

    .delete-btn {
      background-color: #f44336;
      color: white;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .page-btn {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
      cursor: pointer;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #666;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }

      .filters {
        width: 100%;
      }

      .filter-select {
        flex: 1;
      }

      .new-message-btn {
        width: 100%;
        justify-content: center;
      }

      .message-footer {
        flex-direction: column;
        gap: 1rem;
      }

      .message-info {
        flex-direction: column;
        gap: 0.5rem;
      }

      .message-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('messageForm') messageForm!: NgForm;
  messages: Message[] = [];
  filteredMessages: Message[] = [];
  users: User[] = [];
  showNewMessageForm = false;
  isLoading = false;
  selectedRecipients: string[] = [];
  selectedFilter = 'all';
  selectedSort = 'newest';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  unreadCount = 0;
  private destroy$ = new Subject<void>();

  recipientGroups: { label: string; users: User[] }[] = [];

  newMessage = {
    id: 0,
    titulo: '',
    conteudo: '',
    destinatarios: [] as string[]
  };

  constructor(
    private messageService: MessageService,
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadMessages();
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMessages() {
    this.isLoading = true;
    this.messageService.getMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
      this.messages = messages;
          this.applyFilters();
      this.updateUnreadCount();
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.error('Erro ao carregar mensagens');
          this.isLoading = false;
        }
    });
  }

  loadUsers() {
    this.userService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
      this.users = users;
      this.organizeRecipientGroups();
        },
        error: (error) => {
          this.notificationService.error('Erro ao carregar usuários');
        }
    });
  }

  organizeRecipientGroups() {
    const groups = [
      { label: 'Médicos', users: this.users.filter(u => u.TypeAccount.type === 'medico') },
      { label: 'Enfermeiros', users: this.users.filter(u => u.TypeAccount.type === 'enfermeiro') },
      { label: 'Recepcionistas', users: this.users.filter(u => u.TypeAccount.type === 'recepcionista') },
      { label: 'Administradores', users: this.users.filter(u => u.TypeAccount.type === 'admin') }
    ];

    this.recipientGroups = groups.filter(group => group.users.length > 0);
  }

  getRecipientName(id: string): string {
    const user = this.users.find(u => u.id.toString() === id);
    return user ? user.nome : 'Usuário não encontrado';
  }

  removeRecipient(id: string) {
    this.selectedRecipients = this.selectedRecipients.filter(r => r !== id);
    this.onRecipientsChange();
  }

  onRecipientsChange() {
    this.newMessage.destinatarios = [...this.selectedRecipients];
  }

  updateUnreadCount() {
    this.unreadCount = this.messages.filter(m =>
      this.isRecipient(m) && !this.isMessageRead(m)
    ).length;
  }

  applyFilters() {
    let filtered = [...this.messages];

    // Aplicar filtro
      switch (this.selectedFilter) {
        case 'unread':
        filtered = filtered.filter(m => this.isRecipient(m) && !this.isMessageRead(m));
          break;
        case 'sent':
        filtered = filtered.filter(m => m.criadoPor.id === this.authService.currentUser?.id);
          break;
        case 'received':
        filtered = filtered.filter(m => this.isRecipient(m));
          break;
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      const dateA = new Date(a.dataCriacao).getTime();
      const dateB = new Date(b.dataCriacao).getTime();
      return this.selectedSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    this.filteredMessages = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  onSubmit() {
    if (this.messageForm.invalid) {
      return;
    }

      this.isLoading = true;
    const message = {
      id: this.newMessage.id,
      assunto: this.newMessage.titulo,
      conteudo: this.newMessage.conteudo,
      criadoPor: this.authService.currentUser!,
      destinatarios: [] as MessageRecipient[]
      };

    this.messageService.createMessage(message)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notificationService.success('Mensagem enviada com sucesso');
          this.cancelNewMessage();
          this.loadMessages();
        },
        error: (error: any) => {
          this.notificationService.error('Erro ao enviar mensagem');
          this.isLoading = false;
          }
        });
  }

  cancelNewMessage() {
    this.showNewMessageForm = false;
    this.messageForm.resetForm();
    this.selectedRecipients = [];
    this.newMessage = {
      id: 0,
      titulo: '',
      conteudo: '',
      destinatarios: []
    };
  }

  replyToMessage(message: Message) {
    this.showNewMessageForm = true;
    this.newMessage = {
      id: 0,
      titulo: `Re: ${message.assunto}`,
      conteudo: `\n\n--- Mensagem original ---\n${message.conteudo}`,
      destinatarios: [message.criadoPor.id.toString()]
    };
    this.selectedRecipients = [message.criadoPor.id.toString()];
  }

  replyToAll(message: Message) {
    const recipientIds = message.destinatarios
      .map(d => d.usuario.id)
      .filter(id => id !== this.authService.currentUser?.id);

    this.showNewMessageForm = true;
    this.newMessage = {
      id: 0,
      titulo: `Re: ${message.assunto}`,
      conteudo: `\n\n--- Mensagem original ---\n${message.conteudo}`,
      destinatarios: []
    };
    this.selectedRecipients = recipientIds.map(id => id.toString());
  }

  markAsRead(messageId: string) {
    this.messageService.markAsRead(parseInt(messageId), this.authService.currentUser!.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: () => {
        this.loadMessages();
      },
        error: (error) => {
        this.notificationService.error('Erro ao marcar mensagem como lida');
      }
    });
  }

  deleteMessage(messageId: string) {
    if (confirm('Tem certeza que deseja excluir esta mensagem?')) {
      this.messageService.deleteMessage(parseInt(messageId))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
        next: () => {
          this.notificationService.success('Mensagem excluída com sucesso');
          this.loadMessages();
        },
          error: (error) => {
          this.notificationService.error('Erro ao excluir mensagem');
        }
      });
    }
  }

  getRecipientsList(message: Message): string {
    return message.destinatarios
      .map(d => this.getRecipientName(d.usuario.id.toString()))
      .join(', ');
  }

  isRecipient(message: Message): boolean {
    return message.destinatarios.some(d => d.usuario.id === this.authService.currentUser?.id);
  }

  isMessageRead(message: Message): boolean {
    const recipient = message.destinatarios.find(d => d.usuario.id === this.authService.currentUser?.id);
    return recipient ? recipient.lida : false;
  }

  canDeleteMessage(message: Message): boolean {
    return message.criadoPor.id === this.authService.currentUser?.id;
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id.toString();
  }
}
