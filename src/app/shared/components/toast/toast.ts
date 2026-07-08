import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../../core/services/toast.service';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.html',
  styles: [
    `
      .toast-card {
        animation: toast-slide-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
      }
      .toast-progress-bar {
        animation: toast-progress-shrink linear forwards;
      }
      @keyframes toast-slide-in {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes toast-progress-shrink {
        from {
          transform: scaleX(1);
        }
        to {
          transform: scaleX(0);
        }
      }
    `,
  ],
})
export class ToastComponent {
  protected readonly toastService = inject(ToastService);

  private readonly borderColors: Record<ToastType, string> = {
    success: 'var(--color-emeraldx-500)',
    error: '#ef4444',
    warning: 'var(--color-gold-500)',
    info: '#3b82f6',
  };

  protected borderColor(type: ToastType): string {
    return this.borderColors[type];
  }

  protected icon(type: ToastType): string {
    return ICONS[type];
  }
}
