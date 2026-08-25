export interface BuildAuthorizationUrlInput {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  codeChallenge: string;
}

export function buildAuthorizationUrl(input: BuildAuthorizationUrlInput): string {
  const url = new URL(input.authorizationEndpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', input.clientId);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('scope', input.scopes.join(' '));
  url.searchParams.set('state', input.state);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', input.codeChallenge);
  return url.toString();
}
