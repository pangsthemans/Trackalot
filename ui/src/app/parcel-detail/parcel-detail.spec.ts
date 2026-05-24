import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { ParcelDetail } from './parcel-detail';
import { ParcelService } from '../services/parcel.service';
import { Parcel, ParcelEvent } from '../models/parcel.model';

const mockParcel: Parcel = {
  id: 1, senderName: 'Alice', recipientName: 'Bob',
  recipientAddress: '123 Main St', currentStatus: 'PENDING',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

const mockEvent: ParcelEvent = {
  parcelId: 1, occurredAt: '2024-01-01T01:00:00Z',
  eventType: 'STATUS_CHANGED', newStatus: 'IN_TRANSIT',
};

describe('ParcelDetail', () => {
  let fixture: ComponentFixture<ParcelDetail>;
  let component: ParcelDetail;
  let mockParcelService: {
    getById: ReturnType<typeof vi.fn>;
    events: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockParcelService = {
      getById: vi.fn(() => of(mockParcel)),
      events: vi.fn(() => of([mockEvent])),
      updateStatus: vi.fn(() => of({ ...mockParcel, currentStatus: 'IN_TRANSIT' })),
    };
    mockDialog = { open: vi.fn(() => ({ afterClosed: () => of(null) })) };
    mockSnackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ParcelDetail],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        // ActivatedRoute mock: gives the component an id of 1 from the URL
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        { provide: ParcelService, useValue: mockParcelService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParcelDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads parcel and events on init', () => {
    expect(mockParcelService.getById).toHaveBeenCalledWith(1);
    expect(mockParcelService.events).toHaveBeenCalledWith(1);
    expect(component.parcel()).toEqual(mockParcel);
    expect(component.events()).toEqual([mockEvent]);
  });

  it('renders the parcel sender name', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Alice');
  });

  it('renders an event row', () => {
    const rows = fixture.debugElement.queryAll(By.css('tr[mat-row]'));
    expect(rows.length).toBeGreaterThan(0);
  });

  it('opens the update status dialog on button click', () => {
    const btn = fixture.debugElement.query(By.css('button[mat-raised-button]'));
    btn.nativeElement.click();
    expect(mockDialog.open).toHaveBeenCalledTimes(1);
  });

  it('calls updateStatus and refreshes when dialog returns a status', fakeAsync(() => {
    mockDialog.open.mockReturnValue({ afterClosed: () => of('IN_TRANSIT') });
    component.openUpdateStatus();
    tick();
    expect(mockParcelService.updateStatus).toHaveBeenCalledWith(1, 'IN_TRANSIT');
    expect(mockSnackBar.open).toHaveBeenCalledWith('Status updated', '', expect.anything());
  }));

  it('does not call updateStatus when dialog is cancelled', fakeAsync(() => {
    mockDialog.open.mockReturnValue({ afterClosed: () => of(null) });
    component.openUpdateStatus();
    tick();
    expect(mockParcelService.updateStatus).not.toHaveBeenCalled();
  }));

  it('navigates back to /parcels on goBack()', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/parcels']);
  });
});
