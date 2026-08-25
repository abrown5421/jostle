export class OAuthRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuthRequestError';
  }
}

export interface PostFormEncodedInput {
  endpoint: string;
  params: Record<string, string>;
  basicAuth?: { username: string; password: string };
}

export async function postFormEncoded<T>(input: PostFormEncodedInput): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (input.basicAuth) {
    const encoded = Buffer.from(
      `${input.basicAuth.username}:${input.basicAuth.password}`,
    ).toString('base64');
    headers['Authorization'] = `Basic ${encoded}`;
  }

  const response = await fetch(input.endpoint, {
    method: 'POST',
    headers,
    body: new URLSearchParams(input.params).toString(),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new OAuthRequestError(
      `Request to ${input.endpoint} failed with status ${response.status}: ${body}`,
    );
  }

  return (await response.json()) as T;
}

export async function getJsonWithBearerToken<T>(
  endpoint: string,
  accessToken: string,
): Promise<T> {
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new OAuthRequestError(
      `Request to ${endpoint} failed with status ${response.status}: ${body}`,
    );
  }

  return (await response.json()) as T;
}
