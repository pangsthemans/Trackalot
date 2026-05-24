import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ParcelService } from '../services/parcel.service';
import { Parcel } from '../models/parcel.model';
import { CreateParcelDialog } from '../create-parcel-dialog/create-parcel-dialog';

@Component({
  selector: 'app-parcel-list',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, DatePipe],
  templateUrl: './parcel-list.html',
  styleUrl: './parcel-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelList implements OnInit {
  private parcelService = inject(ParcelService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  parcels = signal<Parcel[]>([]);
  loading = signal(false);
  readonly columns = ['id', 'senderName', 'recipientName', 'recipientAddress', 'currentStatus', 'updatedAt', 'actions'];

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.parcelService.list().subscribe({
      next: (data) => { this.parcels.set(data); this.loading.set(false); },
      error: () => { this.snackBar.open('Failed to load parcels', 'Dismiss', { duration: 4000 }); this.loading.set(false); },
    });
  }

  viewParcel(id: number) {
    this.router.navigate(['/parcels', id]);
  }

  openCreate() {
    this.dialog.open(CreateParcelDialog, { width: '480px' }).afterClosed().subscribe(created => {
      if (created) {
        this.snackBar.open('Parcel created', '', { duration: 3000 });
        this.load();
      }
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }
}
