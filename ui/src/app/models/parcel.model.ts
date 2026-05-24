export interface Parcel {
  id: number;
  senderName: string;
  recipientName: string;
  recipientAddress: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParcelEvent {
  parcelId: number;
  occurredAt: string;
  eventType: string;
  newStatus: string;
}

export interface CreateParcelRequest {
  senderName: string;
  recipientName: string;
  recipientAddress: string;
}
