import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { SurahSummary, JuzDto } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class NavigationSidebarService {
  private readonly api = inject(ApiService);

  private readonly _sidebarOpen = signal(false);
  readonly sidebarOpen = this._sidebarOpen.asReadonly();

  readonly surahs = signal<SurahSummary[]>([]);
  readonly juzs = signal<JuzDto[]>([]);
  readonly loading = signal(false);
  private initialized = false;

  toggleSidebar(): void {
    const nextState = !this._sidebarOpen();
    this._sidebarOpen.set(nextState);
    if (nextState) {
      this.loadData();
    }
  }

  openSidebar(): void {
    this._sidebarOpen.set(true);
    this.loadData();
  }

  closeSidebar(): void {
    this._sidebarOpen.set(false);
  }

  private loadData(): void {
    if (this.initialized) return;
    this.loading.set(true);

    this.api.getSurahs({ page: 1, pageSize: 114 }).subscribe({
      next: (res) => {
        this.surahs.set(res.items);
        this.checkInitialized();
      },
      error: () => this.loading.set(false)
    });

    this.api.getJuzs({ page: 1, pageSize: 30 }).subscribe({
      next: (res) => {
        this.juzs.set(res.items);
        this.checkInitialized();
      },
      error: () => this.loading.set(false)
    });
  }

  private checkInitialized(): void {
    if (this.surahs().length > 0 && this.juzs().length > 0) {
      this.initialized = true;
      this.loading.set(false);
    }
  }
}
