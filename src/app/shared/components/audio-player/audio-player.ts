import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { AudioPlayerService } from '../../../core/services/audio-player.service';

@Component({
  selector: 'app-audio-player',
  templateUrl: './audio-player.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioPlayerComponent {
  protected readonly player = inject(AudioPlayerService);
  protected readonly speed = signal(1.0);

  private readonly speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  protected cycleSpeed(): void {
    const idx = this.speeds.indexOf(this.speed());
    const next = this.speeds[(idx + 1) % this.speeds.length];
    this.speed.set(next);
    this.player.setSpeed(next);
  }

  protected onSeek(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();

    if (rect.width <= 0) return;

    const percent = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    this.player.seek(percent);
  }
}
