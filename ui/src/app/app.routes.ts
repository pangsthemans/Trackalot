import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'parcels', pathMatch: 'full' },
  {
    path: 'parcels',
    loadComponent: () => import('./parcel-list/parcel-list').then(m => m.ParcelList),
  },
  {
    path: 'parcels/:id',
    loadComponent: () => import('./parcel-detail/parcel-detail').then(m => m.ParcelDetail),
  },
];
