import type { ObjectId } from 'mongodb';

export interface NotificationDocument<TPayload = unknown> {
  readonly _id: ObjectId;
  readonly recipientId: ObjectId;
  readonly type: string;
  readonly readStatus: boolean;
  readonly payload: TPayload;
  readonly createdAt: Date;
}

export interface PublicNotification<TPayload = unknown> {
  readonly id: string;
  readonly recipientId: string;
  readonly type: string;
  readonly readStatus: boolean;
  readonly payload: TPayload;
  readonly createdAt: string;
}
