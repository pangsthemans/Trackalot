import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateParcelDialog } from './create-parcel-dialog';
import { ParcelService } from '../services/parcel.service';
import { Parcel } from '../models/parcel.model';

const mockParcel: Parcel = {
  id: 1, senderName: 'Alice', recipientName: 'Bob',
  recipientAddress: '123 Main St', currentStatus: 'PENDING',
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

describe('CreateParcelDialog', () => {
  let fixture: ComponentFixture<CreateParcelDialog>;
  let component: CreateParcelDialog;
  let mockParcelService: { create: ReturnType<typeof vi.fn> };
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockParcelService = { create: vi.fn(() => of(mockParcel)) };
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CreateParcelDialog],
      providers: [
        provideNoopAnimations(),
        { provide: ParcelService, useValue: mockParcelService },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateParcelDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('form is invalid when empty', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('form is valid when all fields are filled', () => {
    component.form.setValue({
      senderName: 'Alice',
      recipientName: 'Bob',
      recipientAddress: '123 Main St',
    });
    expect(component.form.valid).toBe(true);
  });

  it('submit() does nothing when form is invalid', () => {
    component.submit();
    expect(mockParcelService.create).not.toHaveBeenCalled();
  });

  it('submit() calls service.create with form values', () => {
    component.form.setValue({
      senderName: 'Alice',
      recipientName: 'Bob',
      recipientAddress: '123 Main St',
    });
    component.submit();
    expect(mockParcelService.create).toHaveBeenCalledWith({
      senderName: 'Alice',
      recipientName: 'Bob',
      recipientAddress: '123 Main St',
    });
  });

  it('closes the dialog with the created parcel on success', () => {
    component.form.setValue({
      senderName: 'Alice',
      recipientName: 'Bob',
      recipientAddress: '123 Main St',
    });
    component.submit();
    expect(mockDialogRef.close).toHaveBeenCalledWith(mockParcel);
  });
});
