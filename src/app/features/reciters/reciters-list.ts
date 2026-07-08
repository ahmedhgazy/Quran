import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/services/api.service';
import { ReciterDto } from '../../core/models/api.models';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-reciters-list',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reciters-list.html',
})
export class RecitersListPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly reciters = signal<ReciterDto[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.api
      .getReciters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => {
        this.reciters.set(list);
        this.loading.set(false);
      });
  }
}
