export interface IntegrationStatus {
  readonly provider: string;
  readonly displayName: string;
  readonly logoUrl: string;
  readonly connected: boolean;
  readonly providerAccountId?: string;
  readonly scopes?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly connectedAt?: string;
}

export interface IntegrationsClient {
  readonly listIntegrations: () => Promise<readonly IntegrationStatus[]>;
  readonly disconnectIntegration: (provider: string) => Promise<void>;
}
