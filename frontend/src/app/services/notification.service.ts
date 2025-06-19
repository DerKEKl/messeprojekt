import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private activeTimeouts = new Map<string, number>();

  constructor() {
  }

  private addNotification(notification: Omit<AppNotification, 'id' | 'timestamp'>): void {
    const newNotification: AppNotification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date()
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    // Auto-remove nach der angegebenen Dauer
    if (notification.duration && notification.duration > 0) {
      const timeoutId = setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, notification.duration);

      // @ts-ignore
      this.activeTimeouts.set(newNotification.id, timeoutId);
    }
  }

  success(title: string, message: string, duration: number = 5000): void {
    this.addNotification({title, message, type: 'success', duration});
  }

  error(title: string, message: string, duration: number = 8000): void {
    this.addNotification({title, message, type: 'error', duration});
  }

  warning(title: string, message: string, duration: number = 6000): void {
    this.addNotification({title, message, type: 'warning', duration});
  }

  info(title: string, message: string, duration: number = 5000): void {
    this.addNotification({title, message, type: 'info', duration});
  }

  removeNotification(id: string): void {
    try {
      const currentNotifications = this.notificationsSubject.value;
      const initialLength = currentNotifications.length;
      const updatedNotifications = currentNotifications.filter(n => n.id !== id);

      if (updatedNotifications.length < initialLength) {
        this.notificationsSubject.next(updatedNotifications);
      }
    } catch (error) {
      this.clear();
      console.error('Error removing notification:', error);
    }
  }

  clear(): void {
    this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.activeTimeouts.clear();

    this.notificationsSubject.next([]);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
