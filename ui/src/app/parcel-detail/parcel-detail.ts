import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ParcelService } from '../services/parcel.service';
import { Parcel, ParcelEvent } from '../models/parcel.model';
import { UpdateStatusDialog } from '../update-status-dialog/update-status-dialog';

@Component({
  selector: 'app-parcel-detail',
  imports: [
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatProgressSpinnerModule, MatDividerModule, DatePipe,
  ],
  templateUrl: './parcel-detail.html',
  styleUrl: './parcel-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private parcelService = inject(ParcelService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  parcel = signal<Parcel | null>(null);
  events = signal<ParcelEvent[]>([]);
  loading = signal(false);
  readonly eventColumns = ['occurredAt', 'eventType', 'newStatus'];

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(id: number) {
    this.loading.set(true);
    this.parcelService.getById(id).subscribe({
      next: (p) => {
        this.parcel.set(p);
        this.loadEvents(id);
      },
      error: () => {
        this.snackBar.open('Parcel not found', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  loadEvents(id: number) {
    this.parcelService.events(id).subscribe({
      next: (e) => { this.events.set(e); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openUpdateStatus() {
    const p = this.parcel();
    if (!p) return;
    this.dialog
      .open(UpdateStatusDialog, { width: '380px', data: { currentStatus: p.currentStatus } })
      .afterClosed()
      .subscribe(newStatus => {
        if (newStatus) {
          this.parcelService.updateStatus(p.id, newStatus).subscribe({
            next: (updated) => {
              this.parcel.set(updated);
              this.snackBar.open('Status updated', '', { duration: 3000 });
              this.loadEvents(p.id);
            },
            error: () => this.snackBar.open('Failed to update status', 'Dismiss', { duration: 4000 }),
          });
        }
      });
  }

  goBack() {
    this.router.navigate(['/parcels']);
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace('_', '-');
  }
}
