import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateParcelRequest, Parcel, ParcelEvent } from '../models/parcel.model';

@Injectable({ providedIn: 'root' })
export class ParcelService {
  private http = inject(HttpClient);

  list() {
    return this.http.get<Parcel[]>('/api/parcels');
  }

  getById(id: number) {
    return this.http.get<Parcel>(`/api/parcels/${id}`);
  }

  create(body: CreateParcelRequest) {
    return this.http.post<Parcel>('/api/parcels', body);
  }

  updateStatus(id: number, status: string) {
    return this.http.patch<Parcel>(`/api/parcels/${id}/status`, { status });
  }

  events(id: number) {
    return this.http.get<ParcelEvent[]>(`/api/parcels/${id}/events`);
  }
}
