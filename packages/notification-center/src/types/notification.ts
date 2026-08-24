export interface NotificationItem<TPayload = unknown> {
  readonly id: string;
  readonly type: string;
  readonly readStatus: boolean;
  readonly payload: TPayload;
  readonly createdAt: string;
}
