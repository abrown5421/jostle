export interface JoinFormFields {
  readonly joinCode: string;
  readonly displayName: string;
}

export interface JoinFormErrors {
  readonly joinCode?: string;
  readonly displayName?: string;
}
