import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  icon?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private nextId = 1;

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  success(message: string, title?: string, duration: number = 3000) {
    this.show({
      type: 'success',
      message,
      title,
      duration,
      icon: 'check-circle'
    });
  }

  error(message: string, title?: string, duration: number = 5000) {
    this.show({
      type: 'error',
      message,
      title,
      duration,
      icon: 'exclamation-circle'
    });
  }

  info(message: string, title?: string, duration: number = 3000) {
    this.show({
      type: 'info',
      message,
      title,
      duration,
      icon: 'info-circle'
    });
  }

  warning(message: string, title?: string, duration: number = 4000) {
    this.show({
      type: 'warning',
      message,
      title,
      duration,
      icon: 'exclamation-triangle'
    });
  }

  private show(notification: Omit<Notification, 'id'>) {
    const id = this.nextId++;
    const newNotification = { ...notification, id };
    const currentNotifications = this.notifications.value;
    this.notifications.next([...currentNotifications, newNotification]);

    if (notification.duration) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }
  }

  remove(id: number) {
    const currentNotifications = this.notifications.value;
    this.notifications.next(currentNotifications.filter(n => n.id !== id));
  }
} 