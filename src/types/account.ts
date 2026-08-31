export interface AccountSession {
  id: string;
  customerId: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  expiresAt: string;
  csrf: string;
}

export const ACCOUNT_COOKIE = 'ct_session';
export const CSRF_COOKIE = 'ct_csrf';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 días
