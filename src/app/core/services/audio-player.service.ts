import { Injectable, signal, computed, NgZone, inject } from '@angular/core';

export interface AudioTrack {
  title: string;
  reciter: string;
  audioUrl: string;
  surahNumber: number;
  ayahNumber?: number;
}

@Injectable({ providedIn: 'root' })
export class AudioPlayerService {
  private readonly zone = inject(NgZone);
  private audio: HTMLAudioElement | null = null;

  private readonly _currentTrack = signal<AudioTrack | null>(null);
  private readonly _isPlaying = signal(false);
  private readonly _currentTime = signal(0);
  private readonly _duration = signal(0);
  private readonly _error = signal<string | null>(null);

  readonly currentTrack = this._currentTrack.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly currentTime = this._currentTime.asReadonly();
  readonly duration = this._duration.asReadonly();
  readonly error = this._error.asReadonly();
  readonly progress = computed(() => {
    const d = this._duration();
    return d > 0 ? (this._currentTime() / d) * 100 : 0;
  });

  readonly formattedTime = computed(() => this.formatTime(this._currentTime()));
  readonly formattedDuration = computed(() => this.formatTime(this._duration()));

  private playlist: AudioTrack[] = [];
  private currentTrackIndex = -1;

  play(track: AudioTrack): void {
    this.playlist = [];
    this.currentTrackIndex = -1;
    this.playTrack(track);
  }

  playPlaylist(tracks: AudioTrack[], startIndex = 0): void {
    if (!tracks || tracks.length === 0) return;
    this.playlist = tracks;
    this.currentTrackIndex = startIndex;
    this.playTrack(tracks[startIndex]);
  }

  private playTrack(track: AudioTrack): void {
    this.cleanup();

    this.audio = new Audio();
    this.audio.preload = 'auto';

    this._currentTrack.set(track);
    this._currentTime.set(0);
    this._duration.set(0);
    this._error.set(null);

    this.audio.addEventListener('timeupdate', this.onTimeUpdate);
    this.audio.addEventListener('ended', this.onEnded);
    this.audio.addEventListener('loadedmetadata', this.onLoaded);
    this.audio.addEventListener('canplay', this.onCanPlay);
    this.audio.addEventListener('error', this.onError);

    this.audio.src = track.audioUrl;
    this.audio.load();
  }

  togglePlayPause(): void {
    if (!this.audio) return;
    if (this.audio.paused) {
      this.audio
        .play()
        .then(() => this._isPlaying.set(true))
        .catch((e) => console.error('Play failed:', e));
    } else {
      this.audio.pause();
      this._isPlaying.set(false);
    }
  }

  seek(percent: number): void {
    if (!this.audio || !this._duration()) return;
    this.audio.currentTime = (percent / 100) * this._duration();
  }

  setSpeed(rate: number): void {
    if (this.audio) this.audio.playbackRate = rate;
  }

  stop(): void {
    this.cleanup();
    this._currentTrack.set(null);
    this._currentTime.set(0);
    this._duration.set(0);
  }

  private cleanup(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeEventListener('timeupdate', this.onTimeUpdate);
      this.audio.removeEventListener('ended', this.onEnded);
      this.audio.removeEventListener('loadedmetadata', this.onLoaded);
      this.audio.removeEventListener('canplay', this.onCanPlay);
      this.audio.removeEventListener('error', this.onError);
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
    }
    this._isPlaying.set(false);
  }

  private readonly onTimeUpdate = (): void => {
    this.zone.run(() => this._currentTime.set(this.audio?.currentTime ?? 0));
  };

  private readonly onLoaded = (): void => {
    this.zone.run(() => this._duration.set(this.audio?.duration ?? 0));
  };

  private readonly onCanPlay = (): void => {
    if (!this.audio) return;
    this.audio
      .play()
      .then(() => this.zone.run(() => this._isPlaying.set(true)))
      .catch((e) => console.error('Autoplay blocked:', e));
  };

  private readonly onEnded = (): void => {
    this.zone.run(() => {
      if (
        this.playlist.length > 0 &&
        this.currentTrackIndex !== -1 &&
        this.currentTrackIndex + 1 < this.playlist.length
      ) {
        this.currentTrackIndex++;
        this.playTrack(this.playlist[this.currentTrackIndex]);
      } else {
        this._isPlaying.set(false);
      }
    });
  };

  private readonly onError = (): void => {
    const code = this.audio?.error?.code;
    const msg = this.audio?.error?.message ?? 'Unknown audio error';
    console.error(`Audio error [code=${code}]: ${msg}`, 'URL:', this.audio?.src);
    this.zone.run(() => {
      this._isPlaying.set(false);
      this._error.set(msg);
    });
  };

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
