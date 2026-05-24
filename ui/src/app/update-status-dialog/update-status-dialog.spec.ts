import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UpdateStatusDialog } from './update-status-dialog';

describe('UpdateStatusDialog', () => {
  let fixture: ComponentFixture<UpdateStatusDialog>;
  let component: UpdateStatusDialog;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  async function setup(currentStatus: string) {
    mockDialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [UpdateStatusDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { currentStatus } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateStatusDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('excludes the current status from the available options', async () => {
    await setup('PENDING');
    expect(component.statuses).not.toContain('PENDING');
    expect(component.statuses).toContain('IN_TRANSIT');
    expect(component.statuses).toContain('DELIVERED');
    expect(component.statuses).toContain('RETURNED');
  });

  it('form is invalid when no status is selected', async () => {
    await setup('PENDING');
    expect(component.form.invalid).toBe(true);
  });

  it('submit() does nothing when form is invalid', async () => {
    await setup('PENDING');
    component.submit();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('submit() closes the dialog with the selected status', async () => {
    await setup('PENDING');
    component.form.setValue({ status: 'IN_TRANSIT' });
    component.submit();
    expect(mockDialogRef.close).toHaveBeenCalledWith('IN_TRANSIT');
  });

  it('has 3 status options when current is PENDING (4 total minus 1)', async () => {
    await setup('PENDING');
    expect(component.statuses).toHaveLength(3);
  });
});
