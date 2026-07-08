import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { BookmarkDto, LastReadDto, BookmarkTagDto } from '../../core/models/api.models';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bookmarks',
  imports: [RouterLink, TranslatePipe, FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bookmarks.html',
})
export class BookmarksPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly bookmarks = signal<BookmarkDto[]>([]);
  protected readonly tags = signal<BookmarkTagDto[]>([]);
  protected readonly lastRead = signal<LastReadDto | null>(null);
  protected readonly loading = signal(true);

  protected readonly selectedTagId = signal<number | null>(null);

  protected readonly showManageModal = signal(false);
  protected readonly newTagName = signal('');
  protected readonly newTagColor = signal('#10b981');

  protected readonly colorPalette = [
    '#10b981',
    '#d4a843',
    '#3b82f6',
    '#8b5cf6',
    '#f43f5e',
    '#f97316',
    '#14b8a6',
    '#6b7280',
  ];

  ngOnInit(): void {
    this.loadTags();
    this.loadBookmarks();

    this.api.getLastRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (lr) => this.lastRead.set(lr), error: () => {} });
  }

  protected loadBookmarks(): void {
    this.loading.set(true);
    this.api.getBookmarks(this.selectedTagId(), { page: 1, pageSize: 500 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.bookmarks.set(r.items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  protected loadTags(): void {
    this.api.getBookmarkTags()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t) => this.tags.set(t)
      });
  }

  protected selectTag(tagId: number | null): void {
    this.selectedTagId.set(tagId);
    this.loadBookmarks();
  }

  protected deleteBookmark(id: number): void {
    this.api.deleteBookmark(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.bookmarks.update((list) => list.filter((b) => b.id !== id));
      });
  }

  protected openManageModal(): void {
    this.newTagName.set('');
    this.newTagColor.set('#10b981');
    this.showManageModal.set(true);
  }

  protected closeManageModal(): void {
    this.showManageModal.set(false);
  }

  protected selectColor(color: string): void {
    this.newTagColor.set(color);
  }

  protected createTag(): void {
    const name = this.newTagName().trim();
    if (!name) return;

    this.api.createBookmarkTag(name, this.newTagColor())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.newTagName.set('');
          this.loadTags();
        }
      });
  }

  protected removeTag(tagId: number): void {
    this.api.deleteBookmarkTag(tagId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.selectedTagId() === tagId) {
            this.selectedTagId.set(null);
          }
          this.loadTags();
          this.loadBookmarks();
        }
      });
  }
}
