import type { SelectedSettingsMap } from '../config-form/types.js';

export interface SessionConfigurationSnapshot {
  readonly gameId: string | null;
  readonly selectedSettings: SelectedSettingsMap;
}

export interface SessionConfigurationClient {
  readonly getSessionConfiguration: (sessionId: string) => Promise<SessionConfigurationSnapshot | null>;
}
