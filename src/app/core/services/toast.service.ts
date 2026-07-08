import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
  createdAt: number;
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 5000,
  info: 5000,
  error: 7000,
  warning: 7000,
};

const DEFAULT_TITLES: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

const MAX_TOASTS = 5;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  readonly toasts = this._toasts.asReadonly();

  show(type: ToastType, title: string, message: string, duration?: number): string {
    const resolvedDuration = duration ?? DEFAULT_DURATIONS[type];
    const id = crypto.randomUUID();

    const toast: Toast = {
      id,
      type,
      title,
      message,
      duration: resolvedDuration,
      createdAt: Date.now(),
    };

    this._toasts.update(current => {
      const next = [...current, toast];
      while (next.length > MAX_TOASTS) {
        const removed = next.shift()!;
        this.clearTimer(removed.id);
      }
      return next;
    });

    if (resolvedDuration > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), resolvedDuration),
      );
    }

    return id;
  }

  success(message: string, title?: string): string {
    return this.show('success', title ?? DEFAULT_TITLES.success, message);
  }

  error(message: string, title?: string): string {
    return this.show('error', title ?? DEFAULT_TITLES.error, message);
  }

  warning(message: string, title?: string): string {
    return this.show('warning', title ?? DEFAULT_TITLES.warning, message);
  }

  info(message: string, title?: string): string {
    return this.show('info', title ?? DEFAULT_TITLES.info, message);
  }

  dismiss(id: string): void {
    this.clearTimer(id);
    this._toasts.update(current => current.filter(t => t.id !== id));
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
