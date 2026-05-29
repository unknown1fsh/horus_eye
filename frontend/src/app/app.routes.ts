import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/globe/globe-page.component').then(m => m.GlobePageComponent)
  },
  { path: '**', redirectTo: '' }
];
