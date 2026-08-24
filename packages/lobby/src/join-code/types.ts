export interface JoinCodeDisplayProps {
  readonly joinCode: string;
  readonly className?: string;
}

export interface QrCodeProps {
  readonly joinCode: string;
  readonly size?: number;
  readonly className?: string;
}
