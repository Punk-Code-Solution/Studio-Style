import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container" role="alert" aria-live="polite">
      <div *ngFor="let notification of notifications" 
           class="notification" 
           [class]="notification.type"
           [@fadeInOut]>
        <div class="notification-content">
          <span class="notification-icon">
            <i class="fas" [class]="'fa-' + (notification.icon || getDefaultIcon(notification.type))" aria-hidden="true"></i>
          </span>
          <div class="notification-text">
            <h4 *ngIf="notification.title" class="notification-title">{{ notification.title }}</h4>
            <p class="notification-message">{{ notification.message }}</p>
          </div>
        </div>
        <button 
          class="notification-close" 
          (click)="removeNotification(notification.id)"
          aria-label="Fechar notificação"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
    }

    .notification {
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      animation: slideIn 0.3s ease-out;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
    }

    .notification-content {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      flex: 1;
    }

    .notification-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .notification-text {
      flex: 1;
    }

    .notification-title {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .notification-message {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .notification-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 0.25rem;
      opacity: 0.7;
      transition: opacity 0.2s;
      flex-shrink: 0;

      &:hover {
        opacity: 1;
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
      }
    }

    .success {
      background-color: rgba(46, 204, 113, 0.95);
      color: white;
    }

    .error {
      background-color: rgba(231, 76, 60, 0.95);
      color: white;
    }

    .info {
      background-color: rgba(52, 152, 219, 0.95);
      color: white;
    }

    .warning {
      background-color: rgba(241, 196, 15, 0.95);
      color: #2c3e50;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription;

  constructor(private notificationService: NotificationService) {
    this.subscription = this.notificationService.getNotifications().subscribe(
      (notifications: Notification[]) => {
        this.notifications = notifications;
      }
    );
  }

  ngOnInit() {}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  removeNotification(id: number): void {
    this.notificationService.remove(id);
  }

  getDefaultIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'exclamation-circle';
      case 'info':
        return 'info-circle';
      case 'warning':
        return 'exclamation-triangle';
      default:
        return 'info-circle';
    }
  }
} 