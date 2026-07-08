import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-bar.html',
  styles: `
    .loading-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      height: 3px;
      background: linear-gradient(90deg, var(--color-emeraldx-500), var(--color-gold-400));
      box-shadow: 0 0 8px var(--color-emeraldx-500), 0 0 4px var(--color-gold-400);
      overflow: hidden;
      animation: loading-fade-in 0.3s ease-out;
    }

    .loading-bar__slider {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.4) 40%,
        rgba(255, 255, 255, 0.6) 50%,
        rgba(255, 255, 255, 0.4) 60%,
        transparent 100%
      );
      animation: loading-slide 1.5s ease-in-out infinite;
    }

    @keyframes loading-slide {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    @keyframes loading-fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
})
export class LoadingBarComponent {
  private readonly loadingService = inject(LoadingService);
  readonly isLoading = this.loadingService.isLoading;
}
