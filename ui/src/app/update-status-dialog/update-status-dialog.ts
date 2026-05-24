import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

const STATUSES = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'];

@Component({
  selector: 'app-update-status-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './update-status-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateStatusDialog {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UpdateStatusDialog>);
  readonly data: { currentStatus: string } = inject(MAT_DIALOG_DATA);

  readonly statuses = STATUSES.filter(s => s !== this.data.currentStatus);

  form = this.fb.nonNullable.group({
    status: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue().status);
  }
}
