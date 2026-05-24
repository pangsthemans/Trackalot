import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ParcelService } from '../services/parcel.service';

@Component({
  selector: 'app-create-parcel-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './create-parcel-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateParcelDialog {
  private fb = inject(FormBuilder);
  private parcelService = inject(ParcelService);
  private dialogRef = inject(MatDialogRef<CreateParcelDialog>);

  form = this.fb.nonNullable.group({
    senderName: ['', Validators.required],
    recipientName: ['', Validators.required],
    recipientAddress: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.parcelService.create(this.form.getRawValue()).subscribe({
      next: (parcel) => this.dialogRef.close(parcel),
      error: () => this.form.setErrors({ serverError: true }),
    });
  }
}
