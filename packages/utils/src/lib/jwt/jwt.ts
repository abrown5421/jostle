export const decodeJwt = (token: string): { sub: string; [key: string]: any } => {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload));
};