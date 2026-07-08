export type AuthProviderType = 'spotify' | 'apple-music' | string;

export type ConnectionStatus = 'active' | 'expired' | 'revoked';

export interface ProviderCredentials {
    readonly accessToken: string;
    readonly refreshToken?: string;
    readonly expiresAt?: string;
    readonly scope?: readonly string[];
    readonly [customParam: string]: unknown;
}

export interface ConnectedAccount {
    readonly _id: string;
    readonly userId: string;
    readonly provider: AuthProviderType;
    readonly providerAccountId: string;
    readonly providerUsername?: string;
    readonly credentials: ProviderCredentials;
    readonly status: ConnectionStatus;
    readonly createdAt: string;
    readonly updatedAt: string;
}