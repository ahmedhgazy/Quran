import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReciterStateService, Reciter } from '../../../core/services/reciter-state.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-reciter-sidebar',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reciter-sidebar.html',
})
export class ReciterSidebarComponent {
  protected readonly state = inject(ReciterStateService);
  protected readonly searchQuery = signal('');

  protected readonly filteredReciters = () => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.state.reciters;
    return this.state.reciters.filter(
      (r) => r.name.toLowerCase().includes(q) || r.arabicName.includes(q),
    );
  };
}
