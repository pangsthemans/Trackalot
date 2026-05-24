import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { ParcelList } from './parcel-list';
import { ParcelService } from '../services/parcel.service';
import { Parcel } from '../models/parcel.model';

// fakeAsync + tick() lets us step through asynchronous observable emissions
// without real timers. tick() drains the microtask queue synchronously.

const mockParcel: Parcel = {
  id: 1, senderName: 'Alice', recipientName: 'Bob',
  recipientAddress: '123 Main St', currentStatus: 'PENDING',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

describe('ParcelList', () => {
  let fixture: ComponentFixture<ParcelList>;
  let component: ParcelList;
  let mockParcelService: { list: ReturnType<typeof vi.fn> };
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockParcelService = { list: vi.fn(() => of([mockParcel])) };
    mockDialog = { open: vi.fn(() => ({ afterClosed: () => of(null) })) };
    mockSnackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ParcelList],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ParcelService, useValue: mockParcelService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ParcelList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('calls list() on init and stores the result', () => {
    expect(mockParcelService.list).toHaveBeenCalledTimes(1);
    expect(component.parcels()).toEqual([mockParcel]);
  });

  it('renders a table row for each parcel', () => {
    const rows = fixture.debugElement.queryAll(By.css('.parcel-row'));
    expect(rows).toHaveLength(1);
  });

  it('shows empty state when the list is empty', () => {
    mockParcelService.list.mockReturnValue(of([]));
    component.load();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.empty-state'))).toBeTruthy();
  });

  it('hides the table in the empty state', () => {
    mockParcelService.list.mockReturnValue(of([]));
    component.load();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('table'))).toBeNull();
  });

  it('opens the create dialog when the New Parcel button is clicked', () => {
    const btn = fixture.debugElement.query(By.css('button[mat-raised-button]'));
    btn.nativeElement.click();
    expect(mockDialog.open).toHaveBeenCalledTimes(1);
  });

  it('reloads the list when the create dialog closes with a parcel', fakeAsync(() => {
    mockDialog.open.mockReturnValue({ afterClosed: () => of(mockParcel) });
    component.openCreate();
    tick();
    // once on init, once after dialog closed
    expect(mockParcelService.list).toHaveBeenCalledTimes(2);
  }));

  it('does not reload when the create dialog is cancelled (closed with null)', fakeAsync(() => {
    mockDialog.open.mockReturnValue({ afterClosed: () => of(null) });
    component.openCreate();
    tick();
    expect(mockParcelService.list).toHaveBeenCalledTimes(1);
  }));

  it('navigates to parcel detail on viewParcel()', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
    component.viewParcel(1);
    expect(router.navigate).toHaveBeenCalledWith(['/parcels', 1]);
  });

  it('statusClass converts status to css class name', () => {
    expect(component.statusClass('IN_TRANSIT')).toBe('in-transit');
    expect(component.statusClass('PENDING')).toBe('pending');
    expect(component.statusClass('DELIVERED')).toBe('delivered');
  });
});
