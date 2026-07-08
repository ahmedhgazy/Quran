import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.HomePage),
  },
  {
    path: 'surah/:number',
    loadComponent: () => import('./features/reader/reader').then((m) => m.ReaderPage),
  },
  {
    path: 'surah/:number/read',
    loadComponent: () => import('./features/mushaf/mushaf').then((m) => m.MushafPage),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search').then((m) => m.SearchPage),
  },
  {
    path: 'bookmarks',
    canActivate: [authGuard],
    loadComponent: () => import('./features/bookmarks/bookmarks').then((m) => m.BookmarksPage),
  },
  {
    path: 'reciters',
    loadComponent: () =>
      import('./features/reciters/reciters-list').then((m) => m.RecitersListPage),
  },
  {
    path: 'reciters/:id',
    loadComponent: () =>
      import('./features/reciters/reciter-detail/reciter-detail').then((m) => m.ReciterDetailPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then((m) => m.ProfilePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterPage),
  },
  { path: '**', redirectTo: '' },
];
