// Thin fetch wrapper around apps/api's /auth routes. Kept local to
// apps/web rather than a shared package — it's tightly coupled to this
// one API's request/response shapes and has a single consumer.
export interface AuthUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
}

export interface SignupInput {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface UserResponse {
  user: AuthUser;
}

interface ErrorResponse {
  error: string;
}

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

async function postJson(path: string, body: unknown): Promise<AuthUser> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as UserResponse | ErrorResponse | null;
  if (!response.ok) {
    throw new Error((data && 'error' in data && data.error) || DEFAULT_ERROR);
  }
  return (data as UserResponse).user;
}

export function signup(input: SignupInput): Promise<AuthUser> {
  return postJson('/auth/signup', input);
}

export function login(input: LoginInput): Promise<AuthUser> {
  return postJson('/auth/login', input);
}

export async function logout(): Promise<void> {
  await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch('/auth/me', { credentials: 'include' });
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as UserResponse | null;
  return data?.user ?? null;
}
