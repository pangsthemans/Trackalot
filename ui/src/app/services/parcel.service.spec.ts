import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ParcelService } from './parcel.service';
import { Parcel, ParcelEvent } from '../models/parcel.model';

// HttpTestingController intercepts calls made by HttpClient and lets us
// assert the URL/method and flush a fake response — no real network needed.

const mockParcel: Parcel = {
  id: 1, senderName: 'Alice', recipientName: 'Bob',
  recipientAddress: '123 Main St', currentStatus: 'PENDING',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

describe('ParcelService', () => {
  let service: ParcelService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ParcelService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify()); // fail if any unexpected request was made

  it('list() GET /api/parcels', () => {
    service.list().subscribe(parcels => expect(parcels).toEqual([mockParcel]));
    http.expectOne('/api/parcels').flush([mockParcel]);
  });

  it('getById() GET /api/parcels/:id', () => {
    service.getById(1).subscribe(p => expect(p).toEqual(mockParcel));
    http.expectOne('/api/parcels/1').flush(mockParcel);
  });

  it('create() POST /api/parcels with body', () => {
    const body = { senderName: 'Alice', recipientName: 'Bob', recipientAddress: '123 Main St' };
    service.create(body).subscribe(p => expect(p).toEqual(mockParcel));
    const req = http.expectOne('/api/parcels');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockParcel);
  });

  it('updateStatus() PATCH /api/parcels/:id/status with body', () => {
    const updated = { ...mockParcel, currentStatus: 'IN_TRANSIT' };
    service.updateStatus(1, 'IN_TRANSIT').subscribe(p => expect(p).toEqual(updated));
    const req = http.expectOne('/api/parcels/1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'IN_TRANSIT' });
    req.flush(updated);
  });

  it('events() GET /api/parcels/:id/events', () => {
    const events: ParcelEvent[] = [
      { parcelId: 1, occurredAt: '2024-01-01T00:00:00Z', eventType: 'STATUS_CHANGED', newStatus: 'IN_TRANSIT' },
    ];
    service.events(1).subscribe(e => expect(e).toEqual(events));
    http.expectOne('/api/parcels/1/events').flush(events);
  });
});
