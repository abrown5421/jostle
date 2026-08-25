export type PlaybackEngineStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'not_ready'
  | 'unsupported'
  | 'auth_error'
  | 'non_premium';

export interface PlaybackEngine {
  readonly status: PlaybackEngineStatus;
  readonly deviceId: string | null;
  readonly playClipAt: (trackUri: string, positionMs: number) => Promise<void>;
  readonly pause: () => Promise<void>;
}
