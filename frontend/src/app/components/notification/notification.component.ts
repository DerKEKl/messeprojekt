import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {AppNotification, NotificationService} from '../../services/notification.service';
import {Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: `./notification.component.html`,
  styleUrl: `./notification.component.css`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    // Animation kann hier hinzugefügt werden
  ]
})
export class NotificationComponent implements OnDestroy {
  notifications: AppNotification[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.cdr.markForCheck(); // Manuelle Änderungserkennung
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByNotificationId(index: number, notification: AppNotification): string {
    return notification.id;
  }

  getNotificationClasses(notification: AppNotification): string {
    const baseClasses = 'notification';
    return `${baseClasses} notification-${notification.type}`;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'check';
      case 'error':
        return 'exclamation';
      case 'warning':
        return 'exclamation';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }

  getIconClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-200';
      case 'error':
        return 'text-red-200';
      case 'warning':
        return 'text-yellow-200';
      case 'info':
        return 'text-blue-200';
      default:
        return 'text-gray-200';
    }
  }

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }
}
